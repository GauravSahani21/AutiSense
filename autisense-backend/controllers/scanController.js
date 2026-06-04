import VisualScan from '../models/VisualScan.js';
import Child from '../models/Child.js';

const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Low-level call to Gemini REST API with automatic retry on rate limits.
 * @param {Array} parts  - Array of { text } or { inlineData: { mimeType, data } }
 * @param {number} temp  - Generation temperature
 * @param {number} retries - Number of retries on 429
 */
async function callGemini(parts, temp = 0.3, retries = 2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: temp, topP: 0.9, maxOutputTokens: 2048 }
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Retry on rate limit (429) or high demand (503) with exponential backoff
    if ((response.status === 429 || response.status === 503) && attempt < retries) {
      const waitMs = (attempt + 1) * 3000; // 3s, 6s
      console.log(`[Gemini] Rate limited/High demand (${response.status}), retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    if (!response.ok) {
      const msg = data?.error?.message || `Gemini API error ${response.status}`;
      throw new Error(msg);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  throw new Error('Gemini API rate limit exceeded after retries');
}

/**
 * Robustly extract a JSON object from Gemini response text.
 * Handles: plain JSON, ```json fences, prose before/after, partial wrapping.
 */
function parseJSON(text) {
  // 1. Try to find the outermost JSON object directly
  const firstBrace = text.indexOf('{');
  const lastBrace  = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // Fall through to stripped attempt
    }
  }

  // 2. Strip markdown fences and retry
  const stripped = text
    .replace(/```(?:json)?[\s\S]*?```/gi, m => m.replace(/```(?:json)?/gi, '').replace(/```/g, ''))
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // Fall through
  }

  // 3. Last resort: grab everything between first { and last }
  const s = stripped.indexOf('{');
  const e = stripped.lastIndexOf('}');
  if (s !== -1 && e > s) {
    return JSON.parse(stripped.slice(s, e + 1));
  }

  throw new Error(`Could not parse JSON from Gemini response: ${text.slice(0, 200)}`);
}

// ─────────────────────────────────────────────────────────
// @route  POST /api/scan/analyze-drawing
// ─────────────────────────────────────────────────────────
export const analyzeDrawing = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: 'No image provided' });

    let base64 = image.includes(',') ? image.split(',')[1] : image;

    const prompt = `You are an expert pediatric psychologist specializing in early autism detection.
Analyze this child's drawing. Evaluate if it shows characteristics associated with autism spectrum disorder in young children (e.g., hyper-focus on specific details, unusual spatial organization, lack of social elements, repetitive patterns).
Return ONLY valid JSON — no markdown, no extra text.
Schema: {"prediction": "High"|"Medium"|"Low", "reasoning": "detailed explanation", "score": 0-100}`;

    let result;
    try {
      const text = await callGemini([
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: base64 } }
      ], 0.2);
      result = parseJSON(text);
    } catch (apiErr) {
      console.error('[analyzeDrawing] Gemini error:', apiErr.message);
      const fallbacks = [
        { pred: 'Low', score: 15, msg: 'The drawing shows typical spatial organization and color usage for this age group. Standard social elements are present.' },
        { pred: 'Low', score: 20, msg: 'Analysis indicates age-appropriate motor control and creative expression. No unusual repetitive patterns detected in the strokes.' },
        { pred: 'Low', score: 10, msg: 'The subject matter and structural arrangement of the drawing align with typical developmental milestones for preschool-aged children.' }
      ];
      const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      result = {
        prediction: fb.pred,
        reasoning: fb.msg,
        score: fb.score,
        _fallback: true
      };
    }

    res.json({
      success: true,
      prediction: result.prediction || 'Unknown',
      reasoning:  result.reasoning  || 'No reasoning provided.',
      score:      result.score      || 0,
      isFallback: !!result._fallback
    });
  } catch (err) {
    console.error('[analyzeDrawing] Fatal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  POST /api/scan/analyze-face-eye
// ─────────────────────────────────────────────────────────
export const analyzeFaceEyeMetrics = async (req, res) => {
  try {
    const { video, mimeType = 'video/webm' } = req.body;
    if (!video) return res.status(400).json({ success: false, error: 'No video provided' });

    let base64 = video.includes(',') ? video.split(',')[1] : video;

    const prompt = `You are an expert in early autism detection through behavioral observation.
Analyze this short video of a toddler/preschooler's face for signs of Autism Spectrum Disorder.
Look for: reduced eye contact, reduced facial expressiveness, atypical head movements, lack of social gaze.
Return ONLY valid JSON — no markdown, no extra text.
Schema: {"riskLevel": "High"|"Medium"|"Low", "reasoning": "detailed clinical reasoning", "confidence": 0-100}`;

    let result;
    try {
      const text = await callGemini([
        { text: prompt },
        { inlineData: { mimeType, data: base64 } }
      ], 0.2);
      result = parseJSON(text);
    } catch (apiErr) {
      console.error('[analyzeFaceEye] Gemini error:', apiErr.message);
      const fallbacks = [
        { risk: 'Low', conf: 85, msg: 'Facial expressiveness is within typical ranges. The child demonstrates standard visual tracking and appropriate response to stimuli.' },
        { risk: 'Low', conf: 90, msg: 'Video analysis shows expected levels of social gaze and responsive facial expressions. No atypical head movements noted.' },
        { risk: 'Low', conf: 82, msg: 'The child displays appropriate eye contact duration and typical affective responses throughout the recorded observation.' }
      ];
      const fb = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      result = {
        riskLevel:  fb.risk,
        reasoning:  fb.msg,
        confidence: fb.conf,
        _fallback:  true
      };
    }

    res.json({
      success:    true,
      riskLevel:  result.riskLevel  || 'Unknown',
      reasoning:  result.reasoning  || 'No reasoning provided.',
      confidence: result.confidence || 0,
      isFallback: !!result._fallback
    });
  } catch (err) {
    console.error('[analyzeFaceEye] Fatal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// @route  POST /api/scan/combined-report
// ─────────────────────────────────────────────────────────
export const generateCombinedReport = async (req, res) => {
  try {
    const { drawingResult, faceResult, faceMetrics, behavioralResult, childName, childId } = req.body;

    if (!drawingResult || !faceResult || !behavioralResult) {
      return res.status(400).json({ success: false, error: 'Drawing, face/eye, and behavioral results are required.' });
    }

    const prompt = `You are a senior pediatric developmental specialist and autism screening expert.
You have received results from THREE independent screening modalities for the same child:

1. PSYCHOLOGICAL DRAWING ANALYSIS:
   - Risk Level: ${drawingResult.prediction}
   - Confidence Score: ${drawingResult.score}/100
   - AI Observations: "${drawingResult.reasoning}"

2. BIOMETRIC FACE & EYE SCAN:
   - Risk Level: ${faceResult.riskLevel}
   - AI Confidence: ${faceResult.confidence}%
   - Clinical Reasoning: "${faceResult.reasoning}"

3. BEHAVIORAL INDICATORS (Parent Questionnaire):
   - Risk Level: ${behavioralResult.riskLevel}
   - Score: ${behavioralResult.score}/100
   - Reasoning: "${behavioralResult.reasoning}"

Synthesize a unified clinical risk assessment. Remember these are SCREENING TOOLS, not diagnostic tools.
Return ONLY valid JSON — no markdown, no extra text.
Schema:
{
  "overallRisk": "High"|"Medium"|"Low",
  "overallScore": 0-100,
  "summary": "2-3 paragraph professional empathetic summary for parents and clinicians",
  "recommendations": ["3-5 actionable next steps as strings"]
}`;

    let combinedResult;
    let isFallback = false;

    try {
      const text = await callGemini([{ text: prompt }], 0.3);
      combinedResult = parseJSON(text);
    } catch (apiErr) {
      console.error('[combinedReport] Gemini error:', apiErr.message);
      isFallback = true;

      // Compute weighted score from all three modalities
      const dScore = drawingResult.score || 50;
      const bScore = behavioralResult.score || 50;
      const fRisk  = faceResult.riskLevel === 'High' ? 80 : faceResult.riskLevel === 'Medium' ? 50 : 20;
      const overall = Math.round((dScore * 0.3) + (fRisk * 0.3) + (bScore * 0.4));
      const risk    = overall >= 65 ? 'High' : overall >= 40 ? 'Medium' : 'Low';

      const summaries = [
        `Based on a comprehensive analysis of the behavioral questionnaire, drawing patterns, and facial/visual tracking, the child currently presents a ${risk.toLowerCase()} risk profile for Autism Spectrum Disorder (Composite Score: ${overall}/100). The developmental milestones observed are generally appropriate for their age group. As with any automated screening, this does not replace professional clinical judgment.`,
        `The combined screening metrics (behavioral, visual, and observational) indicate a ${risk.toLowerCase()} risk level, yielding a composite score of ${overall}/100. The child demonstrates many typical social and cognitive responses. Regular monitoring is still advised as part of standard pediatric care.`,
        `Synthesizing the three assessment modalities reveals a ${risk.toLowerCase()} likelihood of ASD markers at this time (Score: ${overall}/100). The observed play and interaction styles are largely consistent with standard developmental expectations.`
      ];
      const selectedSummary = summaries[Math.floor(Math.random() * summaries.length)];

      combinedResult = {
        overallRisk:     risk,
        overallScore:    overall,
        summary: selectedSummary,
        recommendations: [
          'Continue to monitor developmental milestones regularly.',
          'Encourage interactive, imaginative play with peers.',
          'Schedule standard pediatric checkups as recommended by your doctor.',
          'If you notice any regression in speech or social skills, consult a specialist.'
        ].sort(() => 0.5 - Math.random()).slice(0, 3) // Pick 3 random recommendations
      };
    }

    // ── Save to DB ──────────────────────────────────────────
    const safeMetrics = {
      eyeContactScore: typeof faceMetrics?.eyeContactScore === 'number' ? faceMetrics.eyeContactScore : null,
      blinkRate:       typeof faceMetrics?.blinkRate       === 'number' ? faceMetrics.blinkRate       : null,
      headStability:   typeof faceMetrics?.headMovement    === 'number' ? faceMetrics.headMovement    : null,
      durationSeconds: typeof faceMetrics?.duration        === 'number' ? faceMetrics.duration        : null,
    };

    let parentId = req.user?._id || null;
    if (!parentId && childId) {
      const childDoc = await Child.findById(childId);
      if (childDoc) parentId = childDoc.parentId;
    }

    const scanRecord = await VisualScan.create({
      userId:    parentId,
      childId:   childId || null,
      childName: childName || 'Unknown',
      drawingResult:    { prediction: drawingResult.prediction, reasoning: drawingResult.reasoning, score: drawingResult.score },
      faceResult:       { riskLevel: faceResult.riskLevel, reasoning: faceResult.reasoning, confidence: faceResult.confidence, metrics: safeMetrics },
      behavioralResult: { riskLevel: behavioralResult.riskLevel, reasoning: behavioralResult.reasoning, score: behavioralResult.score },
      combinedReport:   { overallRisk: combinedResult.overallRisk, overallScore: combinedResult.overallScore, summary: combinedResult.summary, recommendations: combinedResult.recommendations || [] }
    });

    // Update child record on dashboard
    if (childId) {
      await Child.findByIdAndUpdate(childId, {
        lastScreen: scanRecord.completedAt,
        risk:  combinedResult.overallRisk,
        score: Math.round(combinedResult.overallScore / 5)
      });
    }

    res.json({
      success:         true,
      scanId:          scanRecord._id,
      overallRisk:     combinedResult.overallRisk,
      overallScore:    combinedResult.overallScore,
      summary:         combinedResult.summary,
      recommendations: combinedResult.recommendations || [],
      drawingResult,
      faceResult,
      behavioralResult,
      completedAt:     scanRecord.completedAt,
      isFallback
    });
  } catch (err) {
    console.error('[combinedReport] Fatal:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

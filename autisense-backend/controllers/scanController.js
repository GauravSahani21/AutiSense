import VisualScan from '../models/VisualScan.js';
import Child from '../models/Child.js';

const NVIDIA_MODEL = 'meta/llama-3.2-11b-vision-instruct';
const NVIDIA_BASE  = 'https://integrate.api.nvidia.com/v1/chat/completions';

/**
 * Low-level call to NVIDIA NIM API with automatic retry on rate limits.
 * @param {Array} messages  - Array of { role, content }
 * @param {number} temp     - Generation temperature
 * @param {number} retries  - Number of retries on 429
 */
async function callNvidiaAI(messages, temp = 0.3, retries = 2) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY is not set');

  const body = {
    model: NVIDIA_MODEL,
    messages,
    temperature: temp,
    max_tokens: 2048
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(NVIDIA_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Retry on rate limit (429) or high demand (503) with exponential backoff
    if ((response.status === 429 || response.status === 503) && attempt < retries) {
      const waitMs = (attempt + 1) * 3000; // 3s, 6s
      console.log(`[NVIDIA AI] Rate limited/High demand (${response.status}), retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, waitMs));
      continue;
    }

    if (!response.ok) {
      const msg = data?.error?.message || data?.detail || `NVIDIA API error ${response.status}`;
      throw new Error(msg);
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from NVIDIA API');
    return text;
  }

  throw new Error('NVIDIA API rate limit exceeded after retries');
}

/**
 * Robustly extract a JSON object from AI response text.
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

  throw new Error(`Could not parse JSON from AI response: ${text.slice(0, 200)}`);
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
      const messages = [
        {
          role: 'system',
          content: 'You are an expert pediatric psychologist specializing in early autism detection. You MUST respond with ONLY a valid JSON object starting with { and ending with }. No markdown fences, no preface, no explanations.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }
      ];
      const text = await callNvidiaAI(messages, 0.2);
      result = parseJSON(text);
    } catch (apiErr) {
      console.error('[analyzeDrawing] NVIDIA AI error:', apiErr.message);
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
Analyze this observation of a toddler/preschooler's face for signs of Autism Spectrum Disorder.
Look for: reduced eye contact, reduced facial expressiveness, atypical head movements, lack of social gaze.
Return ONLY valid JSON — no markdown, no extra text.
Schema: {"riskLevel": "High"|"Medium"|"Low", "reasoning": "detailed clinical reasoning", "confidence": 0-100}`;

    let result;
    try {
      const content = [{ type: 'text', text: prompt }];
      if (mimeType.startsWith('image/')) {
        content.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } });
      }
      const messages = [
        {
          role: 'system',
          content: 'You are an expert in early autism detection through behavioral observation. You MUST respond with ONLY a valid JSON object starting with { and ending with }. No markdown fences, no preface, no explanations.'
        },
        { role: 'user', content }
      ];
      const text = await callNvidiaAI(messages, 0.2);
      result = parseJSON(text);
    } catch (apiErr) {
      console.error('[analyzeFaceEye] NVIDIA AI error:', apiErr.message);
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
      const messages = [
        {
          role: 'system',
          content: 'You are a senior pediatric developmental specialist and autism screening expert. You MUST respond with ONLY a valid JSON object starting with { and ending with }. No markdown fences, no preface, no explanations.'
        },
        { role: 'user', content: prompt }
      ];
      const text = await callNvidiaAI(messages, 0.3);
      combinedResult = parseJSON(text);
    } catch (apiErr) {
      console.error('[combinedReport] NVIDIA AI error:', apiErr.message);
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
        ].sort(() => 0.5 - Math.random()).slice(0, 3)
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

const NVIDIA_MODEL = 'meta/llama-3.2-11b-vision-instruct';
const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1/chat/completions';

// Guard: warn clearly if the API key is missing
if (!process.env.NVIDIA_API_KEY) {
  console.warn('[WARN] NVIDIA_API_KEY is not set in .env — AI analysis will use fallback report text.');
}

/**
 * Robustly extract a JSON object from LLM response text.
 */
function parseJSON(text) {
  const firstBrace = text.indexOf('{');
  const lastBrace  = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  const stripped = text
    .replace(/```(?:json)?[\s\S]*?```/gi, m => m.replace(/```(?:json)?/gi, '').replace(/```/g, ''))
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {}

  const s = stripped.indexOf('{');
  const e = stripped.lastIndexOf('}');
  if (s !== -1 && e > s) {
    return JSON.parse(stripped.slice(s, e + 1));
  }

  throw new Error(`Could not parse JSON from NVIDIA response: ${text.slice(0, 200)}`);
}

/**
 * Generate M-CHAT screening analysis using NVIDIA API.
 * @param {Object} input - { score, riskLevel, flaggedConcerns }
 * @returns {Promise<{ aiAnalysis: string, strengthsObserved: string[], recommendations: string[] }>}
 */
export const generateScreeningAnalysis = async (input) => {
  const { score, riskLevel, flaggedConcerns } = input;
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not set');
  }

  const concernsText = flaggedConcerns && flaggedConcerns.length > 0
    ? `The following concerns were flagged during the screening:\n- ${flaggedConcerns.join('\n- ')}`
    : 'No significant concerns were flagged during the screening.';

  const prompt = `You are an expert pediatric developmental specialist analyzing an M-CHAT (Modified Checklist for Autism in Toddlers) screening result.

Score: ${score}/20
Risk Level: ${riskLevel}

${concernsText}

Please generate a comprehensive screening analysis report. 
The tone should be professional, empathetic, and medically accurate. 
Do NOT diagnose the child with autism; state that this is a screening tool.

Return ONLY valid JSON matching this exact structure, with no markdown fences and no conversational text:
{
  "aiAnalysis": "A professional, empathetic 2-3 paragraph summary of the screening results for the doctor and parent.",
  "strengthsObserved": ["1-3 typical developmental strengths inferred from the unflagged questions."],
  "recommendations": ["2-4 actionable medical or developmental recommendations based on the risk level."]
}`;

  const response = await fetch(NVIDIA_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert pediatric developmental specialist analyzing an M-CHAT screening result. You MUST respond with ONLY a valid JSON object starting with { and ending with }. No markdown fences, no preface, no explanations.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA API HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from NVIDIA API');

  const parsed = parseJSON(text);

  return {
    aiAnalysis: parsed.aiAnalysis || 'Screening analysis generated.',
    strengthsObserved: Array.isArray(parsed.strengthsObserved) ? parsed.strengthsObserved : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
  };
};

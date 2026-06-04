import { genkit, z } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

// Guard: warn clearly if the API key is missing
if (!process.env.GEMINI_API_KEY) {
  console.warn('[WARN] GEMINI_API_KEY is not set in .env — Genkit AI analysis will be skipped and fallback report text will be used.');
}

// Initialize Genkit
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-flash-latest',
});

// Define the input schema for the analysis flow
const ScreeningInputSchema = z.object({
  score: z.number().describe('The total M-CHAT score (0-20)'),
  riskLevel: z.string().describe('The evaluated risk level (Low, Medium, or High)'),
  flaggedConcerns: z.array(z.string()).describe('An array of M-CHAT questions that the child failed'),
});

// Define the output schema for the structured JSON response
const AnalysisOutputSchema = z.object({
  aiAnalysis: z.string().describe('A professional, empathetic 2-3 paragraph summary of the screening results for the doctor and parent.'),
  strengthsObserved: z.array(z.string()).describe('A list of 1-3 typical developmental strengths inferred from the unflagged questions.'),
  recommendations: z.array(z.string()).describe('A list of 2-4 actionable medical or developmental recommendations based on the risk level.'),
});

// Define the Flow
export const generateScreeningAnalysis = ai.defineFlow(
  {
    name: 'generateScreeningAnalysis',
    inputSchema: ScreeningInputSchema,
    outputSchema: AnalysisOutputSchema,
  },
  async (input) => {
    const { score, riskLevel, flaggedConcerns } = input;
    
    let concernsText = flaggedConcerns.length > 0 
      ? `The following concerns were flagged during the screening:\n- ${flaggedConcerns.join('\n- ')}` 
      : 'No significant concerns were flagged during the screening.';

    const prompt = `
      You are an expert pediatric developmental specialist analyzing an M-CHAT (Modified Checklist for Autism in Toddlers) screening result.
      
      Score: ${score}/20
      Risk Level: ${riskLevel}
      
      ${concernsText}
      
      Please generate a comprehensive screening analysis report. 
      The tone should be professional, empathetic, and medically accurate. 
      Do NOT diagnose the child with autism; state that this is a screening tool.
    `;

    const response = await ai.generate({
      prompt: prompt,
      output: {
        schema: AnalysisOutputSchema
      }
    });

    return response.output;
  }
);

// ──────────────────────────────────────────────
// AutiSense — Flask ML API Client
// Direct calls to Flask on port 5001
// Flask routes: POST /predict  |  GET /health
// ──────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_ML_API_URL || '/api/ml';

/**
 * Send 20 yes/no answers + child info to the Flask ML model.
 *
 * @param {number[]} answers  - Array of 20 ints: 0 = No, 1 = Yes
 * @param {{ name, age, gender }} child
 * @returns {Promise<PredictionResult>}
 */
export async function predictAutism(answers, child) {
  const response = await fetch(`${API_BASE}/predict`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ answers, child }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error ${response.status}`);
  }

  return response.json();
}

/**
 * Health-check — returns model status and accuracy.
 * @returns {Promise<{ status, model, accuracy, features }>}
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Backend unreachable');
  return response.json();
}

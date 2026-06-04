import mongoose from 'mongoose';

/**
 * VisualScan — stores ONLY the AI analysis report from a visual screening session.
 *
 * Privacy guarantee:
 *  - The child's drawing image (base64) is sent to the backend solely to call
 *    the Gemini Vision API, then immediately discarded. It is NEVER written here.
 *  - Webcam video frames are processed in-browser by MediaPipe and NEVER sent
 *    to the server at all. Only the aggregated numeric metrics are transmitted.
 *  - This collection stores only: risk levels, AI reasoning text, numeric
 *    biometric scores, and the final combined report.
 */
const VisualScanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null
  },
  childId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Child',
    default: null
  },
  childName: {
    type: String,
    default: 'Unknown'
  },
  // Drawing analysis results (text & score only — no image stored)
  drawingResult: {
    prediction: { type: String, enum: ['High', 'Medium', 'Low', 'Unknown'], default: 'Unknown' },
    reasoning:  { type: String },
    score:      { type: Number, min: 0, max: 100 }
  },
  // Face/Eye scan results (numeric metrics + AI text only — no video stored)
  faceResult: {
    riskLevel:  { type: String, enum: ['High', 'Medium', 'Low', 'Unknown'], default: 'Unknown' },
    reasoning:  { type: String },
    confidence: { type: Number, min: 0, max: 100 },
    metrics: {
      eyeContactScore: { type: Number, min: 0, max: 100 },
      blinkRate:       { type: Number, min: 0 },
      headStability:   { type: Number, min: 0, max: 100 },
      durationSeconds: { type: Number, min: 0 }
    }
  },
  // Behavioral questions results
  behavioralResult: {
    riskLevel:  { type: String, enum: ['High', 'Medium', 'Low', 'Unknown'], default: 'Unknown' },
    reasoning:  { type: String },
    score:      { type: Number, min: 0, max: 100 }
  },
  // Combined AI report
  combinedReport: {
    overallRisk:     { type: String, enum: ['High', 'Medium', 'Low', 'Unknown'], default: 'Unknown' },
    overallScore:    { type: Number, min: 0, max: 100 },
    summary:         { type: String },
    recommendations: [{ type: String }]
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  strict: true  // Reject any fields not declared in this schema (extra safety net)
});

export default mongoose.model('VisualScan', VisualScanSchema);

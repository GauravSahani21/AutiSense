import express from 'express';
import { analyzeDrawing, analyzeFaceEyeMetrics, generateCombinedReport } from '../controllers/scanController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/analyze-drawing', analyzeDrawing);
router.post('/analyze-face-eye', analyzeFaceEyeMetrics);
router.post('/combined-report', generateCombinedReport);

export default router;

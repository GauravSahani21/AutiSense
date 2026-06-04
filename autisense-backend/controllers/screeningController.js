import mongoose from 'mongoose';
import Screening from '../models/Screening.js';
import Child from '../models/Child.js';
import Report from '../models/Report.js';
import { generateScreeningAnalysis } from '../config/genkit.js';

// M-CHAT question texts for reference when saving answers
const MCHAT_QUESTIONS = [
  'Does your child look at you when you call his/her name?',
  'Does your child make eye contact with familiar people?',
  'Does your child point to show you something interesting?',
  'Does your child smile back when you smile at them?',
  'Does your child use words to communicate (or babble before 12 mo)?',
  'Does your child follow when you point at something across the room?',
  'Does your child bring objects to show you things?',
  'Does your child respond to simple instructions (e.g. "Come here")?',
  'Does your child engage in pretend or make-believe play?',
  'Does your child show interest in playing with other children?',
  'Does your child show repetitive hand or arm movements (flapping)?',
  'Does your child spin objects or spin themselves repeatedly?',
  'Does your child seem sensitive to loud sounds or bright lights?',
  'Does your child walk on tiptoes more often than on flat feet?',
  'Does your child avoid physical contact like hugging?',
  'Does your child have unusual reactions to textures (food/clothing)?',
  'Does your child get very upset by small changes in daily routine?',
  'Does your child line up toys or objects in rigid patterns?',
  'Does your child seem to be "in his/her own world" often?',
  'Does your child respond when you try to play with them?'
];

// @desc    Create new screening
// @route   POST /api/screenings
// @access  Private (parent)
export const createScreening = async (req, res, next) => {
  try {
    const { childId, answers, mlPrediction } = req.body;

    // Validate child belongs to this parent
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    if (!answers || answers.length !== 20) {
      return res.status(400).json({ success: false, error: 'Must provide exactly 20 answers' });
    }

    // Calculate score
    let score = 0;
    const flaggedQuestions = [];
    const fullAnswers = [];

    answers.forEach((rawAnswer, index) => {
      const ans = typeof rawAnswer === 'boolean' ? rawAnswer : rawAnswer === 1 || rawAnswer === '1';
      let isRisk = false;
      // Questions 0-9: risk if answer = false
      if (index <= 9) {
        if (ans === false) { score++; isRisk = true; }
      } 
      // Q11–19: risk if Yes; Q20 (index 19): risk if No (M-CHAT)
      else if (index === 19) {
        if (ans === false) { score++; isRisk = true; }
      } else if (ans === true) {
        score++; isRisk = true;
      }

      if (isRisk) flaggedQuestions.push(index + 1);

      fullAnswers.push({
        questionId: index + 1,
        questionText: MCHAT_QUESTIONS[index],
        answer: ans
      });
    });

    // Determine riskLevel
    let riskLevel = 'Low';
    if (score >= 7 && score <= 13) riskLevel = 'Medium';
    if (score >= 14) riskLevel = 'High';

    const riskPercentage = (score / 20) * 100;

    // Calculate categories
    const categories = {
      social: 0,
      communication: 0,
      behavior: 0,
      sensory: 0,
      routine: 0
    };

    fullAnswers.slice(0, 5).forEach((a, i) => { if (a.answer === false) categories.social++; }); // 0-4
    fullAnswers.slice(5, 9).forEach((a, i) => { if (a.answer === false) categories.communication++; }); // 5-8
    fullAnswers.slice(9, 14).forEach((a, i) => { 
      if (i === 0 && a.answer === false) categories.behavior++; // Q10 (index 9) riskIfNo
      else if (a.answer === true) categories.behavior++; // Q11-14 riskIfYes
    }); // 9-13
    fullAnswers.slice(14, 17).forEach((a, i) => { if (a.answer === true) categories.sensory++; }); // 14-16
    fullAnswers.slice(17, 20).forEach((a, i) => { if (a.answer === true) categories.routine++; }); // 17-19

    const screening = await Screening.create({
      childId,
      parentId: req.user._id,
      doctorId: child.doctorId || null,
      answers: fullAnswers,
      score,
      riskLevel,
      riskPercentage,
      categories,
      flaggedQuestions,
      mlPrediction,
      // Parent-submitted screenings must always start as pending review.
      status: 'pending'
    });

    // Keep the child card/dashboard snapshot fields in sync.
    await Child.findByIdAndUpdate(childId, {
      lastScreen: screening.screeningDate,
      risk: riskLevel,
      score,
      total: 20
    });

    // Auto-create Report document
    const flaggedConcerns = flaggedQuestions.map(id => MCHAT_QUESTIONS[id-1]);
    
    // Call Genkit flow to generate AI analysis
    let aiAnalysisText = `Based on the M-CHAT responses, the risk level is ${riskLevel}. Please review the flagged concerns.`;
    let strengthsObserved = ['Responds to name', 'Makes eye contact']; // fallback placeholders
    let recommendations = riskLevel === 'Low' 
      ? ['Continue regular pediatric checkups']
      : ['Schedule a consultation with a specialist', 'Consider early intervention therapies'];

    try {
      const aiResult = await generateScreeningAnalysis({
        score,
        riskLevel,
        flaggedConcerns
      });
      
      aiAnalysisText = aiResult.aiAnalysis;
      strengthsObserved = aiResult.strengthsObserved;
      recommendations = aiResult.recommendations;
    } catch (genkitErr) {
      console.error('Genkit flow failed, falling back to basic report:', genkitErr);
    }

    const report = await Report.create({
      screeningId: screening._id,
      childId,
      parentId: req.user._id,
      riskLevel,
      score,
      aiAnalysis: aiAnalysisText,
      categoryBreakdown: categories,
      flaggedConcerns,
      strengthsObserved,
      recommendations
    });

    res.status(201).json({
      success: true,
      data: {
        screening,
        report
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all screenings for this parent
// @route   GET /api/screenings
// @access  Private (parent)
export const getScreenings = async (req, res, next) => {
  try {
    const [mchatScreenings, visualScans] = await Promise.all([
      Screening.find({ parentId: req.user._id }).populate('childId', 'name avatar dob').lean(),
      mongoose.model('VisualScan').find({ userId: req.user._id }).populate('childId', 'name avatar dob').lean()
    ]);

    const normalizedMchat = mchatScreenings.map(s => ({
      _id: s._id,
      childId: s.childId,
      parentId: s.parentId,
      score: s.score,
      riskLevel: s.riskLevel,
      screeningDate: s.screeningDate || s.createdAt,
      status: s.status,
      type: 'M-CHAT'
    }));

    const normalizedVisual = visualScans.map(s => ({
      _id: s._id,
      childId: s.childId || { name: s.childName || 'Unknown Child', avatar: 'default-avatar' },
      parentId: s.userId,
      score: Math.round((s.combinedReport?.overallScore || 0) / 5),
      riskLevel: s.combinedReport?.overallRisk || 'Low',
      screeningDate: s.completedAt || s.createdAt,
      status: 'completed',
      type: 'AI Visual'
    }));

    const allScreenings = [...normalizedMchat, ...normalizedVisual].sort(
      (a, b) => new Date(b.screeningDate) - new Date(a.screeningDate)
    );

    res.status(200).json({
      success: true,
      count: allScreenings.length,
      data: allScreenings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single screening
// @route   GET /api/screenings/:id
// @access  Private
export const getScreening = async (req, res, next) => {
  try {
    const screening = await Screening.findById(req.params.id)
      .populate('childId', 'name dob gender');

    if (!screening) {
      return res.status(404).json({ success: false, error: 'Screening not found' });
    }

    if (req.user.role === 'parent' && screening.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this screening' });
    }

    res.status(200).json({
      success: true,
      data: screening
    });
  } catch (err) {
    next(err);
  }
};

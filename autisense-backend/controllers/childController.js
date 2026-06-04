import mongoose from 'mongoose';
import Child from '../models/Child.js';
import Screening from '../models/Screening.js';

// @desc    Get all children for current parent
// @route   GET /api/children
// @access  Private (parent)
export const getChildren = async (req, res, next) => {
  try {
    const children = await Child.find({ parentId: req.user._id, isActive: true });
    
    // Optional: add latest screening info if needed
    // For simplicity, returning the child array
    res.status(200).json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single child
// @route   GET /api/children/:childId
// @access  Private (parent)
export const getChild = async (req, res, next) => {
  try {
    const childId = req.params.childId || req.params.id;
    const child = await Child.findOne({ _id: childId, parentId: req.user._id, isActive: true });

    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    res.status(200).json({
      success: true,
      data: child
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new child
// @route   POST /api/children
// @access  Private (parent)
export const createChild = async (req, res, next) => {
  try {
    const { name, dob, gender, guardian, medicalNotes, avatar } = req.body;

    const child = await Child.create({
      parentId: req.user._id,
      name,
      dob,
      gender,
      guardian,
      medicalNotes,
      avatar,
    });

    res.status(201).json({
      success: true,
      data: child
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update child
// @route   PUT /api/children/:childId
// @access  Private (parent)
export const updateChild = async (req, res, next) => {
  try {
    const childId = req.params.childId || req.params.id;
    let child = await Child.findOne({ _id: childId, parentId: req.user._id });

    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    const { name, dob, gender, guardian, medicalNotes } = req.body;
    child = await Child.findByIdAndUpdate(
      childId,
      { name, dob, gender, guardian, medicalNotes },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: child
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete child (Soft delete)
// @route   DELETE /api/children/:childId
// @access  Private (parent)
export const deleteChild = async (req, res, next) => {
  try {
    const childId = req.params.childId || req.params.id;
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });

    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    child.isActive = false;
    await child.save();

    res.status(200).json({
      success: true,
      message: 'Child removed'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get screenings for a specific child
// @route   GET /api/children/:childId/screenings
// @access  Private (parent)
export const getChildScreenings = async (req, res, next) => {
  try {
    const childId = req.params.childId || req.params.id;
    // Verify ownership
    const child = await Child.findOne({ _id: childId, parentId: req.user._id });
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    const [mchatScreenings, visualScans] = await Promise.all([
      Screening.find({ childId }).lean(),
      mongoose.model('VisualScan').find({ childId }).lean()
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
      childId: s.childId,
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

import Report from '../models/Report.js';
import User from '../models/User.js';

// @desc    Get report by screening ID
// @route   GET /api/reports/:screeningId
// @access  Private
export const getReport = async (req, res, next) => {
  try {
    const report = await Report.findOne({ screeningId: req.params.screeningId })
      .populate('childId', 'name dob gender')
      .populate('parentId', 'name email');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const parentId = report.parentId?._id?.toString() || report.parentId?.toString();

    // Verify access
    if (
      req.user.role === 'parent' &&
      parentId !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this report' });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all reports for current parent
// @route   GET /api/reports
// @access  Private (parent)
export const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ parentId: req.user._id })
      .populate('childId', 'name avatar dob')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Share report with doctor
// @route   PUT /api/reports/:id/share
// @access  Private (parent)
export const shareWithDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Verify parent owns it
    if (report.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Verify doctor exists and is a doctor
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    report.sharedWithDoctor = true;
    report.sharedDoctorId = doctorId;
    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update AI Analysis text
// @route   PUT /api/reports/:id/analysis
// @access  Private
export const updateAiAnalysis = async (req, res, next) => {
  try {
    const { aiAnalysis } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Allow parent (owns it) or admin to update
    if (report.parentId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    report.aiAnalysis = aiAnalysis;
    await report.save();

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

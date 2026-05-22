const Attendance = require('../models/Attendance');
const User = require('../models/User');

const today = () => new Date().toISOString().split('T')[0];

// GET /api/attendance?date=YYYY-MM-DD
const getAttendance = async (req, res, next) => {
  try {
    const date = req.query.date || today();
    const users = await User.find().select('name email role');
    const records = await Attendance.find({ date })
      .populate('user', 'name email role')
      .populate('markedBy', 'name');

    const recordMap = {};
    records.forEach(r => { recordMap[r.user._id.toString()] = r; });

    const merged = users.map(u => {
      const rec = recordMap[u._id.toString()];
      return {
        _id: rec?._id || null,
        userId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        date,
        status: rec?.status || 'Absent',
        workingStatus: rec?.workingStatus || 'Not Working',
        checkIn: rec?.checkIn || null,
        checkOut: rec?.checkOut || null,
        markedBy: rec?.markedBy || null,
      };
    });

    res.json({ success: true, date, attendance: merged });
  } catch (err) {
    next(err);
  }
};

// POST /api/attendance
const markAttendance = async (req, res, next) => {
  try {
    const { userId, date, status, workingStatus } = req.body;
    const targetDate = date || today();

    if (req.user.role === 'member' && userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only update your own attendance' });
    }

    const record = await Attendance.findOneAndUpdate(
      { user: userId, date: targetDate },
      {
        user: userId,
        date: targetDate,
        status,
        workingStatus,
        markedBy: req.user._id,
        ...(status === 'Present' && { checkIn: new Date() }),
        ...(status === 'Absent' && { checkOut: null, checkIn: null }),
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate('user', 'name email role')
      .populate('markedBy', 'name');

    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

// PUT /api/attendance/:id/checkout
const checkOut = async (req, res, next) => {
  try {
    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { checkOut: new Date(), workingStatus: 'Not Working' },
      { new: true }
    ).populate('user', 'name email role');

    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    res.json({ success: true, record });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/history/:userId
const getUserHistory = async (req, res, next) => {
  try {
    const records = await Attendance.find({ user: req.params.userId })
      .sort('-date')
      .limit(30)
      .populate('markedBy', 'name');
    res.json({ success: true, records });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAttendance, markAttendance, checkOut, getUserHistory };
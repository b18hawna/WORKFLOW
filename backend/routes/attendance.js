const express = require('express');
const { getAttendance, markAttendance, checkOut, getUserHistory } = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAttendance);
router.post('/', markAttendance);
router.put('/:id/checkout', checkOut);
router.get('/history/:userId', getUserHistory);

module.exports = router;
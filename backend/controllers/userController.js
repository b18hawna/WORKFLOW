const User = require('../models/User');

// @desc  Get all users (admin only)
// @route GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('name');
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// @desc  Update profile
// @route PUT /api/users/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc  Change password
// @route PUT /api/users/password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, updateProfile, changePassword };

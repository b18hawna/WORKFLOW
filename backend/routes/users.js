const express = require('express');
const { getUsers, updateProfile, changePassword } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', adminOnly, getUsers);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;

const express = require('express')
const router = express.Router()
const { protect, adminOnly, superAdminOnly } = require('../middleware/authMiddleware')
const { registerAdmin, login, forgotPassword, verifyOtp, resetPassword, changePassword, updateProfile } = require('../controllers/authController')

// Allow first super_admin registration (bootstrap), then protect subsequent registrations
router.post('/register', async (req, res, next) => {
  try {
    const User = require('../models/User')
    const superAdminCount = await User.countDocuments({ role: 'super_admin' })
    const requestedRole = req.body.role || 'manager'

    if (superAdminCount === 0 && requestedRole === 'super_admin') {
      // First super_admin can register without authentication (one-time bootstrap)
      return registerAdmin(req, res)
    }

    // All other registrations require authentication
    return protect(req, res, () => {
      if (requestedRole === 'admin') {
        // Only super_admin can create an admin
        return superAdminOnly(req, res, () => registerAdmin(req, res))
      }
      // Creating a manager requires admin or super_admin
      return adminOnly(req, res, () => registerAdmin(req, res))
    })
  } catch (error) {
    return res.status(500).json({ message: 'Server error' })
  }
})
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/verify-otp', verifyOtp)
router.post('/reset-password', resetPassword)
router.put('/change-password', protect, changePassword)
router.put('/profile', protect, updateProfile)

module.exports = router
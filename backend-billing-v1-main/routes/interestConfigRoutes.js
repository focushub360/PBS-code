const express = require("express");
const router = express.Router();
const { getInterestConfig, saveInterestConfig } = require("../controllers/interestConfigController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/interest-config — any logged in user can fetch
router.get("/", protect, getInterestConfig);

// POST /api/interest-config — admin only
router.post("/", protect, saveInterestConfig);

module.exports = router;

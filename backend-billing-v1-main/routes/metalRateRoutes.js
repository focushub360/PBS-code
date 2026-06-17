const express = require("express");
const router = express.Router();
const { getMetalRates, saveMetalRates } = require("../controllers/metalRateController");
const { protect } = require("../middleware/authMiddleware");

// GET /api/metal-rates — any logged in user can fetch
router.get("/", protect, getMetalRates);

// POST /api/metal-rates — admin updates daily rate
router.post("/", protect, saveMetalRates);

module.exports = router;

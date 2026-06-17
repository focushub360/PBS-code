const MetalRate = require("../models/MetalRate");

// GET /api/metal-rates
const getMetalRates = async (req, res) => {
  try {
    let rate = await MetalRate.findOne().sort({ createdAt: -1 });

    if (!rate) {
      rate = { gold24k: 0, gold22k: 0, gold18k: 0, silver: 0 };
    }

    res.status(200).json({ success: true, data: rate });
  } catch (error) {
    console.error("Get metal rates error:", error);
    res.status(500).json({ success: false, message: "Failed to get metal rates" });
  }
};

// POST /api/metal-rates
const saveMetalRates = async (req, res) => {
  try {
    const { gold24k, gold22k, gold18k, silver } = req.body;

    if (gold24k == null || gold22k == null || silver == null) {
      return res.status(400).json({
        success: false,
        message: "gold24k, gold22k, and silver are required",
      });
    }

    // Keep only the latest rate document
    await MetalRate.deleteMany({});

    const rate = await MetalRate.create({
      gold24k: Number(gold24k),
      gold22k: Number(gold22k),
      gold18k: Number(gold18k) || 0,
      silver: Number(silver),
      updatedBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    console.error("Save metal rates error:", error);
    res.status(500).json({ success: false, message: "Failed to save metal rates" });
  }
};

module.exports = { getMetalRates, saveMetalRates };

const InterestConfig = require("../models/InterestConfig");

// GET /api/interest-config
const getInterestConfig = async (req, res) => {
  try {
    // Always return the latest config (only one document)
    let config = await InterestConfig.findOne().sort({ createdAt: -1 });

    if (!config) {
      // Return default if none saved yet
      config = { baseRate: 1, incrementRate: 1 };
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error("Get interest config error:", error);
    res.status(500).json({ success: false, message: "Failed to get interest config" });
  }
};

// POST /api/interest-config
const saveInterestConfig = async (req, res) => {
  try {
    const { baseRate, incrementRate } = req.body;

    if (!baseRate || !incrementRate) {
      return res.status(400).json({
        success: false,
        message: "baseRate and incrementRate are required",
      });
    }

    // Delete old config and save new one (only keep latest)
    await InterestConfig.deleteMany({});

    const config = await InterestConfig.create({
      baseRate: Number(baseRate),
      incrementRate: Number(incrementRate),
      effectiveFrom: new Date(),
      updatedBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: config });
  } catch (error) {
    console.error("Save interest config error:", error);
    res.status(500).json({ success: false, message: "Failed to save interest config" });
  }
};

module.exports = { getInterestConfig, saveInterestConfig };

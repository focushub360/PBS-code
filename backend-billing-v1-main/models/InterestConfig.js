const mongoose = require("mongoose");

const interestConfigSchema = new mongoose.Schema(
  {
    baseRate: {
      type: Number,
      required: true,
      default: 1,
    },
    incrementRate: {
      type: Number,
      required: true,
      default: 1,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterestConfig", interestConfigSchema);

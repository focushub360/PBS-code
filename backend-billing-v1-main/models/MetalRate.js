const mongoose = require("mongoose");

const metalRateSchema = new mongoose.Schema(
  {
    gold24k: { type: Number, required: true, default: 0 },
    gold22k: { type: Number, required: true, default: 0 },
    gold18k: { type: Number, default: 0 },
    silver: { type: Number, required: true, default: 0 },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MetalRate", metalRateSchema);

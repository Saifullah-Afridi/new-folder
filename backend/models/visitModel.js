const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
  status: {
    type: String,
    required: true,
    enum: ["incomplete", "pending", "complete"],
    default: "incomplete",
  },
  date: { type: Date, default: Date.now },
  prescription: String,
  tests: {
    type: String,
    required: true,
  },
  medicines: {
    type: String,
    required: true,
  },
});

const Visit = mongoose.model("Visit", visitSchema);

module.exports = Visit;

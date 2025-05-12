 
const mongoose = require('mongoose');

const bioBreakSchema = new mongoose.Schema({
  empId: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

bioBreakSchema.index({ empId: 1, date: 1 });

module.exports = mongoose.model('BioBreak', bioBreakSchema);
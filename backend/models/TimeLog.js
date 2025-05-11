const mongoose = require('mongoose');

const timeLogSchema = new mongoose.Schema({
  empId: { type: String, required: true },
  date: { type: Date, required: true },
  loginTime: { type: Date },
  logoutTime: { type: Date },
  break1StartTime: { type: Date },
  break1EndTime: { type: Date },
  break2StartTime: { type: Date },
  break2EndTime: { type: Date },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Present' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

timeLogSchema.index({ empId: 1, date: 1 });

module.exports = mongoose.model('TimeLog', timeLogSchema);

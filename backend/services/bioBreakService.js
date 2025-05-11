 
const BioBreak = require('../models/BioBreak');

exports.getBioBreaks = async (empId, date) => {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  return await BioBreak.find({ empId, date: startOfDay });
};
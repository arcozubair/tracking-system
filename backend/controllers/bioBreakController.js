 
const bioBreakService = require('../services/bioBreakService');

exports.getBioBreaks = async (req, res) => {
  try {
    const { empId, date } = req.query;
    const bioBreaks = await bioBreakService.getBioBreaks(empId, new Date(date));
    res.status(200).json(bioBreaks);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
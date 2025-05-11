const timeLogService = require('../services/timeLogService');

exports.logIn = async (req, res) => {
  try {
    const { empId } = req.body;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    if (isNaN(date)) throw new Error('Invalid date');
    const timeLog = await timeLogService.logIn(empId, date);
    res.status(200).json(timeLog);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.logOut = async (req, res) => {
  try {
    const { empId } = req.body;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    if (isNaN(date)) throw new Error('Invalid date');
    const timeLog = await timeLogService.logOut(empId, date);
    res.status(200).json(timeLog);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.startBreak = async (req, res) => {
  try {
    const { empId, breakType } = req.body;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    if (isNaN(date)) throw new Error('Invalid date');
    const result = await timeLogService.startBreak(empId, date, breakType);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.endBreak = async (req, res) => {
  try {
    const { empId, breakType, breakId } = req.body;
    const date = req.body.date ? new Date(req.body.date) : new Date();
    if (isNaN(date)) throw new Error('Invalid date');
    const result = await timeLogService.endBreak(empId, date, breakType, breakId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getTimeLogStatus = async (req, res) => {
  try {
    const { empId, date } = req.query; // Changed to req.query for GET
    const dateObj = date ? new Date(date) : new Date();
    if (isNaN(dateObj)) throw new Error('Invalid date');
    const status = await timeLogService.getTimeLogStatus(empId, dateObj);
    res.status(200).json(status);
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
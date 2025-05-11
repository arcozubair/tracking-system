 
const employeeService = require('../services/employeeService');

exports.login = async (req, res) => {
  try {
    const { empId } = req.body;
    const employee = await employeeService.login(empId);
    res.status(200).json({ status: 'success', empId, name: employee.name });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};
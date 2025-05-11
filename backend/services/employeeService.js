 
 
const Employee = require('../models/Employee');

exports.login = async (empId) => {
  const employee = await Employee.findOne({ empId });
  if (!employee) throw new Error('Invalid Employee ID');
  return employee;
};
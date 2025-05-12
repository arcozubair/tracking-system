const mongoose = require('mongoose');
const Employee = require('../models/Employee');

const employees = [
  {
    empId: 'Emp1',
    name: 'Zubair mir',
    email: 'zubairmeer@example.com',
    password: 'password123'
  },
  {
    empId: 'Emp2',
    name: 'Ishfaq ',
    email: 'ishfaqahd@example.com',
    password: 'password456'
  },
  {
    empId: 'Emp3',
    name: 'Iqra mirza',
    email: 'iqramirza@example.com',
    password: 'password789'
  },
 
];

async function seedEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/timeTracking', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    await Employee.deleteMany({});
    console.log('Cleared existing employees');

    // Hash passwords and insert employees
    for (const emp of employees) {
      await Employee.create({
        empId: emp.empId,
        name: emp.name,
        email: emp.email,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added employee: ${emp.empId}`);
    }

    console.log('All employees seeded successfully');
  } catch (error) {
    console.error('Error seeding employees:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

seedEmployees();
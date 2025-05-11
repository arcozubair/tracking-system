 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const timeLogRoutes = require('./routes/timeLogRoutes');
const bioBreakRoutes = require('./routes/bioBreakRoutes');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/timeTracking', { useNewUrlParser: true, useUnifiedTopology: true });

app.use('/api/employees', employeeRoutes);
app.use('/api/timelogs', timeLogRoutes);
app.use('/api/biobreaks', bioBreakRoutes);

module.exports = app;
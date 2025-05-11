const TimeLog = require('../models/TimeLog');
const BioBreak = require('../models/BioBreak');

const getNineAM = (date) => {
  const nineAM = new Date(date);
  nineAM.setHours(9, 0, 0, 0);
  return nineAM;
};

exports.logIn = async (empId, date) => {
  console.log('logIn date input:', date);
  let dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj)) {
    console.error('Invalid date in logIn, using current date:', date);
    dateObj = new Date();
  }
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));

  // Check for existing TimeLog
  const existingTimeLog = await TimeLog.findOne({ empId, date: startOfDay });
  if (existingTimeLog) {
    if (existingTimeLog.logoutTime) {
      console.log('EOD reached for:', { empId, date: startOfDay.toISOString() });
      throw new Error('End of Day reached. Cannot log in again today.');
    }
    if (existingTimeLog.loginTime && !existingTimeLog.logoutTime) {
      console.log('Active session found:', existingTimeLog._id);
      throw new Error('Active session already exists');
    }
  }

  const loginTime = new Date();
  const nineAM = getNineAM(startOfDay);
  const effectiveLoginTime = loginTime < nineAM ? nineAM : loginTime;

  console.log('logIn:', {
    empId,
    date: startOfDay.toISOString(),
    actualLoginTime: loginTime.toISOString(),
    effectiveLoginTime: effectiveLoginTime.toISOString()
  });

  const timeLog = await TimeLog.findOneAndUpdate(
    { empId, date: startOfDay },
    {
      $set: {
        loginTime: effectiveLoginTime,
        status: 'Present',
        updatedAt: new Date()
      },
      $setOnInsert: {
        break1StartTime: null,
        break1EndTime: null,
        break2StartTime: null,
        break2EndTime: null,
        logoutTime: null,
        totalWorkingHours: null,
        createdAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  console.log('Saved TimeLog:', {
    loginTime: timeLog.loginTime.toISOString(),
    empId: timeLog.empId,
    date: timeLog.date.toISOString()
  });

  // Validate saved loginTime
  if (timeLog.loginTime.toISOString() !== effectiveLoginTime.toISOString()) {
    console.error('Mismatch in saved loginTime:', {
      expected: effectiveLoginTime.toISOString(),
      actual: timeLog.loginTime.toISOString()
    });
    throw new Error('Failed to save correct loginTime');
  }

  return timeLog;
};

exports.logOut = async (empId, date) => {
  console.log('logOut date input:', date);
  let dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj)) {
    console.error('Invalid date in logOut, using current date:', date);
    dateObj = new Date();
  }
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
  const timeLog = await TimeLog.findOne({ empId, date: startOfDay });
  if (!timeLog) throw new Error('No active session found');
  if (timeLog.logoutTime) throw new Error('Already logged out');

  const bioBreaks = await BioBreak.find({ empId, date: startOfDay });
  const totalBioBreakTime = bioBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);

  const break1Duration = timeLog.break1EndTime && timeLog.break1StartTime 
    ? (timeLog.break1EndTime - timeLog.break1StartTime) / (1000 * 60) 
    : 0;
  const break2Duration = timeLog.break2EndTime && timeLog.break2StartTime 
    ? (timeLog.break2EndTime - timeLog.break2StartTime) / (1000 * 60) 
    : 0;

  const sixPM = new Date(startOfDay);
  sixPM.setHours(18, 0, 0, 0);
  const endTime = new Date() > sixPM ? sixPM : new Date();

  // Calculate actual working time
  const WORKDAY_MINUTES = 540; // 9 hours
  const grossTime = endTime <= timeLog.loginTime ? 0 : Math.min(WORKDAY_MINUTES, (endTime - timeLog.loginTime) / (1000 * 60));
  
  const break1Excess = break1Duration > 30 ? break1Duration - 30 : 0;
  const break2Excess = break2Duration > 30 ? break2Duration - 30 : 0;
  const bioBreakExcess = totalBioBreakTime > 30 ? totalBioBreakTime - 30 : 0;
  const unusedBioBreak = totalBioBreakTime < 30 && grossTime > 0 ? Math.min(30, (grossTime / WORKDAY_MINUTES) * 30) : 0;

  const netWorkingTime = grossTime - (break1Excess + break2Excess + bioBreakExcess) + unusedBioBreak;
  const totalMinutes = Math.max(0, Math.min(WORKDAY_MINUTES, Math.round(netWorkingTime)));

  timeLog.logoutTime = new Date();
  timeLog.totalWorkingHours = totalMinutes / 60; // Convert to hours
  timeLog.status = 'Absent'; // Mark as EOD
  timeLog.updatedAt = new Date();
  await timeLog.save();

  return timeLog;
};

exports.startBreak = async (empId, date, breakType) => {
  console.log('startBreak date input:', date, 'empId:', empId, 'breakType:', breakType);
  let dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj)) {
    console.error('Invalid date in startBreak:', date);
    throw new Error('Invalid date format');
  }
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
  console.log('startBreak startOfDay:', startOfDay.toISOString());

  const timeLog = await TimeLog.findOne({ empId, date: startOfDay });
  if (!timeLog) {
    console.error('No TimeLog found for:', { empId, date: startOfDay.toISOString() });
    throw new Error('No active session found');
  }
  if (timeLog.logoutTime) {
    console.error('TimeLog has logoutTime:', timeLog.logoutTime.toISOString());
    throw new Error('End of Day reached');
  }

  if (breakType === 'bio') {
    const bioBreak = await BioBreak.create({
      empId,
      date: startOfDay,
      startTime: new Date(),
      createdAt: new Date()
    });
    console.log('Created BioBreak:', bioBreak._id);
    return bioBreak;
  } else if (breakType === 'break1') {
    if (timeLog.break1EndTime) throw new Error('Break 1 already completed');
    if (timeLog.break1StartTime) throw new Error('Break 1 already started');
    timeLog.break1StartTime = new Date();
  } else if (breakType === 'break2') {
    if (!timeLog.break1EndTime) throw new Error('Break 1 must be completed first');
    if (timeLog.break2EndTime) throw new Error('Break 2 already completed');
    if (timeLog.break2StartTime) throw new Error('Break 2 already started');
    timeLog.break2StartTime = new Date();
  } else {
    console.error('Invalid breakType:', breakType);
    throw new Error('Invalid break type');
  }
  timeLog.updatedAt = new Date();
  await timeLog.save();
  console.log('Updated TimeLog with', breakType, 'startTime:', timeLog.break1StartTime?.toISOString() || timeLog.break2StartTime?.toISOString());
  return timeLog;
};

exports.endBreak = async (empId, date, breakType, breakId) => {
  console.log('endBreak date input:', date);
  let dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj)) {
    console.error('Invalid date in endBreak, using current date:', date);
    dateObj = new Date();
  }
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));

  if (breakType === 'bio') {
    const bioBreak = await BioBreak.findById(breakId);
    if (!bioBreak) throw new Error('Bio Break not found');
    bioBreak.endTime = new Date();
    bioBreak.duration = (bioBreak.endTime - bioBreak.startTime) / (1000 * 60);
    await bioBreak.save();
    return bioBreak;
  }

  const timeLog = await TimeLog.findOne({ empId, date: startOfDay });
  if (!timeLog || timeLog.logoutTime) throw new Error('No active session found');

  if (breakType === 'break1') {
    if (!timeLog.break1StartTime || timeLog.break1EndTime) throw new Error('Break 1 not active');
    timeLog.break1EndTime = new Date();
  } else if (breakType === 'break2') {
    if (!timeLog.break2StartTime || timeLog.break2EndTime) throw new Error('Break 2 not active');
    timeLog.break2EndTime = new Date();
  } else {
    throw new Error('Invalid break type');
  }
  timeLog.updatedAt = new Date();
  await timeLog.save();
  return timeLog;
};

exports.getTimeLogStatus = async (empId, date) => {
  console.log('getTimeLogStatus date input:', date);
  let dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj)) {
    console.error('Invalid date in getTimeLogStatus, using current date:', date);
    dateObj = new Date();
  }
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
  const timeLog = await TimeLog.findOne({ empId, date: startOfDay });
  const bioBreaks = await BioBreak.find({ empId, date: startOfDay });

  console.log('Raw TimeLog:', timeLog ? {
    empId: timeLog.empId,
    date: timeLog.date.toISOString(),
    loginTime: timeLog.loginTime ? timeLog.loginTime.toISOString() : null,
    logoutTime: timeLog.logoutTime ? timeLog.logoutTime.toISOString() : null
  } : 'No TimeLog found');
  console.log('Server time:', new Date().toISOString());

  let break1Duration = null;
  let break2Duration = null;
  let workingHoursFormatted = '0h 0m';
  let totalBioBreakTime = bioBreaks.reduce((sum, b) => sum + (b.duration || 0), 0);

  if (timeLog && timeLog.loginTime) {
    const WORKDAY_MINUTES = 540; // 9 hours
    const sixPM = new Date(startOfDay);
    sixPM.setHours(18, 0, 0, 0);
    const now = timeLog.logoutTime ? new Date(timeLog.logoutTime) : new Date();
    const endTime = now > sixPM ? sixPM : now;

    const nineAM = getNineAM(startOfDay);
    const effectiveLoginTime = timeLog.loginTime < nineAM ? nineAM : timeLog.loginTime;

    const grossTime = endTime <= effectiveLoginTime ? 0 : Math.min(WORKDAY_MINUTES, (endTime - effectiveLoginTime) / (1000 * 60));

    break1Duration = timeLog.break1EndTime && timeLog.break1StartTime
      ? ((timeLog.break1EndTime - timeLog.break1StartTime) / (1000 * 60)).toFixed(1)
      : null;
    break2Duration = timeLog.break2EndTime && timeLog.break2StartTime
      ? ((timeLog.break2EndTime - timeLog.break2StartTime) / (1000 * 60)).toFixed(1)
      : null;

    const break1Minutes = break1Duration ? parseFloat(break1Duration) : 0;
    const break2Minutes = break2Duration ? parseFloat(break2Duration) : 0;
    const break1Excess = break1Minutes > 30 ? break1Minutes - 30 : 0;
    const break2Excess = break2Minutes > 30 ? break2Minutes - 30 : 0;
    const bioBreakExcess = totalBioBreakTime > 30 ? totalBioBreakTime - 30 : 0;
    const unusedBioBreak = totalBioBreakTime < 30 && grossTime > 0 ? Math.min(30, (grossTime / WORKDAY_MINUTES) * 30) : 0;

    const netWorkingTime = grossTime - (break1Excess + break2Excess + bioBreakExcess) + unusedBioBreak;
    const totalMinutes = Math.max(0, Math.min(WORKDAY_MINUTES, Math.round(netWorkingTime)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    workingHoursFormatted = `${hours}h ${minutes}m`;

    console.log('Working hours calculation:', {
      loginTime: timeLog.loginTime.toISOString(),
      effectiveLoginTime: effectiveLoginTime.toISOString(),
      now: now.toISOString(),
      endTime: endTime.toISOString(),
      grossTime,
      break1Minutes,
      break1Excess,
      break2Minutes,
      break2Excess,
      totalBioBreakTime,
      bioBreakExcess,
      unusedBioBreak,
      netWorkingTime,
      totalMinutes,
      workingHoursFormatted
    });
  }

  return {
    timeLog,
    bioBreaks,
    workingHours: workingHoursFormatted,
    break1Duration,
    break2Duration,
    totalBioBreakTime: totalBioBreakTime.toFixed(1),
    isEOD: timeLog && timeLog.logoutTime ? true : false
  };
};
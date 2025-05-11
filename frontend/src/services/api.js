import axios from 'axios';

const API_URL =  'http://localhost:3000/api';

export const login = async (empId, name) => {
  try {
    const response = await axios.post(`${API_URL}/employees/login`, { empId, name });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to authenticate employee');
  }
};

export const logInTime = async (empId) => {
  const date = new Date().toISOString();
  console.log('logInTime sending date:', date);
  try {
    const response = await axios.post(`${API_URL}/timelogs/login`, { empId, date });
    return response.data;
  } catch (error) {
    if (error.response?.data?.message === 'End of Day reached. Cannot log in again today.') {
      console.log('EOD reached, fetching status for:', { empId, date });
      const statusResponse = await getTimeLogStatus(empId, date);
      return { ...statusResponse, isEOD: true };
    }
    throw new Error(error.response?.data?.message || 'Failed to log in');
  }
};

export const logOutTime = async (empId) => {
  const date = new Date().toISOString();
  console.log('logOutTime sending date:', date);
  try {
    const response = await axios.post(`${API_URL}/timelogs/logout`, { empId, date });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to log out');
  }
};

export const startBreak = async (empId, breakType) => {
  const date = new Date().toISOString();
  console.log('startBreak sending:', { empId, breakType, date });
  try {
    const response = await axios.post(`${API_URL}/timelogs/break/start`, { empId, breakType, date });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || `Failed to start ${breakType} break`);
  }
};

export const endBreak = async (empId, breakType, breakId) => {
  const date = new Date().toISOString();
  console.log('endBreak sending:', { empId, breakType, breakId, date });
  try {
    const response = await axios.post(`${API_URL}/timelogs/break/end`, { empId, breakType, breakId, date });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || `Failed to end ${breakType} break`);
  }
};

export const getTimeLogStatus = async (empId, date) => {
  const isoDate = date instanceof Date ? date.toISOString() : date;
  if (typeof isoDate !== 'string' || isNaN(new Date(isoDate))) {
    console.error('Invalid date format in getTimeLogStatus:', date);
    throw new Error('Date must be a valid ISO string or Date object');
  }
  console.log('getTimeLogStatus sending:', { empId, date: isoDate });
  try {
    const response = await axios.get(`${API_URL}/timelogs/status`, { params: { empId, date: isoDate } });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch time log status');
  }
};
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, logInTime } from '../services/api';

const Login = () => {
  const [empId, setEmpId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const prefixedId = `Emp${empId}`;

    try {
      const employee = await login(prefixedId);
      const timeLogData = await logInTime(prefixedId);
      navigate('/dashboard', { 
        state: { 
          empId: prefixedId, 
          name: employee.name, 
          timeLogData: timeLogData.isEOD ? timeLogData : undefined 
        } 
      });
    } catch (error) {
      if (error.message === 'End of Day reached. Cannot log in again today.') {
        // timeLogData is already fetched by logInTime in api.js
        navigate('/dashboard', { 
          state: { 
            empId: prefixedId, 
            name: employee.name, 
            timeLogData: error.response?.data || error.timeLogData 
          } 
        });
      } else {
        setError(error.message || 'Invalid Employee ID or server error.');
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setEmpId(value);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h1>Time Tracking System</h1>
        <label>Employee ID:</label>
        <input
          type="text"
          value={empId}
          onChange={handleChange}
          required
          placeholder="Enter numeric Employee ID"
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Log In</button>
      </form>
    </div>
  );
};

export default Login;
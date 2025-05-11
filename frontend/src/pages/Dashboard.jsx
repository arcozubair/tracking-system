import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BreakButton from '../components/BreakButton';
import BreakHistory from '../components/BreakHistory';
import { logInTime, logOutTime, getTimeLogStatus, startBreak, endBreak } from '../services/api';

const formatTime = (ms) => {
  if (!ms || ms <= 0) return '00:00';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const Dashboard = () => {
  const { state } = useLocation();
  const { empId, name, timeLogData } = state || {};
  const navigate = useNavigate();
  const [bioBreaks, setBioBreaks] = useState([]);
  const [timeLog, setTimeLog] = useState(null);
  const [workingHours, setWorkingHours] = useState(null);
  const [break1Duration, setBreak1Duration] = useState(null);
  const [break2Duration, setBreak2Duration] = useState(null);
  const [totalBioBreakTime, setTotalBioBreakTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeBreak, setActiveBreak] = useState({ type: null, startTime: null, id: null });
  const [isEOD, setIsEOD] = useState(false);

  useEffect(() => {
    if (!empId) navigate('/');

    const fetchInitialData = async () => {
      try {
        const date = new Date().toISOString();
        console.log('fetchInitialData sending date:', date);
        let data = timeLogData;
        if (!data) {
          data = await getTimeLogStatus(empId, date);
        }
        const { timeLog, bioBreaks, break1Duration, break2Duration, totalBioBreakTime, workingHours, isEOD } = data;
        setTimeLog(timeLog || {});
        setBioBreaks(bioBreaks || []);
        setBreak1Duration(break1Duration);
        setBreak2Duration(break2Duration);
        setTotalBioBreakTime(totalBioBreakTime || 0);
        setWorkingHours(workingHours || '0h 0m');
        setIsEOD(isEOD || (timeLog?.logoutTime ? true : false));
        if (timeLog?.logoutTime || isEOD) {
          setActiveBreak({ type: null, startTime: null, id: null });
        } else if (timeLog?.break1StartTime && !timeLog.break1EndTime) {
          setActiveBreak({ type: 'break1', startTime: new Date(timeLog.break1StartTime) });
        } else if (timeLog?.break2StartTime && !timeLog.break2EndTime) {
          setActiveBreak({ type: 'break2', startTime: new Date(timeLog.break2StartTime) });
        } else {
          const activeBioBreak = bioBreaks.find(b => b.startTime && !b.endTime);
          if (activeBioBreak) {
            setActiveBreak({ type: 'bio', startTime: new Date(activeBioBreak.startTime), id: activeBioBreak._id });
          } else {
            setActiveBreak({ type: null, startTime: null, id: null });
          }
        }
      } catch (error) {
        console.error('Error fetching initial status:', error);
        setTimeLog({});
        setBioBreaks([]);
        setBreak1Duration(null);
        setBreak2Duration(null);
        setTotalBioBreakTime(0);
        setWorkingHours('0h 0m');
        setIsEOD(false);
      }
    };

    fetchInitialData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [empId, navigate, timeLogData]);

  const fetchWorkingHours = async () => {
    try {
      const date = new Date().toISOString();
      console.log('fetchWorkingHours sending date:', date);
      const { timeLog, bioBreaks, workingHours, break1Duration, break2Duration, totalBioBreakTime, isEOD } = await getTimeLogStatus(empId, date);
      setTimeLog(timeLog || {});
      setBioBreaks(bioBreaks || []);
      setWorkingHours(workingHours || '0h 0m');
      setBreak1Duration(break1Duration);
      setBreak2Duration(break2Duration);
      setTotalBioBreakTime(totalBioBreakTime || 0);
      setIsEOD(isEOD || (timeLog?.logoutTime ? true : false));
    } catch (error) {
      console.error('Error fetching working hours:', error);
    }
  };

  const handleStartBreak = async (breakType) => {
    try {
      const result = await startBreak(empId, breakType);
      if (breakType === 'bio') {
        setActiveBreak({ type: 'bio', startTime: new Date(), id: result._id });
        setBioBreaks([...bioBreaks, result]);
      } else {
        setActiveBreak({ type: breakType, startTime: new Date(result[`${breakType}StartTime`]) });
        setTimeLog(result);
      }
      await fetchWorkingHours();
    } catch (error) {
      console.error(`Error starting ${breakType}:`, error);
    }
  };

  const handleEndBreak = async (breakType, breakId) => {
    try {
      const result = await endBreak(empId, breakType, breakId);
      setActiveBreak({ type: null, startTime: null, id: null });
      if (breakType === 'bio') {
        setBioBreaks(bioBreaks.map(b => (b._id === result._id ? result : b)));
      } else {
        setTimeLog(result);
      }
      await fetchWorkingHours();
    } catch (error) {
      console.error(`Error ending ${breakType}:`, error);
    }
  };

  const handleLogout = async () => {
    try {
      await logOutTime(empId);
      await fetchWorkingHours();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const isBreakActive = (type) => activeBreak.type === type;
  const isBreak1Disabled = isEOD || timeLog?.logoutTime || (isBreakActive('break1') ? false : (timeLog?.break1EndTime || activeBreak.type));
  const isBreak2Disabled = isEOD || timeLog?.logoutTime || !timeLog?.break1EndTime || (isBreakActive('break2') ? false : (timeLog?.break2EndTime || activeBreak.type));
  const isBioBreakDisabled = isEOD || timeLog?.logoutTime || (isBreakActive('bio') ? false : activeBreak.type);

  const getBreakTimer = () => {
    if (!activeBreak.startTime) return '00:00';
    return formatTime(currentTime - activeBreak.startTime);
  };

  return (
    <div className="dashboard-container">
      <div className="header">
        <div>
          <h1>Welcome, {name} ({empId})</h1>
          <p>Status: {isEOD || timeLog?.logoutTime ? 'Logged Out (EOD)' : 'Logged In'}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isEOD || timeLog?.logoutTime}
          className="logout-btn"
        >
          Log Out
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h2>Working Hours</h2>
          <p>{workingHours !== null ? workingHours : '--'}</p>
          <button
            onClick={fetchWorkingHours}
            disabled={isEOD || timeLog?.logoutTime}
            className="refresh-btn"
          >
            See My Current Working Hours
          </button>
        </div>
        <div className="stat-card">
          <h2>Bio Break Allowance</h2>
          <p>{(30 - totalBioBreakTime).toFixed(1)} min remaining</p>
          <small>Total used: {totalBioBreakTime} min</small>
        </div>
      </div>

      <div className="breaks-section">
        <h2>Breaks</h2>
        <div className="breaks-grid">
          <div className="break-card">
            <h3>Break 1</h3>
            <p>
              Status: {isBreakActive('break1') ? `Active (${getBreakTimer()})` : 
                      break1Duration ? `${break1Duration} min` : 
                      'Not started'}
            </p>
            <BreakButton
              empId={empId}
              breakType="break1"
              label={isBreakActive('break1') ? 'End Break 1' : 'Start Break 1'}
              disabled={isBreak1Disabled}
              onClick={isBreakActive('break1') ? () => handleEndBreak('break1') : () => handleStartBreak('break1')}
            />
          </div>
          <div className="break-card">
            <h3>Break 2</h3>
            <p>
              Status: {isBreakActive('break2') ? `Active (${getBreakTimer()})` : 
                      break2Duration ? `${break2Duration} min` : 
                      'Not started'}
            </p>
            <BreakButton
              empId={empId}
              breakType="break2"
              label={isBreakActive('break2') ? 'End Break 2' : 'Start Break 2'}
              disabled={isBreak2Disabled}
              onClick={isBreakActive('break2') ? () => handleEndBreak('break2') : () => handleStartBreak('break2')}
            />
          </div>
          <div className="break-card">
            <h3>Bio Break</h3>
            <p>
              Status: {isBreakActive('bio') ? `Active (${getBreakTimer()})` : 'Not started'}
            </p>
            <BreakButton
              empId={empId}
              breakType="bio"
              label={isBreakActive('bio') ? 'End Bio Break' : 'Start Bio Break'}
              disabled={isBioBreakDisabled}
              onClick={isBreakActive('bio') ? () => handleEndBreak('bio', activeBreak.id) : () => handleStartBreak('bio')}
            />
          </div>
        </div>
      </div>

      <BreakHistory bioBreaks={bioBreaks} />
    </div>
  );
};

export default Dashboard;
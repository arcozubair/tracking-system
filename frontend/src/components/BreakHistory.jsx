import React from 'react';

const BreakHistory = ({ bioBreaks }) => {
  return (
    <div className="break-history">
      <h2>Bio Break History</h2>
      {bioBreaks.length === 0 ? (
        <p>No Bio Breaks taken.</p>
      ) : (
        <ul>
          {bioBreaks.map((break_) => (
            <li key={break_._id}>
              <p>
                Start: {new Date(break_.startTime).toLocaleTimeString()}
                {break_.endTime ? (
                  <>
                    {' | '}End: {new Date(break_.endTime).toLocaleTimeString()}
                    {' | '}Duration: {(break_.duration || 0).toFixed(1)} min
                  </>
                ) : (
                  ' | Ongoing'
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BreakHistory;
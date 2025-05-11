import React from 'react';

const BreakButton = ({ label, disabled, onClick }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="break-btn"
    >
      {label}
    </button>
  );
};

export default BreakButton;
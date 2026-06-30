import React from 'react';
import { Link } from 'react-router-dom';
import './UnlockProButton.css';

interface UnlockProButtonProps {
  to?: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  className?: string;
}

export const UnlockProButton: React.FC<UnlockProButtonProps> = ({ to, onClick, className = '' }) => {
  const inner = (
    <>
      <svg
        className="unlock-pro-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 36 24"
        aria-hidden="true"
      >
        <path d="m18 0 8 12 10-8-4 20H4L0 4l10 8 8-12z" />
      </svg>
      Unlock Pro
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`unlock-pro-btn ${className}`.trim()} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={`unlock-pro-btn ${className}`.trim()} onClick={onClick}>
      {inner}
    </button>
  );
};

export default UnlockProButton;

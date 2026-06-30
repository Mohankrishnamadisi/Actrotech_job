import React from 'react';
import './AnimatedBackButton.css';

type AnimatedBackButtonProps = {
  onClick?: () => void;
  ariaLabel?: string;
};

export const AnimatedBackButton: React.FC<AnimatedBackButtonProps> = ({
  onClick,
  ariaLabel = 'Go back',
}) => {
  return (
    <button className="animated-back-button" onClick={onClick} aria-label={ariaLabel} type="button">
      <div className="animated-back-button-box">
        <span className="animated-back-button-elem">
          <svg viewBox="0 0 46 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
          </svg>
        </span>
        <span className="animated-back-button-elem">
          <svg viewBox="0 0 46 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
          </svg>
        </span>
      </div>
    </button>
  );
};

export default AnimatedBackButton;
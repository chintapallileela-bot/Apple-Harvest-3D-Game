
import React from 'react';

export const GAME_DURATION = 60; // 60 seconds
export const TOTAL_APPLES = 450; // Increased to fill the single 100vh background

export const AppleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.5 4.5C15.6 4.5 13.9 5.4 12.8 6.9C11.7 5.4 10 4.5 8.1 4.5C4.7 4.5 2 7.2 2 10.6C2 17.5 11.2 22.1 11.6 22.3C11.7 22.4 11.9 22.4 12 22.4C12.1 22.4 12.3 22.4 12.4 22.3C12.8 22.1 22 17.5 22 10.6C22 7.2 19.3 4.5 15.9 4.5H17.5ZM12 20.3C9.7 19.1 4 15.6 4 10.6C4 8.3 5.8 6.5 8.1 6.5C9.7 6.5 11.1 7.4 11.7 8.8C11.8 9 11.9 9.1 12.1 9.1C12.3 9.1 12.4 9 12.5 8.8C13.1 7.4 14.5 6.5 16.1 6.5C18.4 6.5 20.2 8.3 20.2 10.6C20.2 15.6 14.5 19.1 12.2 20.3L12 20.3Z" opacity="0.1"/>
    <path d="M12 2C12 2 13 4 15 4M18.5 7C18.5 10.5 15.5 13.5 12 13.5C8.5 13.5 5.5 10.5 5.5 7C5.5 3.5 8.5 3 12 3C15.5 3 18.5 3.5 18.5 7Z" />
    <path d="M12 3C12 2 13 1 14 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

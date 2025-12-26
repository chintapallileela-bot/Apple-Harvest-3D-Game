
import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  return (
    <div
      onClick={() => onClick(data.id)}
      className="absolute cursor-pointer transition-all duration-300 hover:scale-125 active:scale-75 select-none"
      style={{
        left: `${data.x}%`,
        top: `${data.y}%`,
        width: `${data.size}px`,
        height: `${data.size}px`,
        transform: `rotate(${data.rotation}deg)`,
        animation: `float 3s ease-in-out infinite`,
        animationDelay: `${data.delay}s`,
      }}
    >
      <div className="relative w-full h-full group">
        {/* Apple Body */}
        <div className="absolute inset-0 bg-red-600 rounded-full shadow-lg group-hover:bg-red-500 transition-colors">
          {/* Shine */}
          <div className="absolute top-1 left-2 w-1/3 h-1/4 bg-white opacity-30 rounded-full rotate-[-45deg]"></div>
        </div>
        {/* Leaf/Stem */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-amber-800 rounded-full"></div>
        <div className="absolute -top-2 left-1/2 w-3 h-2 bg-green-500 rounded-full rotate-[30deg]"></div>
      </div>
    </div>
  );
};

export default Apple;

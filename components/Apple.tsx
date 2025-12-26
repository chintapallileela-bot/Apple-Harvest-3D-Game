
import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  // Calculate visual scale based on Z-depth
  const depthScale = 1 + (data.z / 400);
  const opacity = 0.7 + (depthScale * 0.3);
  
  return (
    <div
      onClick={() => onClick(data.id)}
      className="absolute cursor-pointer select-none touch-manipulation group"
      style={{
        left: `${data.x}%`,
        top: `${data.y}%`,
        width: `${data.size}px`,
        height: `${data.size}px`,
        zIndex: Math.floor(data.z + 200),
        transform: `translate3d(-50%, -50%, ${data.z}px) rotate(${data.rotation}deg)`,
        animation: `apple-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float 5s ease-in-out infinite`,
        animationDelay: `0s, ${data.delay}s`,
      }}
    >
      <div className="relative w-full h-full transition-transform duration-300 group-hover:scale-125 group-active:scale-90">
        {/* 3D Parallax Drop Shadow */}
        <div 
          className="absolute inset-0 bg-black/40 rounded-full blur-md translate-y-3 translate-x-2"
          style={{ transform: `scale(${0.8 / depthScale}) translateZ(-20px)` }}
        ></div>
        
        {/* Apple Body with Depth Shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-900 rounded-full shadow-[inset_-4px_-4px_10px_rgba(0,0,0,0.5)] border border-red-950/20">
          <div className="absolute top-[18%] left-[18%] w-[25%] h-[15%] bg-white/30 rounded-full rotate-[-40deg] blur-[1.5px]"></div>
        </div>
        
        {/* Stem - 3D offset */}
        <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[12%] h-[35%] bg-amber-950 rounded-full transform translateZ(5px) shadow-sm"></div>
        
        {/* Leaf - 3D offset */}
        <div className="absolute -top-[15%] left-[55%] w-[45%] h-[28%] bg-gradient-to-tr from-green-800 via-green-600 to-green-400 rounded-full rotate-[30deg] transform translateZ(10px) shadow-md border border-green-900/10"></div>
      </div>
    </div>
  );
};

export default Apple;

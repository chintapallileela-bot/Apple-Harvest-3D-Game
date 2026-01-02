
import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const RED_APPLE_IMAGE = "https://i.postimg.cc/nc3MbVTw/Apple.jpg";
const GREEN_APPLE_IMAGE = "https://i.postimg.cc/rFjWN5Jg/Green-Apple.jpg";

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  const jitterScale = 0.95 + (data.variationSeed * 0.15);
  const appleImage = data.color === 'green' ? GREEN_APPLE_IMAGE : RED_APPLE_IMAGE;
  
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick(data.id);
      }}
      className="absolute cursor-pointer group"
      style={{
        left: `${data.x}%`,
        top: `${data.y}%`,
        width: `${data.size}px`,
        height: `${data.size}px`,
        zIndex: Math.floor(data.z + 500),
        transformStyle: 'preserve-3d',
        transform: `translate3d(-50%, -50%, ${data.z}px) rotate(${data.rotation}deg) scale(0)`,
        animation: `apple-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
        animationDelay: `${data.delay}s`,
        touchAction: 'none'
      }}
    >
      {/* Invisible larger hit area for mobile accessibility */}
      <div className="absolute inset-[-40%] z-50"></div>

      <div 
        className="relative w-full h-full transition-all duration-300 group-hover:scale-125 group-active:scale-75" 
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `scale(${jitterScale})`
        }}
      >
        <div className="absolute inset-2 bg-black/40 blur-xl rounded-full translate-y-3 -z-10"></div>
        
        <img 
          src={appleImage}
          alt={`${data.color} apple`}
          className="w-full h-full object-contain rounded-full shadow-2xl border-[1.5px] border-white/10"
        />
        
        <div className="absolute top-[12%] left-[28%] w-[35%] h-[25%] bg-white/30 blur-[4px] rounded-full rotate-[-35deg] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Apple;

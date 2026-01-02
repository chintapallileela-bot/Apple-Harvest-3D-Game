
import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const HERO_APPLE_IMAGE = "https://i.postimg.cc/nc3MbVTw/Apple.jpg";

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  const jitterScale = 0.9 + (data.variationSeed * 0.2);
  
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
        animation: `apple-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards`,
        animationDelay: `${data.delay}s`,
        touchAction: 'none'
      }}
    >
      <div 
        className="relative w-full h-full transition-transform group-hover:scale-115 active:scale-75" 
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `scale(${jitterScale})`
        }}
      >
        {/* Soft shadow for 3D presence */}
        <div className="absolute inset-1 bg-black/40 blur-md rounded-full translate-y-1.5 -z-10"></div>
        
        {/* Realistic Apple Image */}
        <img 
          src={HERO_APPLE_IMAGE}
          alt="Apple"
          className="w-full h-full object-contain rounded-full drop-shadow-xl"
        />
        
        {/* Subtle glossy highlight */}
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[20%] bg-white/40 blur-[2px] rounded-full rotate-[-30deg] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Apple;

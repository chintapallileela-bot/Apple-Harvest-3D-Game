
import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const HERO_APPLE_IMAGE = "https://i.postimg.cc/nc3MbVTw/Apple.jpg";

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  const jitterScale = 0.95 + (data.variationSeed * 0.15);
  
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
      <div 
        className="relative w-full h-full transition-transform duration-200 group-hover:scale-110 active:scale-75" 
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `scale(${jitterScale})`
        }}
      >
        {/* Soft shadow for 3D presence */}
        <div className="absolute inset-2 bg-black/50 blur-lg rounded-full translate-y-2 -z-10"></div>
        
        {/* Realistic Apple Image */}
        <img 
          src={HERO_APPLE_IMAGE}
          alt="Apple"
          className="w-full h-full object-contain rounded-full drop-shadow-2xl border-2 border-red-500/20"
        />
        
        {/* Subtle glossy highlight */}
        <div className="absolute top-[10%] left-[25%] w-[35%] h-[25%] bg-white/50 blur-[3px] rounded-full rotate-[-35deg] pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Apple;

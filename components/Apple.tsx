import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  const isRed = data.color === 'red';
  const variation = data.variationSeed;
  
  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        // Use pointer down for immediate response
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
        animation: `apple-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float ${4 + variation * 2}s ease-in-out infinite`,
        animationDelay: `${data.delay}s, ${data.delay + 0.4}s`,
        touchAction: 'none'
      }}
    >
      <div className="relative w-full h-full transition-transform group-hover:scale-110 active:scale-95" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Dimple / Top Shadow */}
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-1/3 h-[12%] bg-black/30 rounded-full blur-sm z-20"></div>

        {/* Stem */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#2a1600] to-black rounded-full"
          style={{ 
            top: '-18%',
            width: '6%', 
            height: '38%',
            transform: `translateZ(-2px) rotate(${variation * 20 - 10}deg)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
          }}
        ></div>

        {/* Leaf */}
        <div 
          className="absolute -top-[12%] left-[52%] w-[45%] h-[22%] origin-left"
          style={{ 
            transform: `rotate(${25 + variation * 30}deg) scale(${0.9 + variation * 0.3})`,
            zIndex: 10
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-green-400 via-green-800 to-green-950 rounded-[50%_0_50%_0] border border-black/10 shadow-md"></div>
        </div>

        {/* Main Body */}
        <div 
          className="absolute inset-0 rounded-[48%_48%_42%_42%] shadow-[inset_-6px_-12px_22px_rgba(0,0,0,0.6),inset_6px_6px_18px_rgba(255,255,255,0.25),0_12px_24px_rgba(0,0,0,0.4)] overflow-hidden"
          style={{ 
            background: isRed 
              ? `radial-gradient(circle at 35% 35%, #ff4d4d 0%, #cc0000 50%, #500000 100%)`
              : `radial-gradient(circle at 35% 35%, #d4ff4d 0%, #6da300 50%, #254000 100%)`
          }}
        >
          {/* Skin Pores / Speckles */}
          <div 
            className="absolute inset-0 opacity-15 mix-blend-overlay"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #fff 1.2px, transparent 1.2px)',
              backgroundSize: '5px 5px'
            }}
          ></div>
          
          {/* Main Specular Highlight */}
          <div className="absolute top-[18%] left-[25%] w-[25%] h-[15%] bg-white/40 rounded-full blur-lg -rotate-15"></div>
          
          {/* Subsurface Glow at bottom */}
          <div 
            className="absolute bottom-[8%] right-[20%] w-[35%] h-[35%] rounded-full blur-2xl"
            style={{ backgroundColor: isRed ? 'rgba(255,80,0,0.2)' : 'rgba(180,255,0,0.15)' }}
          ></div>
        </div>

      </div>
    </div>
  );
};

export default Apple;
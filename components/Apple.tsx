import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
}

const Apple: React.FC<{ data: AppleData; onClick: (id: string) => void }> = ({ data, onClick }) => {
  // Use variation seed to create unique offsets for each apple
  const stemHeight = 30 + data.variationSeed * 10;
  const leafRotation = 25 + data.variationSeed * 40;
  const leafScale = 0.8 + data.variationSeed * 0.4;
  const skinDetailOpacity = 0.05 + data.variationSeed * 0.05;
  
  // Color profiles
  const colors = {
    red: {
      from: '#ff4d4d',
      via: '#d60000',
      to: '#600000',
      highlight: 'rgba(255, 255, 255, 0.4)',
      scatter: 'rgba(255, 120, 0, 0.15)',
    },
    green: {
      from: '#d4fc79',
      via: '#96e6a1',
      to: '#2d5a27',
      highlight: 'rgba(255, 255, 255, 0.5)',
      scatter: 'rgba(200, 255, 0, 0.1)',
    }
  };

  const activeColor = colors[data.color];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(data.id);
      }}
      className="absolute cursor-pointer select-none touch-manipulation group"
      style={{
        left: `${data.x}%`,
        top: `${data.y}%`,
        width: `${data.size}px`,
        height: `${data.size}px`,
        zIndex: Math.floor(data.z + 1000),
        transformStyle: 'preserve-3d',
        transform: `translate3d(-50%, -50%, ${data.z}px) rotate(${data.rotation}deg) scale(0)`,
        animation: `apple-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, float 5s ease-in-out infinite`,
        animationDelay: `${data.delay}s, ${data.delay + 0.5}s`,
      }}
    >
      <div className="relative w-full h-full transition-all duration-300 group-hover:scale-110 active:scale-90" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Shadow */}
        <div 
          className="absolute inset-0 bg-black/40 rounded-full blur-xl opacity-60"
          style={{ transform: 'translate3d(10%, 15%, -20px) scale(0.9)' }}
        ></div>

        {/* 3D Apple Body */}
        <div 
          className="absolute inset-0 rounded-full overflow-hidden shadow-[inset_-12px_-12px_30px_rgba(0,0,0,0.8),inset_8px_8px_20px_rgba(255,255,255,0.2)]"
          style={{ 
            background: `linear-gradient(135deg, ${activeColor.from} 0%, ${activeColor.via} 50%, ${activeColor.to} 100%)`
          }}
        >
          {/* Main Shine */}
          <div 
            className="absolute top-[8%] left-[18%] w-[35%] h-[25%] rounded-full blur-sm -rotate-[25deg]"
            style={{ background: `linear-gradient(to bottom, ${activeColor.highlight}, transparent)` }}
          ></div>
          
          {/* Subsurface scattering */}
          <div 
            className="absolute bottom-[10%] right-[15%] w-[40%] h-[40%] rounded-full blur-2xl"
            style={{ background: activeColor.scatter }}
          ></div>

          {/* Skin texture */}
          <div 
            className="absolute inset-0 mix-blend-overlay" 
            style={{ 
              opacity: skinDetailOpacity,
              backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', 
              backgroundSize: `${2 + data.variationSeed * 2}px ${2 + data.variationSeed * 2}px` 
            }}
          ></div>
        </div>

        {/* Stem */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#4d2600] to-[#261300] rounded-full shadow-lg"
          style={{ 
            top: `-${stemHeight * 0.3}%`,
            width: '10%', 
            height: `${stemHeight}%`,
            transform: `translateZ(10px) rotateX(-10deg) rotate(${data.variationSeed * 20 - 10}deg)` 
          }}
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-black/30 rounded-full"></div>
        </div>

        {/* Leaf */}
        <div 
          className="absolute -top-[20%] left-[55%] w-[60%] h-[35%] origin-left"
          style={{ 
            transform: `translateZ(20px) rotate(${leafRotation}deg) rotateY(10deg) scale(${leafScale})`,
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-[#4ade80] via-[#166534] to-[#064e3b] rounded-full shadow-md border-l border-white/10">
            {/* Center leaf vein */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20 -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apple;
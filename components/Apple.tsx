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
      onClick={(e) => {
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
        animation: `apple-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float ${4 + variation * 2}s ease-in-out infinite`,
        animationDelay: `${data.delay}s, ${data.delay + 0.4}s`,
      }}
    >
      <div className="relative w-full h-full transition-transform group-hover:scale-110 active:scale-90" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Dimple / Top Shadow */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-1/3 h-[15%] bg-black/20 rounded-full blur-sm z-20"></div>

        {/* Stem */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-b from-[#3a1d00] to-black rounded-full"
          style={{ 
            top: '-15%',
            width: '8%', 
            height: '35%',
            transform: `translateZ(-5px) rotate(${variation * 30 - 15}deg)`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}
        ></div>

        {/* Leaf */}
        <div 
          className="absolute -top-[10%] left-[55%] w-[50%] h-[25%] origin-left"
          style={{ 
            transform: `rotate(${30 + variation * 40}deg) scale(${0.8 + variation * 0.4})`,
            zIndex: 10
          }}
        >
          <div className="w-full h-full bg-gradient-to-br from-green-400 via-green-700 to-green-950 rounded-[50%_0_50%_0] border border-white/10 shadow-lg"></div>
        </div>

        {/* Main Body */}
        <div 
          className="absolute inset-0 rounded-[45%_45%_40%_40%] shadow-[inset_-5px_-10px_20px_rgba(0,0,0,0.6),inset_5px_5px_15px_rgba(255,255,255,0.2),0_15px_30px_rgba(0,0,0,0.4)] overflow-hidden"
          style={{ 
            background: isRed 
              ? `radial-gradient(circle at 30% 30%, #ff5e5e 0%, #d10000 45%, #630000 100%)`
              : `radial-gradient(circle at 30% 30%, #e1ff6b 0%, #7dbd00 45%, #2d4d00 100%)`
          }}
        >
          {/* Skin Imperfections (Speckles) */}
          <div 
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{ 
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '4px 4px'
            }}
          ></div>
          
          {/* Main Specular Highlight */}
          <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] bg-white/30 rounded-full blur-md -rotate-12"></div>
          
          {/* Secondary Subsurface Glow */}
          <div 
            className="absolute bottom-[10%] right-[15%] w-[40%] h-[40%] rounded-full blur-2xl"
            style={{ backgroundColor: isRed ? 'rgba(255,100,0,0.15)' : 'rgba(200,255,0,0.1)' }}
          ></div>
        </div>

      </div>
    </div>
  );
};

export default Apple;
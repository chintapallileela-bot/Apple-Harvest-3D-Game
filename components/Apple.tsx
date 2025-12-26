import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  // depthScale helps adjust things based on Z-position
  const depthScale = 1 + (data.z / 500);
  
  return (
    <div
      onClick={() => onClick(data.id)}
      className="absolute cursor-pointer select-none touch-manipulation group"
      style={{
        left: `${data.x}%`,
        top: `${data.y}%`,
        width: `${data.size}px`,
        height: `${data.size}px`,
        zIndex: Math.floor(data.z + 500),
        transformStyle: 'preserve-3d',
        transform: `translate3d(-50%, -50%, ${data.z}px) rotate(${data.rotation}deg)`,
        animation: `apple-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, float 6s ease-in-out infinite`,
        animationDelay: `0s, ${data.delay}s`,
      }}
    >
      <div className="relative w-full h-full transition-all duration-500 group-hover:scale-125 group-active:scale-95 group-active:rotate-[15deg]" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Dynamic Shadow Cast into 3D Space */}
        <div 
          className="absolute inset-0 bg-black/30 rounded-full blur-xl scale-110"
          style={{ transform: 'translate3d(15%, 15%, -40px) scale(0.9)' }}
        ></div>

        {/* 3D Apple Body - Complex Spherical Gradient */}
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-[inset_-10px_-10px_30px_rgba(0,0,0,0.8),inset_5px_5px_15px_rgba(255,255,255,0.2)] bg-gradient-to-br from-red-400 via-red-600 to-red-950">
          
          {/* Main Surface Highlight */}
          <div className="absolute top-[10%] left-[15%] w-[40%] h-[30%] bg-white/25 rounded-full blur-md -rotate-[30deg]"></div>
          
          {/* Secondary Rim Light */}
          <div className="absolute bottom-[5%] right-[5%] w-[30%] h-[30%] bg-red-400/20 rounded-full blur-lg"></div>

          {/* Texture Overlay (pitting/pores) */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
        </div>

        {/* Stem - Offset in 3D */}
        <div 
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[12%] h-[40%] bg-gradient-to-b from-amber-700 to-amber-950 rounded-full"
          style={{ transform: 'translateZ(15px) rotateX(-15deg)' }}
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-black/20 rounded-full"></div>
        </div>

        {/* Leaf - High Depth Offset */}
        <div 
          className="absolute -top-[20%] left-[52%] w-[55%] h-[35%] transition-transform duration-700 group-hover:rotate-[45deg]"
          style={{ 
            transform: 'translateZ(30px) rotate(25deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div className="w-full h-full bg-gradient-to-tr from-green-900 via-green-600 to-emerald-400 rounded-full shadow-lg border-l border-green-300/20">
            {/* Vein Line */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-green-900/40 -translate-y-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apple;

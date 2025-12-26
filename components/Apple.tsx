
import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
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
        transform: `translate3d(-50%, -50%, ${data.z}px) rotate(${data.rotation}deg)`,
        animation: `apple-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, float 5s ease-in-out infinite`,
        animationDelay: `0s, ${data.delay}s`,
      }}
    >
      <div className="relative w-full h-full transition-all duration-300 group-hover:scale-110 active:scale-90" style={{ transformStyle: 'preserve-3d' }}>
        
        {/* Shadow cast on "floor/depth" */}
        <div 
          className="absolute inset-0 bg-black/40 rounded-full blur-xl opacity-60"
          style={{ transform: 'translate3d(10%, 15%, -20px) scale(0.9)' }}
        ></div>

        {/* Realistic 3D Apple Body */}
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-[inset_-12px_-12px_30px_rgba(0,0,0,0.9),inset_8px_8px_20px_rgba(255,255,255,0.3)] bg-gradient-to-br from-[#ff4d4d] via-[#d60000] to-[#600000]">
          
          {/* Main highlight - "The Shine" */}
          <div className="absolute top-[8%] left-[18%] w-[35%] h-[25%] bg-gradient-to-b from-white/40 to-transparent rounded-full blur-sm -rotate-[25deg]"></div>
          
          {/* Subsurface scattering effect (orange/yellow tint on edges) */}
          <div className="absolute bottom-[10%] right-[15%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-2xl"></div>

          {/* Skin Pores / Texture */}
          <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '3px 3px' }}></div>
        </div>

        {/* Stem - Natural wood look */}
        <div 
          className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[10%] h-[35%] bg-gradient-to-b from-[#4d2600] to-[#261300] rounded-full shadow-lg"
          style={{ transform: 'translateZ(10px) rotateX(-10deg)' }}
        >
          <div className="absolute top-0 right-0 w-1/3 h-full bg-black/30 rounded-full"></div>
        </div>

        {/* Leaf - Lush Green with depth */}
        <div 
          className="absolute -top-[22%] left-[55%] w-[60%] h-[35%] origin-left"
          style={{ 
            transform: 'translateZ(20px) rotate(35deg) rotateY(10deg)',
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

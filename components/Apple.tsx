import React from 'react';
import { AppleData } from '../types';

interface AppleProps {
  data: AppleData;
  onClick: (id: string) => void;
}

const HERO_APPLE_IMAGE = "https://i.postimg.cc/nc3MbVTw/Apple.jpg";

const Apple: React.FC<AppleProps> = ({ data, onClick }) => {
  // Variation seed used to slightly jitter scale/rotation for a more organic feel
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
        className="relative w-full h-full transition-transform group-hover:scale-110 active:scale-90" 
        style={{ 
          transformStyle: 'preserve-3d',
          transform: `scale(${jitterScale})`
        }}
      >
        {/* Shadow under the apple for 3D depth */}
        <div className="absolute inset-0 bg-black/40 blur-md rounded-full translate-y-2 scale-90 -z-10"></div>
        
        {/* The Original Apple Image */}
        <img 
          src={HERO_APPLE_IMAGE}
          alt="Apple"
          className="w-full h-full object-contain rounded-full drop-shadow-lg"
          style={{
            // Green variant logic if needed, but the user specifically asked for "red apples"
            filter: data.color === 'green' ? 'hue-rotate(90deg) saturate(1.2)' : 'none'
          }}
        />
        
        {/* Subtle shine overlay to make it pop on the background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Apple;
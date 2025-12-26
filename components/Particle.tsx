import React from 'react';
import { ParticleData } from '../types';

interface ParticleProps {
  data: ParticleData;
}

const Particle: React.FC<ParticleProps> = ({ data }) => {
  const isLeaf = data.type === 'leaf';
  const isSeed = data.type === 'seed';
  const isJuice = data.type === 'juice';
  const isFlesh = data.type === 'flesh';

  // Specific styling for organic look
  let borderRadius = '50%';
  let style: React.CSSProperties = {
    backgroundColor: data.color,
    transform: `rotate(${data.rotation}deg)`,
    boxShadow: isJuice ? `0 0 8px ${data.color}88` : 'none',
    animation: 'particle-burst-fly 0.8s ease-out forwards',
    '--vx': `${data.vx}px`,
    '--vy': `${data.vy}px`,
  } as any;

  if (isLeaf) {
    borderRadius = '80% 0 80% 0';
    style.border = '1px solid rgba(0,0,0,0.1)';
  } else if (isSeed) {
    borderRadius = '40% 40% 60% 60%';
    style.width = `${data.size * 0.6}px`; // Seeds are narrower
  } else if (isFlesh) {
    borderRadius = `${30 + Math.random() * 40}% ${20 + Math.random() * 50}% ${40 + Math.random() * 30}% ${30 + Math.random() * 40}%`;
    style.border = '1px solid rgba(0,0,0,0.05)';
    style.opacity = 0.95;
  } else if (isJuice) {
    style.opacity = 0.7;
    style.backdropFilter = 'blur(1px)';
  }

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${data.x}%`,
        top: `${data.y}%`,
        width: `${data.size}px`,
        height: `${data.size}px`,
        zIndex: Math.floor(data.z + 1001),
        transformStyle: 'preserve-3d',
        transform: `translate3d(-50%, -50%, ${data.z}px)`,
      }}
    >
      <div
        className="w-full h-full"
        style={{
          ...style,
          borderRadius,
        }}
      ></div>
    </div>
  );
};

export default Particle;
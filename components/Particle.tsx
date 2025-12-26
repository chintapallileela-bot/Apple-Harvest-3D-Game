import React from 'react';
import { ParticleData } from '../types';

interface ParticleProps {
  data: ParticleData;
}

const Particle: React.FC<ParticleProps> = ({ data }) => {
  const isLeaf = data.type === 'leaf';
  const isSeed = data.type === 'seed';

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
          backgroundColor: data.color,
          borderRadius: isLeaf ? '50% 0 50% 0' : (isSeed ? '40% 40% 60% 60%' : '50%'),
          transform: `rotate(${data.rotation}deg)`,
          opacity: 0.8,
          boxShadow: data.type === 'dust' ? `0 0 10px ${data.color}` : 'none',
          animation: `particle-burst-fly 0.8s ease-out forwards`,
          '--vx': `${data.vx}px`,
          '--vy': `${data.vy}px`,
        } as any}
      ></div>
    </div>
  );
};

export default Particle;
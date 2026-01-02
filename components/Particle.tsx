
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

  let borderRadius = '50%';
  let style: React.CSSProperties = {
    backgroundColor: data.color,
    transform: `rotate(${data.rotation}deg)`,
    animation: 'particle-burst-fly 0.8s cubic-bezier(0.1, 0.5, 0.5, 1) forwards',
    '--vx': `${data.vx}px`,
    '--vy': `${data.vy}px`,
    opacity: 1,
  } as any;

  if (isLeaf) {
    borderRadius = '80% 0 80% 0';
    style.width = `${data.size * 1.2}px`;
    style.height = `${data.size * 0.6}px`;
    style.border = '1px solid rgba(0,0,0,0.15)';
  } else if (isSeed) {
    borderRadius = '50% 50% 50% 50% / 80% 80% 20% 20%'; // Teardrop/Seed shape
    style.width = `${data.size * 0.5}px`;
    style.height = `${data.size * 0.9}px`;
    style.backgroundColor = '#3e1a0b';
    style.boxShadow = 'inset 0 0 2px rgba(255,255,255,0.2)';
  } else if (isFlesh) {
    borderRadius = `${30 + Math.random() * 40}% ${20 + Math.random() * 50}% ${40 + Math.random() * 30}% ${30 + Math.random() * 40}%`;
    style.opacity = 0.9;
    style.border = '1px solid rgba(0,0,0,0.05)';
  } else if (isJuice) {
    style.opacity = 0.8;
    style.boxShadow = `0 0 10px ${data.color}`;
    style.filter = 'blur(1px)';
    style.width = `${data.size * 1.4}px`; // Juice blobs are slightly larger
    style.height = `${data.size * 1.4}px`;
    borderRadius = '45% 55% 65% 35% / 55% 45% 35% 65%'; // Irregular blob
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

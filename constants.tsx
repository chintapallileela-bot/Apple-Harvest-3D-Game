
import React from 'react';
import { Theme } from './types';

export const GAME_DURATION = 60;
export const TOTAL_APPLES = 200;

export const THEMES: Theme[] = [
  { id: 'avatar', name: 'Avatar', image: 'https://i.postimg.cc/tCCMJVcV/Avatar.jpg', unlocked: true },
  { id: 'alien', name: 'Alien', image: 'https://i.postimg.cc/vH9D2bX7/Alien.jpg', unlocked: true },
  { id: 'fantasy', name: 'Fantasy', image: 'https://i.postimg.cc/jjksdFZx/Fantasy.webp', unlocked: true },
  { id: 'scifi', name: 'Sci-Fi', image: 'https://i.postimg.cc/XJC0N7rg/Scifi.webp', unlocked: true },
  { id: 'universe', name: 'Universe', image: 'https://i.postimg.cc/WpGQ5yg1/Universe.jpg', unlocked: true },
  { id: 'scenery', name: 'Scenery', image: 'https://i.postimg.cc/hvc3FSTR/Scenery.jpg', unlocked: true },
  { id: 'animals', name: 'Animals', image: 'https://i.postimg.cc/28JFhkyQ/Animals.webp', unlocked: true },
  { id: 'birds', name: 'Birds', image: 'https://i.postimg.cc/GtfYFKcg/Birds.png', unlocked: true },
  { id: 'flowers', name: 'Flowers', image: 'https://i.postimg.cc/vBq6yh63/Flowers.jpg', unlocked: true },
  { id: 'ocean', name: 'Ocean', image: 'https://i.postimg.cc/Dz79kPh0/Ocean.webp', unlocked: true },
];

export const AppleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C12 2 13 4 15 4M18.5 7C18.5 10.5 15.5 13.5 12 13.5C8.5 13.5 5.5 10.5 5.5 7C5.5 3.5 8.5 3 12 3C15.5 3 18.5 3.5 18.5 7Z" />
    <path d="M12 3C12 2 13 1 14 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

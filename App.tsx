import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, AppleData } from './types';
import { GAME_DURATION, TOTAL_APPLES } from './constants';
import Apple from './components/Apple';
import { GoogleGenAI } from '@google/genai';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [apples, setApples] = useState<AppleData[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width >= 768 && width <= 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initGame = useCallback(() => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width <= 1024;
    
    const newApples: AppleData[] = [];
    
    // Grid density adjusted for TOTAL_APPLES while keeping them large
    const columns = isMobile ? 12 : (isTablet ? 16 : 22);
    const rows = Math.ceil(TOTAL_APPLES / columns);
    
    const cellWidth = 100 / columns;
    const cellHeight = 100 / rows;
    
    for (let i = 0; i < TOTAL_APPLES; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const baseX = (col * cellWidth) + (cellWidth / 2);
      const baseY = (row * cellHeight) + (cellHeight / 2);
      
      newApples.push({
        id: `apple-${i}`,
        // High jitter for an organic pile-up look
        x: Math.min(100, Math.max(0, baseX + (Math.random() * cellWidth - cellWidth / 2) * 2)),
        y: Math.min(100, Math.max(0, baseY + (Math.random() * cellHeight - cellHeight / 2) * 2)),
        z: Math.random() * 300 - 150,
        // Increased sizes for "big 3D apples"
        size: isMobile ? (45 + Math.random() * 20) : (isTablet ? 55 + Math.random() * 25 : 60 + Math.random() * 30),
        rotation: Math.random() * 360,
        delay: Math.random() * 2,
      });
    }
    
    setApples(newApples);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setStatus(GameStatus.PLAYING);
    setFeedback(null);
  }, []);

  const handleAppleClick = useCallback((id: string) => {
    if (status !== GameStatus.PLAYING) return;
    
    setApples(prev => {
      const filtered = prev.filter(apple => apple.id !== id);
      if (filtered.length === 0) {
        setStatus(GameStatus.WON);
      }
      return filtered;
    });
    setScore(prev => prev + 1);
  }, [status]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStatus(GameStatus.LOST);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  useEffect(() => {
    if (status === GameStatus.WON || status === GameStatus.LOST) {
      const generateMessage = async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = status === GameStatus.WON 
            ? `Congratulate the user for clearing all ${TOTAL_APPLES} jumbo apples and revealing the orchard guardian. Short and punchy.`
            : `User failed. They cleared ${score} apples. Give a funny, short encouragement.`;
            
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          setFeedback(response.text ?? null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "Grand Harvest achieved!" : "The harvest continues later...");
        }
      };
      generateMessage();
    }
  }, [status, score]);

  // Specific transformations for each device to optimize framing
  const getBgConfig = () => {
    switch(deviceType) {
      case 'mobile':
        return { scale: 1.1, z: -50 };
      case 'tablet':
        // Zoom out specifically for tablet to center the human perfectly
        return { scale: 0.95, z: -20 };
      default:
        return { scale: 1.15, z: -100 };
    }
  };

  const { scale: bgScale, z: bgZ } = getBgConfig();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* 3D Glass Header */}
      <div className="fixed top-0 left-0 w-full z-[1000] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none safe-top">
        <div className="flex flex-col items-center md:items-start">
          <h1 className="text-white text-2xl md:text-3xl font-black tracking-tighter drop-shadow-2xl">
            APPLE <span className="text-red-500">3D</span> WALL
          </h1>
          <p className="hidden md:block text-red-400 text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Mega 3D Harvest</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 bg-black/60 px-5 md:px-8 py-2 md:py-3 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Time</span>
            <span className={`text-xl md:text-3xl font-mono font-black tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Cleared</span>
            <span className="text-xl md:text-3xl font-mono font-black tabular-nums text-green-400">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Game Perspective Engine */}
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{ perspective: deviceType === 'mobile' ? '700px' : '1000px', perspectiveOrigin: '50% 50%' }}
      >
        <div 
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Background Layer - Reward View */}
          <div 
            className="absolute inset-0 transition-all duration-1000 ease-out" 
            style={{ 
              transform: `translate3d(0,0,${bgZ}px) scale(${bgScale})`,
              transformOrigin: 'center center'
            }}
          >
            <img 
              src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
              className="w-full h-full object-cover transition-opacity duration-1000" 
              style={{ objectPosition: 'center center' }}
              alt="Orchard Scene"
            />
          </div>

          {/* Denser Interactive Layer - Apple Curtain */}
          <div 
            className="absolute inset-0 pointer-events-auto"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {apples.map(apple => (
              <Apple key={apple.id} data={apple} onClick={handleAppleClick} />
            ))}
          </div>
        </div>
      </div>

      {/* Overlays */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 backdrop-blur-3xl p-6 transition-all duration-700">
          <div className="bg-gradient-to-br from-slate-900 via-black to-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-white/10 max-w-sm md:max-w-md w-full transform transition-all text-center">
            {status === GameStatus.IDLE ? (
              <>
                <div className="w-28 h-28 bg-gradient-to-br from-red-500 to-red-900 rounded-[2.5rem] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-red-600/50">
                   <div className="w-16 h-16 bg-white rounded-full relative shadow-inner">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-8 bg-amber-900 rounded-full"></div>
                      <div className="absolute -top-5 left-[60%] w-10 h-6 bg-green-500 rounded-full rotate-[20deg]"></div>
                   </div>
                </div>
                <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase leading-none italic">3D<br/>HARVEST</h2>
                <p className="text-white/60 mb-10 font-medium leading-relaxed px-4">
                  A massive curtain of <span className="text-red-400 font-bold">{TOTAL_APPLES} jumbo</span> 3D apples is blocking your view. Clear them all!
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-8xl mb-6">👑</div>
                <h2 className="text-5xl font-black text-green-400 mb-2 italic uppercase">LEGENDARY</h2>
                <p className="text-white text-xl font-bold mb-6">Orchard Vision Restored</p>
                {feedback && <div className="text-white/70 italic mb-8 bg-white/5 p-6 rounded-3xl border border-white/10 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            ) : (
              <>
                <div className="text-8xl mb-6 grayscale opacity-30">🍏</div>
                <h2 className="text-5xl font-black text-red-500 mb-2 uppercase italic">TIME OUT</h2>
                <p className="text-white text-xl font-bold mb-6 opacity-80">Cleared {score} / {TOTAL_APPLES}</p>
                {feedback && <div className="text-white/70 italic mb-8 bg-white/5 p-6 rounded-3xl border border-white/10 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            )}

            <button
              onClick={initGame}
              className="group relative w-full py-7 px-10 bg-red-600 hover:bg-red-500 text-white font-black rounded-[2rem] transition-all shadow-2xl active:scale-95 text-2xl uppercase tracking-[0.15em] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.2s_infinite]"></div>
              <span className="relative drop-shadow-md">{status === GameStatus.IDLE ? 'START MISSION' : 'RESTART'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

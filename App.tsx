import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, AppleData } from './types';
import { GAME_DURATION } from './constants';
import Apple from './components/Apple';
import { GoogleGenAI } from '@google/genai';

// We'll aim for a target number of clears, but keep the screen populated.
const INITIAL_SCREEN_APPLES = 350; // Densely covers the view
const WIN_TARGET = 600; 

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

  const createApple = useCallback((id: string): AppleData => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width <= 1024;

    return {
      id,
      x: Math.random() * 110 - 5, // Slight bleed over edges
      y: Math.random() * 110 - 5,
      z: Math.random() * 400 - 150,
      size: isMobile ? (45 + Math.random() * 20) : (isTablet ? 55 + Math.random() * 25 : 75 + Math.random() * 30),
      rotation: Math.random() * 360,
      delay: Math.random() * 2,
    };
  }, []);

  const initGame = useCallback(() => {
    const initialBatch: AppleData[] = [];
    for (let i = 0; i < INITIAL_SCREEN_APPLES; i++) {
      initialBatch.push(createApple(`apple-${i}-${Date.now()}`));
    }
    
    setApples(initialBatch);
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setStatus(GameStatus.PLAYING);
    setFeedback(null);
  }, [createApple]);

  const handleAppleClick = useCallback((id: string) => {
    if (status !== GameStatus.PLAYING) return;
    
    setScore(prev => {
      const newScore = prev + 1;
      if (newScore >= WIN_TARGET) {
        setStatus(GameStatus.WON);
      }
      return newScore;
    });

    setApples(prev => {
      // Remove the clicked apple
      const remaining = prev.filter(apple => apple.id !== id);
      
      // Keep the "wall" dense by adding new apples immediately
      const spawnCount = Math.random() > 0.5 ? 2 : 1;
      const newSpawn: AppleData[] = [];
      for(let i = 0; i < spawnCount; i++) {
        newSpawn.push(createApple(`apple-new-${Date.now()}-${i}`));
      }
      
      return [...remaining, ...newSpawn];
    });
  }, [status, createApple]);

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
            ? `The user cleared a massive wall of ${WIN_TARGET} apples. Congratulate them on revealing the hidden orchard master in a witty way.`
            : `The user only cleared ${score} out of ${WIN_TARGET} apples. Give a funny, rustic encouragement.`;
            
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          setFeedback(response.text ?? null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "You've cleared the orchard wall!" : "The apples are still winning...");
        }
      };
      generateMessage();
    }
  }, [status, score]);

  const getBgConfig = () => {
    switch(deviceType) {
      case 'mobile':
        return { scale: 1.15, z: -100, blur: status === GameStatus.PLAYING ? 'blur(8px)' : 'none' };
      case 'tablet':
        return { scale: 0.9, z: -30, blur: status === GameStatus.PLAYING ? 'blur(6px)' : 'none' };
      default:
        return { scale: 1.25, z: -150, blur: status === GameStatus.PLAYING ? 'blur(10px)' : 'none' };
    }
  };

  const { scale: bgScale, z: bgZ, blur: bgBlur } = getBgConfig();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* 3D Glass Header */}
      <div className="fixed top-0 left-0 w-full z-[2000] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 bg-gradient-to-b from-black/95 via-black/40 to-transparent pointer-events-none safe-top">
        <div className="flex flex-col items-center md:items-start drop-shadow-lg">
          <h1 className="text-white text-2xl md:text-3xl font-black tracking-tighter">
            APPLE <span className="text-red-500">CURTAIN</span>
          </h1>
          <p className="hidden md:block text-red-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-90">Clear the wall to see the truth</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 bg-black/80 px-6 md:px-10 py-3 rounded-2xl border border-white/20 backdrop-blur-3xl shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Time</span>
            <span className={`text-xl md:text-3xl font-mono font-black tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-px h-10 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Harvested</span>
            <span className="text-xl md:text-3xl font-mono font-black tabular-nums text-green-400">
              {score}<span className="text-sm text-white/30 ml-1">/ {WIN_TARGET}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3D Game Perspective Engine */}
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{ perspective: deviceType === 'mobile' ? '600px' : '1000px', perspectiveOrigin: '50% 50%' }}
      >
        <div 
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Background Layer - Hidden at the start (IDLE state) */}
          <div 
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${status === GameStatus.IDLE ? 'opacity-0 scale-125' : 'opacity-100'}`} 
            style={{ 
              transform: `translate3d(0,0,${bgZ}px) scale(${bgScale})`,
              transformOrigin: 'center center',
              filter: bgBlur
            }}
          >
            <img 
              src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
              className="w-full h-full object-cover" 
              style={{ objectPosition: 'center center' }}
              alt="Orchard Scene"
            />
          </div>

          {/* Interactive Apple Layer */}
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
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-6 transition-all duration-700">
          <div className="bg-gradient-to-br from-neutral-900 to-black p-10 md:p-14 rounded-[4rem] shadow-2xl border border-white/10 max-w-sm md:max-w-md w-full transform transition-all text-center">
            {status === GameStatus.IDLE ? (
              <>
                <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-red-950 rounded-[3rem] mx-auto mb-10 flex items-center justify-center shadow-[0_20px_50px_rgba(220,38,38,0.4)]">
                   <div className="w-20 h-20 bg-white rounded-full relative shadow-inner overflow-hidden">
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-10 bg-amber-900 rounded-full"></div>
                      <div className="absolute top-2 left-2 w-10 h-10 bg-red-100 rounded-full blur-xl opacity-50"></div>
                   </div>
                </div>
                <h2 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase leading-none italic">ORIGINAL<br/>HARVEST</h2>
                <p className="text-white/50 mb-12 font-medium leading-relaxed px-2 text-lg">
                  A dense wall of apples hides the guardian. Every one you clear, <span className="text-red-400 font-bold">more appear</span>. Reach {WIN_TARGET} clears to win!
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-9xl mb-8 animate-bounce">🍎</div>
                <h2 className="text-5xl font-black text-green-400 mb-4 italic uppercase tracking-tighter">SUCCESS!</h2>
                <p className="text-white/80 text-xl font-bold mb-8">The Orchard is Revealed</p>
                {feedback && <div className="text-white/60 italic mb-10 bg-white/5 p-8 rounded-[2rem] border border-white/5 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            ) : (
              <>
                <div className="text-9xl mb-8 opacity-40">🍏</div>
                <h2 className="text-5xl font-black text-red-500 mb-4 uppercase italic tracking-tighter">OUT OF TIME</h2>
                <p className="text-white/80 text-xl font-bold mb-8">Cleared {score} / {WIN_TARGET}</p>
                {feedback && <div className="text-white/60 italic mb-10 bg-white/5 p-8 rounded-[2rem] border border-white/5 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            )}

            <button
              onClick={initGame}
              className="group relative w-full py-8 px-12 bg-red-600 hover:bg-red-500 text-white font-black rounded-[2.5rem] transition-all shadow-[0_20px_40px_rgba(220,38,38,0.3)] active:scale-95 text-3xl uppercase tracking-[0.2em] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative drop-shadow-2xl">{status === GameStatus.IDLE ? 'START HARVEST' : 'RETRY'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initGame = useCallback(() => {
    const mobile = window.innerWidth < 768;
    const newApples: AppleData[] = [];
    
    // Distribution logic adapted for 3D and responsive filling
    const columns = mobile ? 10 : 15;
    const rows = Math.ceil(TOTAL_APPLES / columns);
    
    for (let i = 0; i < TOTAL_APPLES; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const baseX = (col * (100 / columns)) + (mobile ? 5 : 3);
      const baseY = (row * (100 / rows)) + 2;
      
      newApples.push({
        id: `apple-${i}`,
        x: Math.min(96, Math.max(4, baseX + (Math.random() * (mobile ? 8 : 4) - (mobile ? 4 : 2)))),
        y: Math.min(98, Math.max(2, baseY + (Math.random() * 4 - 2))),
        z: Math.random() * 200 - 100,
        size: mobile ? (32 + Math.random() * 12) : (28 + Math.random() * 10),
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
            ? `Congratulate the user for harvesting all ${TOTAL_APPLES} apples. Keep it energetic and brief.`
            : `User failed the harvest. They got ${score} out of ${TOTAL_APPLES}. Give a short, funny orchard-themed encouragement.`;
            
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
  }, [status, score, timeLeft]);

  // Dynamic scale to prevent excessive cropping on mobile while maintaining 3D depth
  const bgScale = isMobile ? 1.05 : 1.15;
  const bgZ = isMobile ? -50 : -100;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* 3D Glass Header - Fully Responsive */}
      <div className="fixed top-0 left-0 w-full z-40 p-3 md:p-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none safe-top">
        <div className="flex flex-col items-center md:items-start">
          <h1 className="text-white text-xl md:text-3xl font-black tracking-tighter drop-shadow-xl">
            APPLE <span className="text-red-500">3D</span>
          </h1>
          <p className="hidden md:block text-red-400 text-[9px] font-black uppercase tracking-[0.3em] opacity-80">PRO ORCHARD CHALLENGE</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-10 bg-black/60 px-4 md:px-8 py-2 md:py-3 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Time</span>
            <span className={`text-lg md:text-3xl font-mono font-black tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-px h-6 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Score</span>
            <span className="text-lg md:text-3xl font-mono font-black tabular-nums text-green-400">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Game Perspective Engine */}
      <div 
        className="relative w-full h-full overflow-hidden scrollbar-hide"
        style={{ perspective: isMobile ? '800px' : '1000px', perspectiveOrigin: '50% 50%' }}
      >
        <div 
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Responsive Background Layer */}
          <div 
            className="w-full h-full transition-transform duration-700 ease-out" 
            style={{ transform: `translate3d(0,0,${bgZ}px) scale(${bgScale})` }}
          >
            <img 
              src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
              className="bg-3d-image" 
              alt="Orchard Scene"
              style={{ objectPosition: 'center center' }}
            />
          </div>

          {/* Depth-Enhanced Interactive Layer */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-6 transition-all duration-700">
          <div className="bg-gradient-to-br from-slate-900 to-black p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-white/5 max-w-sm md:max-w-md w-full transform transition-all text-center">
            {status === GameStatus.IDLE ? (
              <>
                <div className="w-20 h-20 bg-red-600 rounded-[1.5rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-red-600/30">
                   <div className="w-12 h-12 bg-white rounded-full relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-5 bg-amber-900 rounded-full"></div>
                   </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tighter uppercase">Ready?</h2>
                <p className="text-white/60 mb-8 font-medium leading-relaxed text-sm md:text-base">
                  Tap all <span className="text-white font-bold">{TOTAL_APPLES}</span> apples in 60 seconds to clear the orchard view!
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-6xl md:text-8xl mb-4">🏆</div>
                <h2 className="text-3xl md:text-4xl font-black text-green-400 mb-2">VICTORY</h2>
                <p className="text-white text-lg font-bold mb-6 italic">Perfect Harvest!</p>
                {feedback && <div className="text-white/60 italic mb-8 bg-white/5 p-4 rounded-xl border border-white/10 text-xs md:text-sm">"{feedback}"</div>}
              </>
            ) : (
              <>
                <div className="text-6xl md:text-8xl mb-4 grayscale opacity-40">🍎</div>
                <h2 className="text-3xl md:text-4xl font-black text-red-500 mb-2 uppercase">FAILED</h2>
                <p className="text-white text-lg font-bold mb-6 opacity-70">Collected {score} / {TOTAL_APPLES}</p>
                {feedback && <div className="text-white/60 italic mb-8 bg-white/5 p-4 rounded-xl border border-white/10 text-xs md:text-sm">"{feedback}"</div>}
              </>
            )}

            <button
              onClick={initGame}
              className="group relative w-full py-5 md:py-6 px-8 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 text-xl md:text-2xl uppercase tracking-widest overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {status === GameStatus.IDLE ? 'START' : 'RETRY'}
            </button>
          </div>
        </div>
      )}

      {/* Tapping Hint for Mobile */}
      {status === GameStatus.PLAYING && apples.length > (TOTAL_APPLES - 5) && (
        <div className="fixed bottom-10 z-20 flex flex-col items-center pointer-events-none opacity-40">
          <div className="w-10 h-10 border-2 border-white/20 rounded-full flex justify-center items-center backdrop-blur-sm">
            <div className="w-4 h-4 bg-white/40 rounded-full animate-ping"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


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
    
    // Grid density adjusted for TOTAL_APPLES (e.g. 600)
    // We want to fill the entire 0-100% space
    const columns = mobile ? 12 : 20;
    const rows = Math.ceil(TOTAL_APPLES / columns);
    
    const cellWidth = 100 / columns;
    const cellHeight = 100 / rows;
    
    for (let i = 0; i < TOTAL_APPLES; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Calculate center of cell then add significant jitter to break the grid look
      // but keep enough structure to ensure "full coverage"
      const baseX = (col * cellWidth) + (cellWidth / 2);
      const baseY = (row * cellHeight) + (cellHeight / 2);
      
      newApples.push({
        id: `apple-${i}`,
        // Use full 0-100 range with jitter that can reach edges
        x: Math.min(100, Math.max(0, baseX + (Math.random() * cellWidth - cellWidth / 2) * 1.5)),
        y: Math.min(100, Math.max(0, baseY + (Math.random() * cellHeight - cellHeight / 2) * 1.5)),
        z: Math.random() * 200 - 100,
        size: mobile ? (35 + Math.random() * 15) : (30 + Math.random() * 15),
        rotation: Math.random() * 360,
        delay: Math.random() * 1.5,
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
            ? `Congratulate the user for clearing all ${TOTAL_APPLES} apples and revealing the orchard. Short and sweet.`
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
  }, [status, score, timeLeft]);

  // Background scaling to ensure it fills the container perfectly
  const bgScale = isMobile ? 1.1 : 1.2;
  const bgZ = isMobile ? -60 : -100;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* 3D Glass Header */}
      <div className="fixed top-0 left-0 w-full z-40 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent pointer-events-none safe-top">
        <div className="flex flex-col items-center md:items-start">
          <h1 className="text-white text-2xl md:text-3xl font-black tracking-tighter drop-shadow-2xl">
            APPLE <span className="text-red-500">CLEAR</span>
          </h1>
          <p className="hidden md:block text-red-400 text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Full Screen Harvest</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-10 bg-black/60 px-5 md:px-8 py-2 md:py-3 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Remaining</span>
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
        style={{ perspective: isMobile ? '800px' : '1200px', perspectiveOrigin: '50% 50%' }}
      >
        <div 
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Background Layer - The "Hidden" Reward */}
          <div 
            className="absolute inset-0 transition-transform duration-700 ease-out" 
            style={{ transform: `translate3d(0,0,${bgZ}px) scale(${bgScale})` }}
          >
            <img 
              src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
              className="w-full h-full object-cover" 
              alt="Orchard Scene"
            />
          </div>

          {/* Dense Interactive Layer - The "Curtain" */}
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

      {/* Game Over / Start Overlay */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-6 transition-all duration-700">
          <div className="bg-gradient-to-br from-slate-900 to-black p-8 md:p-12 rounded-[3rem] shadow-2xl border border-white/5 max-w-sm md:max-w-md w-full transform transition-all text-center">
            {status === GameStatus.IDLE ? (
              <>
                <div className="w-24 h-24 bg-red-600 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-red-600/30">
                   <div className="w-14 h-14 bg-white rounded-full relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-6 bg-amber-900 rounded-full"></div>
                   </div>
                </div>
                <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Harvest Time</h2>
                <p className="text-white/60 mb-10 font-medium leading-relaxed">
                  The background is hidden behind <span className="text-white font-bold">{TOTAL_APPLES}</span> apples. Click them all to reveal the beautiful orchard!
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-8xl mb-6">🍎</div>
                <h2 className="text-4xl font-black text-green-400 mb-2 italic">CLEARED!</h2>
                <p className="text-white text-xl font-bold mb-6">Orchard Fully Revealed</p>
                {feedback && <div className="text-white/60 italic mb-8 bg-white/5 p-5 rounded-2xl border border-white/10 text-sm">"{feedback}"</div>}
              </>
            ) : (
              <>
                <div className="text-8xl mb-6 grayscale opacity-30">🍏</div>
                <h2 className="text-4xl font-black text-red-500 mb-2 uppercase">TIME UP</h2>
                <p className="text-white text-xl font-bold mb-6 opacity-70">Cleared {score} / {TOTAL_APPLES}</p>
                {feedback && <div className="text-white/60 italic mb-8 bg-white/5 p-5 rounded-2xl border border-white/10 text-sm">"{feedback}"</div>}
              </>
            )}

            <button
              onClick={initGame}
              className="group relative w-full py-6 px-10 bg-red-600 hover:bg-red-500 text-white font-black rounded-3xl transition-all shadow-xl active:scale-95 text-2xl uppercase tracking-widest overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {status === GameStatus.IDLE ? 'START HARVEST' : 'RESTART'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

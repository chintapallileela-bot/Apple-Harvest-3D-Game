
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
  const timerRef = useRef<any>(null);

  const initGame = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const newApples: AppleData[] = [];
    
    // Distribution logic adapted for 3D and responsive filling
    const columns = isMobile ? 8 : 12;
    const rows = Math.ceil(TOTAL_APPLES / columns);
    
    for (let i = 0; i < TOTAL_APPLES; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      const baseX = (col * (100 / columns)) + (isMobile ? 6 : 4);
      const baseY = (row * (100 / rows)) + 1;
      
      newApples.push({
        id: `apple-${i}`,
        // Mobile-aware X/Y boundaries
        x: Math.min(94, Math.max(6, baseX + (Math.random() * (isMobile ? 10 : 6) - (isMobile ? 5 : 3)))),
        y: Math.min(99, Math.max(1, baseY + (Math.random() * 4 - 2))),
        z: Math.random() * 250 - 125, // More pronounced Z depth
        size: isMobile ? (38 + Math.random() * 15) : (30 + Math.random() * 12), // Larger apples on mobile for easier tapping
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

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* 3D Glass Header - Fully Responsive */}
      <div className="fixed top-0 left-0 w-full z-40 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none safe-top">
        <div className="flex flex-col items-center md:items-start">
          <h1 className="text-white text-2xl md:text-3xl font-black tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            APPLE <span className="text-red-500">3D</span>
          </h1>
          <p className="hidden md:block text-red-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-80">PRO ORCHARD CHALLENGE</p>
        </div>
        
        <div className="flex items-center gap-6 md:gap-10 bg-black/40 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[9px] uppercase font-black tracking-widest">Time</span>
            <span className={`text-xl md:text-3xl font-mono font-black tabular-nums ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-px h-6 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/50 text-[9px] uppercase font-black tracking-widest">Score</span>
            <span className="text-xl md:text-3xl font-mono font-black tabular-nums text-green-400">
              {score}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Game Perspective Engine */}
      <div 
        className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide touch-auto"
        style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
      >
        <div 
          className="relative min-h-[200%] w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Background Images - Set for mobile/tablet view with high-quality covering */}
          <div className="w-full h-[100dvh]" style={{ transform: 'translate3d(0,0,-100px) scale(1.2)' }}>
            <img 
              src="https://i.postimg.cc/XYvSRPWd/Avatar1.jpg" 
              className="bg-3d-image" 
              alt="Orchard Scene 1"
            />
          </div>
          <div className="w-full h-[100dvh]" style={{ transform: 'translate3d(0,0,-100px) scale(1.2)' }}>
            <img 
              src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
              className="bg-3d-image" 
              alt="Orchard Scene 2"
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

      {/* Mobile/Tablet Optimized Overlays */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl p-6 md:p-10 transition-all duration-700">
          <div className="bg-gradient-to-br from-slate-900 to-black p-8 md:p-12 rounded-[3rem] shadow-[0_0_80px_rgba(220,38,38,0.2)] border border-white/5 max-w-sm md:max-w-md w-full transform transition-all scale-100 hover:scale-[1.02]">
            {status === GameStatus.IDLE ? (
              <>
                <div className="w-24 h-24 bg-red-600 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-2xl shadow-red-600/30 transform rotate-12">
                   <div className="w-14 h-14 bg-white rounded-full relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-6 bg-amber-900 rounded-full"></div>
                   </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">APPLE<br/>HARVEST</h2>
                <p className="text-white/60 mb-10 font-medium leading-relaxed">
                  A 3D orchard awaits. Harvest <span className="text-white font-bold">{TOTAL_APPLES}</span> apples across the dual landscapes. Swipe down to discover them all!
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-8xl mb-6">🏆</div>
                <h2 className="text-4xl font-black text-green-400 mb-2">COMPLETE</h2>
                <p className="text-white text-xl font-bold mb-6 italic">Perfect Harvest!</p>
                {feedback && <div className="text-white/60 italic mb-8 bg-white/5 p-5 rounded-2xl border border-white/10 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            ) : (
              <>
                <div className="text-8xl mb-6 grayscale opacity-40">🍎</div>
                <h2 className="text-4xl font-black text-red-500 mb-2 uppercase">TIMEOUT</h2>
                <p className="text-white text-xl font-bold mb-6 opacity-70">Harvested {score} / {TOTAL_APPLES}</p>
                {feedback && <div className="text-white/60 italic mb-8 bg-white/5 p-5 rounded-2xl border border-white/10 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            )}

            <button
              onClick={initGame}
              className="group relative w-full py-6 px-10 bg-red-600 hover:bg-red-500 text-white font-black rounded-3xl transition-all shadow-[0_15px_35px_rgba(220,38,38,0.4)] active:scale-95 text-2xl uppercase tracking-widest overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              {status === GameStatus.IDLE ? 'PLAY NOW' : 'RETRY'}
            </button>
            <p className="mt-8 text-white/20 text-[10px] uppercase font-black tracking-[0.4em]">Optimized for mobile & tablet</p>
          </div>
        </div>
      )}

      {/* Scrolling Indicator for Mobile */}
      <div className="fixed bottom-10 z-20 flex flex-col items-center pointer-events-none opacity-50 safe-bottom">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center p-1 backdrop-blur-md">
          <div className="w-1.5 h-3 bg-red-500 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default App;

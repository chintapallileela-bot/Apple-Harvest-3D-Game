
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
    const newApples: AppleData[] = [];
    
    // Fill the ENTIRE 200% height container.
    // X range: 2% to 95%
    // Y range: 2% to 98% of the total 200% height container
    
    const columns = 12;
    const rows = Math.ceil(TOTAL_APPLES / columns);
    
    for (let i = 0; i < TOTAL_APPLES; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Distributed across the whole width and height
      const baseX = (col * (100 / columns)) + 2;
      const baseY = (row * (100 / rows)) + 1;
      
      newApples.push({
        id: `apple-${i}`,
        // Jitter for natural look while maintaining full coverage
        x: Math.min(95, Math.max(2, baseX + (Math.random() * 6 - 3))),
        y: Math.min(98, Math.max(1, baseY + (Math.random() * 4 - 2))),
        size: 28 + Math.random() * 12,
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
            ? `Congratulate the user for harvesting all ${TOTAL_APPLES} apples in ${GAME_DURATION - timeLeft} seconds! Keep it short and encouraging.`
            : `Comfort the user for failing to harvest all apples. They collected ${score} out of ${TOTAL_APPLES}. Keep it short and cheeky.`;
            
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          setFeedback(response.text ?? null);
        } catch (e) {
          console.error("Failed to fetch AI feedback", e);
          setFeedback(status === GameStatus.WON ? "Amazing harvest!" : "Better luck next time!");
        }
      };
      generateMessage();
    }
  }, [status, score, timeLeft]);

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center bg-slate-900 overflow-hidden font-sans">
      
      {/* UI Header */}
      <div className="absolute top-0 left-0 w-full z-30 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex flex-col">
          <h1 className="text-white text-2xl font-bold tracking-tight drop-shadow-md">APPLE HARVEST</h1>
          <p className="text-red-400 text-sm font-medium">Clear the whole world!</p>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs uppercase tracking-widest">Time Remaining</span>
            <span className={`text-4xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-gray-400 text-xs uppercase tracking-widest">Harvested</span>
            <span className="text-4xl font-mono font-bold text-green-400">
              {score}/{TOTAL_APPLES}
            </span>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="relative w-full h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
        <div className="relative min-h-[200%] w-full">
          {/* Background Images */}
          <div className="w-full h-[100vh]">
            <img 
              src="https://i.postimg.cc/XYvSRPWd/Avatar1.jpg" 
              className="w-full h-full object-cover" 
              alt="Background top"
            />
          </div>
          <div className="w-full h-[100vh]">
            <img 
              src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
              className="w-full h-full object-cover" 
              alt="Background bottom"
            />
          </div>

          {/* Overlay Grid for Apples */}
          <div className="absolute inset-0 pointer-events-auto">
            {apples.map(apple => (
              <Apple key={apple.id} data={apple} onClick={handleAppleClick} />
            ))}
          </div>
        </div>
      </div>

      {/* Game Over / Start Overlay */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-center">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 max-w-md w-full transform transition-all animate-in fade-in zoom-in duration-300">
            {status === GameStatus.IDLE ? (
              <>
                <div className="w-20 h-20 bg-red-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-red-900/40">
                   <div className="w-12 h-12 bg-white rounded-full relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-amber-800 rounded-full"></div>
                   </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">The Great Harvest</h2>
                <p className="text-gray-400 mb-8">The entire world is covered in fruit! Harvest all {TOTAL_APPLES} apples across both landscapes in 60 seconds.</p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-4xl font-bold text-green-400 mb-2">Absolute Master!</h2>
                <p className="text-white text-lg font-medium mb-4">You successfully harvested the entire world.</p>
                {feedback && <p className="text-gray-300 italic mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700">"{feedback}"</p>}
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">🍎</div>
                <h2 className="text-4xl font-bold text-red-500 mb-2">Time's Up!</h2>
                <p className="text-white text-lg mb-4">You gathered {score} out of {TOTAL_APPLES} apples.</p>
                {feedback && <p className="text-gray-300 italic mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-700">"{feedback}"</p>}
              </>
            )}

            <button
              onClick={initGame}
              className="w-full py-4 px-8 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-red-600/20 active:scale-95 text-xl"
            >
              {status === GameStatus.IDLE ? 'BEGIN HARVEST' : 'RETRY MISSION'}
            </button>
            <p className="mt-4 text-gray-500 text-sm">Scroll down to find every single apple!</p>
          </div>
        </div>
      )}

      {/* Background Hint */}
      <div className="fixed bottom-4 right-4 z-20 text-white/30 text-xs pointer-events-none uppercase tracking-widest">
        Scroll to uncover the full scene
      </div>
    </div>
  );
};

export default App;

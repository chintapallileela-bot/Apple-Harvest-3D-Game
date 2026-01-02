
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, AppleData, ParticleData, Theme } from './types';
import { GAME_DURATION, THEMES } from './constants';
import Apple from './components/Apple';
import Particle from './components/Particle';
import { GoogleGenAI } from '@google/genai';

const WIN_TARGET = 100;
const HERO_APPLE_IMAGE = "https://i.postimg.cc/nc3MbVTw/Apple.jpg";
const TOP_BAR_HEIGHT = 80; // height in pixels
const SAFE_BOTTOM_MARGIN = 10;
const SIDE_MARGIN = 5;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [apples, setApples] = useState<AppleData[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [countdown, setCountdown] = useState<number | string>(3);
  
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  const playSound = (type: 'pop' | 'start' | 'win' | 'lose' | 'chime' | 'countdown' | 'click', currentScore?: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      switch (type) {
        case 'click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, now);
          osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(now + 0.1);
          break;
        }
        case 'pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100 + Math.random() * 400, now);
          osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
        case 'chime': {
          const progress = Math.min((currentScore || 0) / WIN_TARGET, 1);
          const baseFreq = 880 + (progress * 440);
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(baseFreq, now);
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.05, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          o.start(now);
          o.stop(now + 0.4);
          break;
        }
        case 'start': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }
        case 'countdown': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(660, now);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        }
        case 'win':
          [523, 659, 783, 1046].forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.setValueAtTime(f, now + i * 0.1);
            g.gain.setValueAtTime(0.1, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
            o.start(now + i * 0.1);
            o.stop(now + i * 0.1 + 0.5);
          });
          break;
        case 'lose': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(60, now + 0.5);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }
      }
    } catch (e) {}
  };

  const createAppleAt = useCallback((id: string, x: number, y: number, isSpawnSequence = false): AppleData => {
    return {
      id,
      x,
      y,
      z: Math.random() * 40 - 20, 
      size: deviceType === 'mobile' ? (40 + Math.random() * 10) : (55 + Math.random() * 15),
      rotation: Math.random() * 360,
      delay: isSpawnSequence ? Math.random() * 0.5 : 0,
      color: 'red', 
      variationSeed: Math.random(),
    };
  }, [deviceType]);

  const triggerBurst = useCallback((apple: AppleData) => {
    const newParticles: ParticleData[] = [];
    const count = 18;
    const types: ('flesh' | 'juice' | 'seed' | 'leaf')[] = ['flesh', 'juice', 'seed', 'leaf'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const force = 120 + Math.random() * 180;
      const type = types[Math.floor(Math.random() * types.length)];
      let color = '#ef4444'; 
      let size = 6 + Math.random() * 8;
      if (type === 'flesh') color = '#fffbeb';
      else if (type === 'juice') color = '#dc2626';
      else if (type === 'seed') color = '#451a03';
      else if (type === 'leaf') color = '#22c55e';

      newParticles.push({
        id: `p-${Date.now()}-${i}`,
        x: apple.x, 
        y: apple.y, 
        z: apple.z,
        vx: Math.cos(angle) * force, 
        vy: Math.sin(angle) * force,
        color: color,
        type: type as any,
        size: size,
        rotation: Math.random() * 360,
        spinSpeed: (Math.random() - 0.5) * 20
      });
    }

    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 850);
  }, []);

  const runCountdown = useCallback(() => {
    setStatus(GameStatus.COUNTDOWN);
    let countNum = 3;
    setCountdown(countNum);
    playSound('countdown');

    const interval = setInterval(() => {
      countNum -= 1;
      if (countNum > 0) {
        setCountdown(countNum);
        playSound('countdown');
      } else if (countNum === 0) {
        setCountdown('GO!');
        playSound('start');
      } else {
        clearInterval(interval);
        setStatus(GameStatus.PLAYING);
      }
    }, 1000);
  }, []);

  const startThemeSelection = () => {
    playSound('click');
    setStatus(GameStatus.SELECT_THEME);
  };

  const initGame = useCallback(() => {
    playSound('click');
    setStatus(GameStatus.SPAWNING);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFeedback(null);
    setParticles([]);

    const totalApples = WIN_TARGET;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight - TOP_BAR_HEIGHT;
    const aspectRatio = screenWidth / screenHeight;

    const cols = Math.max(1, Math.floor(Math.sqrt(totalApples * aspectRatio * 1.5)));
    const rows = Math.ceil(totalApples / cols);
    
    const xAvailable = 100 - (SIDE_MARGIN * 2);
    const yAvailable = 100 - SAFE_BOTTOM_MARGIN - 5; // Extra padding
    
    const cellWidth = xAvailable / cols;
    const cellHeight = yAvailable / rows;
    
    const initialBatch: AppleData[] = [];
    let count = 0;
    for (let r = 0; r < rows && count < totalApples; r++) {
      for (let c = 0; c < cols && count < totalApples; c++) {
        const jitterX = (Math.random() - 0.5) * (cellWidth * 0.7);
        const jitterY = (Math.random() - 0.5) * (cellHeight * 0.7);
        const x = SIDE_MARGIN + (c * cellWidth) + (cellWidth / 2) + jitterX;
        const y = 5 + (r * cellHeight) + (cellHeight / 2) + jitterY;
        initialBatch.push(createAppleAt(`apple-${count}-${Date.now()}`, x, y, true));
        count++;
      }
    }
    setApples(initialBatch);

    setTimeout(() => {
      runCountdown();
    }, 1200);
  }, [createAppleAt, runCountdown]);

  const quitToHome = useCallback(() => {
    playSound('click');
    setStatus(GameStatus.IDLE);
    setApples([]);
    setParticles([]);
  }, []);

  const stopGame = useCallback(() => {
    playSound('click');
    setStatus(GameStatus.SELECT_THEME);
    setApples([]);
    setParticles([]);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const endGame = useCallback(() => {
    playSound('click');
    if (score >= WIN_TARGET) {
      setStatus(GameStatus.WON);
      playSound('win');
    } else {
      setStatus(GameStatus.LOST);
      playSound('lose');
    }
    setApples([]);
    setParticles([]);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [score]);

  const handleAppleClick = useCallback((id: string) => {
    if (status !== GameStatus.PLAYING) return;
    setApples(prev => {
      const target = prev.find(a => a.id === id);
      if (target) {
        triggerBurst(target);
        playSound('pop');
        const newScore = score + 1;
        setScore(newScore);
        if (newScore % 5 === 0) playSound('chime', newScore);
        if (newScore >= WIN_TARGET) {
          setStatus(GameStatus.WON);
          playSound('win');
        }
        return prev.filter(a => a.id !== id);
      }
      return prev;
    });
  }, [status, score, triggerBurst]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setStatus(GameStatus.LOST);
            playSound('lose');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  useEffect(() => {
    if (status === GameStatus.WON || status === GameStatus.LOST) {
      const generateMessage = async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = status === GameStatus.WON 
            ? "Short congratulatory message for popping 100 apples. Thematic but concise."
            : "Short encouraging message for missing the 100 apple harvest.";
          const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setFeedback(res.text || null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "Harvest complete!" : "Better luck next harvest.");
        }
      };
      generateMessage();
    }
  }, [status]);

  const showGameBackground = status !== GameStatus.IDLE;

  return (
    <div className="flex flex-col w-full h-full bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* HUD Bar (Top Bar) - Dedicated space */}
      <div 
        className="relative w-full z-[3000] px-4 flex justify-between items-center bg-stone-900 border-b border-white/10 shadow-lg shrink-0 overflow-visible"
        style={{ height: `${TOP_BAR_HEIGHT}px` }}
      >
        <div className="flex flex-col">
          <h1 className="text-white text-lg md:text-xl font-black italic tracking-tighter leading-none">
            {selectedTheme.name.toUpperCase()} <span className="text-red-500">HARVEST</span>
          </h1>
          <p className="text-[8px] text-white/50 uppercase font-bold tracking-widest mt-1">Popped: {score} / {WIN_TARGET}</p>
        </div>

        {/* Action Buttons & Stats */}
        <div className="flex items-center gap-3">
           {(status === GameStatus.PLAYING || status === GameStatus.COUNTDOWN || status === GameStatus.SPAWNING) && (
             <div className="flex flex-col gap-1 items-end">
               <button 
                 onPointerDown={endGame}
                 className="bg-red-600 hover:bg-red-500 active:scale-95 transition-all text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase shadow-lg border border-red-400/30 w-24"
               >
                 END GAME
               </button>
               <button 
                 onPointerDown={initGame}
                 className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase border border-white/10 w-24"
               >
                 RESTART
               </button>
             </div>
           )}
           
           {(status === GameStatus.PLAYING || status === GameStatus.COUNTDOWN || status === GameStatus.SPAWNING) && (
             <div className="flex items-center gap-4 bg-black/40 px-5 py-2.5 rounded-xl border border-white/10">
                <div className="flex flex-col items-center">
                  <span className="text-white/40 text-[7px] uppercase font-black">Time</span>
                  <span className={`text-lg font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {timeLeft < 10 ? `0:0${timeLeft}` : `0:${timeLeft}`}
                  </span>
                </div>
                <div className="w-[1px] h-6 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-white/40 text-[7px] uppercase font-black">Score</span>
                  <span className="text-lg font-mono font-black text-green-400">{score}</span>
                </div>
              </div>
           )}
        </div>
      </div>

      {/* Game Area Container - Below Top Bar */}
      <div className="relative flex-grow w-full bg-stone-950 overflow-hidden">
        
        {/* Main Background Area - Revealed only after IDLE */}
        <div className={`absolute inset-0 z-0 transition-opacity duration-700 ease-in-out ${showGameBackground ? 'opacity-100' : 'opacity-0'}`}>
          <img 
            src={selectedTheme.image} 
            className="w-full h-full object-cover brightness-[0.8] scale-105 transition-transform duration-1000" 
            alt="Background"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Apple/Game Layer */}
        <div className="relative w-full h-full overflow-hidden" style={{ perspective: '1200px' }}>
          <div className="absolute inset-0 z-20 pointer-events-auto" style={{ transformStyle: 'preserve-3d' }}>
            {apples.map(a => <Apple key={a.id} data={a} onClick={handleAppleClick} />)}
            {particles.map(p => <Particle key={p.id} data={p} />)}
          </div>
        </div>

        {/* Countdown Overlay (Inside Game Area) */}
        {status === GameStatus.COUNTDOWN && (
          <div className="absolute inset-0 z-[2500] flex flex-col items-center justify-center pointer-events-none bg-black/30 backdrop-blur-sm">
            <div key={countdown} className={`text-[10rem] md:text-[18rem] font-black italic text-center ${countdown === 'GO!' ? 'text-red-500' : 'text-white'} animate-[countdown-pop_0.6s_forwards]`}>
              {countdown}
            </div>
          </div>
        )}

        {/* Landing Page (IDLE) - Full Screen Overlay but behind top bar? No, usually landing covers all. 
            User said background and apples below top bar. I will keep overlays within game area or full screen depending on context. */}
        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <div className="bg-stone-900/90 p-10 md:p-14 rounded-[3rem] border border-white/10 max-w-md w-full text-center shadow-2xl overflow-hidden relative">
              <div className="relative w-full h-40 flex items-center justify-center mb-8">
                <div className="relative w-40 h-40 animate-[bounce_4s_infinite_ease-in-out]">
                  <img src={HERO_APPLE_IMAGE} className="w-full h-full object-contain rounded-full border-4 border-white/5 shadow-2xl" alt="Apple Hero" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-4 italic tracking-tighter uppercase leading-none text-center">APPLE HARVEST</h2>
              <p className="text-white/60 mb-10 text-sm font-medium text-center">Harvest 100 apples in 60 seconds!</p>
              <button onPointerDown={startThemeSelection} className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all active:scale-95 text-xl uppercase tracking-widest shadow-xl">START</button>
            </div>
          </div>
        )}

        {/* Theme Selection Page */}
        {status === GameStatus.SELECT_THEME && (
          <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 overflow-y-auto scrollbar-hide">
            <div className="bg-stone-900/90 p-6 md:p-10 rounded-[2.5rem] border border-white/10 max-w-2xl w-full flex flex-col items-center shadow-2xl my-auto backdrop-blur-xl">
              <h2 className="text-2xl font-black text-white mb-2 italic tracking-tighter uppercase text-center">SELECT THEME</h2>
              <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mb-6 text-center">Choose your harvest location</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mb-8 max-h-[45vh] overflow-y-auto p-1 scrollbar-hide">
                {THEMES.map((theme) => (
                  <button 
                    key={theme.id}
                    onPointerDown={() => { playSound('click'); setSelectedTheme(theme); }}
                    className={`py-3 px-2 rounded-xl text-center transition-all duration-300 border-2 flex flex-col items-center justify-center gap-1
                      ${selectedTheme.id === theme.id 
                        ? 'bg-red-600 border-red-400 scale-[1.02] shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 opacity-70 hover:opacity-100'}`}
                  >
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors leading-tight ${selectedTheme.id === theme.id ? 'text-white' : 'text-white/70'}`}>
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 w-full sm:max-w-xs">
                <button
                  onPointerDown={initGame}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all active:scale-95 text-lg uppercase tracking-widest shadow-lg"
                >
                  START HARVEST
                </button>
                <button
                  onPointerDown={() => setStatus(GameStatus.IDLE)}
                  className="w-full py-1 text-white/30 hover:text-white uppercase font-black text-[9px] transition-colors"
                >
                  BACK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Win/Loss Screens (The "Last Page") */}
        {(status === GameStatus.WON || status === GameStatus.LOST) && (
          <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4">
            <div className="bg-stone-900/90 p-8 md:p-12 rounded-[3rem] border border-white/10 max-w-md w-full text-center shadow-2xl relative">
              <div className="text-6xl mb-6">{status === GameStatus.WON ? '🧺' : '❄️'}</div>
              <h2 className={`text-3xl font-black mb-2 italic uppercase ${status === GameStatus.WON ? 'text-green-400' : 'text-red-500'}`}>
                {status === GameStatus.WON ? 'VICTORY' : 'FROZEN'}
              </h2>
              <p className="text-white/80 font-bold text-lg mb-4 text-center">Popped {score} / {WIN_TARGET} apples</p>
              {feedback && <div className="text-white/40 italic text-[11px] mb-8 px-4 text-center leading-relaxed">"{feedback}"</div>}
              <div className="space-y-3 w-full">
                <button onPointerDown={initGame} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all active:scale-95 text-md uppercase shadow-lg">RETRY</button>
                <button onPointerDown={startThemeSelection} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all active:scale-95 text-[10px] uppercase tracking-widest border border-white/10">CHANGE THEME</button>
                <button onPointerDown={quitToHome} className="w-full py-1.5 text-white/30 hover:text-white uppercase font-black text-[9px] transition-colors">MAIN MENU</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;

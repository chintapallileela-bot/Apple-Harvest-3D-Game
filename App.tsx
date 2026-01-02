
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, AppleData, ParticleData, Theme } from './types';
import { GAME_DURATION, THEMES } from './constants';
import Apple from './components/Apple';
import Particle from './components/Particle';
import { GoogleGenAI } from '@google/genai';

const WIN_TARGET = 200;
const HERO_APPLE_IMAGE = "https://i.postimg.cc/nc3MbVTw/Apple.jpg";
const TOP_OFFSET = 18; // Slightly reduced but still clears HUD
const BOTTOM_OFFSET = 10;
const SIDE_MARGIN = 6;
const REVEAL_DURATION = 10;

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
  const [topBarHeight, setTopBarHeight] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Responsive Breakpoints
      if (width < 640) {
        setDeviceType('mobile');
        setTopBarHeight(width < height ? 85 : 75);
      } else if (width < 1024) {
        setDeviceType('tablet');
        setTopBarHeight(95);
      } else {
        setDeviceType('desktop');
        setTopBarHeight(110);
      }
      
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playSound = useCallback((type: 'pop' | 'start' | 'win' | 'lose' | 'chime' | 'countdown' | 'click', currentScore?: number) => {
    if (isMuted) return;
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
  }, [isMuted]);

  const createAppleAt = useCallback((id: string, x: number, y: number, isSpawnSequence = false, color: 'red' | 'green' = 'red', size: number): AppleData => {
    return {
      id, x, y, z: Math.random() * 40, size, rotation: Math.random() * 360,
      delay: isSpawnSequence ? Math.random() * 1.5 : 0, color, variationSeed: Math.random(),
    };
  }, []);

  const triggerBurst = useCallback((apple: AppleData) => {
    const newParticles: ParticleData[] = [];
    const count = deviceType === 'mobile' ? 14 : 24; 
    const types: ('flesh' | 'juice' | 'seed' | 'leaf')[] = ['flesh', 'juice', 'seed', 'leaf'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const force = 120 + Math.random() * 220; 
      const type = types[Math.floor(Math.random() * types.length)];
      let color = '#ef4444';
      let size = (3 + Math.random() * 5) * (deviceType === 'mobile' ? 0.7 : 1);
      if (type === 'flesh') color = apple.color === 'green' ? '#f0fdf4' : '#fffbeb';
      else if (type === 'juice') color = apple.color === 'green' ? '#bef264' : '#ef4444';
      else if (type === 'seed') color = '#451a03';
      else if (type === 'leaf') color = apple.color === 'green' ? '#16a34a' : '#22c55e';

      newParticles.push({
        id: `p-${Date.now()}-${i}`,
        x: apple.x, y: apple.y, z: apple.z,
        vx: Math.cos(angle) * force, vy: Math.sin(angle) * force,
        color, type: type as any, size, rotation: Math.random() * 360, spinSpeed: (Math.random() - 0.5) * 30
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, [deviceType]);

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
  }, [playSound]);

  const startThemeSelection = useCallback(() => {
    playSound('click');
    setStatus(GameStatus.SELECT_THEME);
  }, [playSound]);

  const initGame = useCallback(() => {
    playSound('click');
    setStatus(GameStatus.SPAWNING);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFeedback(null);
    setParticles([]);

    const colors: ('red' | 'green')[] = [
      ...Array(100).fill('red'), ...Array(100).fill('green')
    ].sort(() => Math.random() - 0.5);

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const aspectRatio = screenWidth / screenHeight;

    let cols = Math.floor(Math.sqrt(WIN_TARGET * aspectRatio));
    let rows = Math.ceil(WIN_TARGET / cols);

    const initialBatch: AppleData[] = [];
    const cellWidth = (100 - (SIDE_MARGIN * 2)) / cols;
    const cellHeight = (100 - TOP_OFFSET - BOTTOM_OFFSET) / rows;

    // Optimized sizing for touch vs mouse
    let baseSize = deviceType === 'mobile' ? 42 : (deviceType === 'desktop' ? 55 : 48);

    let appleCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (appleCount >= WIN_TARGET) break;
        const jitterX = (Math.random() - 0.5) * cellWidth * 0.85;
        const jitterY = (Math.random() - 0.5) * cellHeight * 0.85;
        const x = SIDE_MARGIN + (c * cellWidth) + (cellWidth / 2) + jitterX;
        const y = TOP_OFFSET + (r * cellHeight) + (cellHeight / 2) + jitterY;
        initialBatch.push(createAppleAt(`apple-${appleCount}-${Date.now()}`, x, y, true, colors[appleCount], baseSize + Math.random() * 12));
        appleCount++;
      }
      if (appleCount >= WIN_TARGET) break;
    }

    setApples(initialBatch);
    setTimeout(() => runCountdown(), 1600);
  }, [createAppleAt, runCountdown, deviceType, playSound]);

  const quitToHome = useCallback(() => {
    playSound('click');
    setStatus(GameStatus.IDLE);
    setApples([]);
    setParticles([]);
    setScore(0);
  }, [playSound]);

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
  }, [score, playSound]);

  const handleAppleClick = useCallback((id: string) => {
    if (status !== GameStatus.PLAYING) return;
    setApples(prev => {
      const target = prev.find(a => a.id === id);
      if (target) {
        triggerBurst(target);
        playSound('pop');
        setScore(s => {
          const ns = s + 1;
          if (ns % 20 === 0) playSound('chime', ns);
          return ns;
        });
        return prev.filter(a => a.id !== id);
      }
      return prev;
    });
  }, [status, triggerBurst, playSound]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && score >= WIN_TARGET) {
      setStatus(GameStatus.VIEWING);
      setTimeLeft(REVEAL_DURATION);
      playSound('win');
    }
  }, [score, status, playSound]);

  useEffect(() => {
    if (status === GameStatus.PLAYING || status === GameStatus.VIEWING) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (status === GameStatus.VIEWING) {
              setStatus(GameStatus.WON);
              return 0;
            }
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
  }, [status, playSound]);

  useEffect(() => {
    if (status === GameStatus.WON || status === GameStatus.LOST) {
      const generateMessage = async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = status === GameStatus.WON 
            ? "Short congratulatory message for popping 200 scattered apples."
            : "Short encouraging message for missing the harvest.";
          const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setFeedback(res.text || null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "Massive Harvest complete!" : "The harvest was too spread out.");
        }
      };
      generateMessage();
    }
  }, [status]);

  const backgroundOpacity = (status === GameStatus.WON || status === GameStatus.LOST || status === GameStatus.VIEWING) 
    ? 1 
    : (status === GameStatus.PLAYING || status === GameStatus.COUNTDOWN || status === GameStatus.SPAWNING)
      ? 0.15 + (0.85 * (score / WIN_TARGET)) 
      : 0;

  const showHUD = status !== GameStatus.IDLE;
  const showGameStats = status !== GameStatus.IDLE && status !== GameStatus.SELECT_THEME;

  return (
    <div className="flex flex-col w-full h-full bg-black overflow-hidden font-sans select-none touch-none" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      
      {showHUD && (
        <header 
          className={`fixed top-0 left-0 right-0 z-[10000] px-4 md:px-8 flex justify-between items-center bg-stone-950 border-b border-white/10 shadow-2xl transition-all duration-300 ${deviceType === 'mobile' ? 'py-1' : 'py-2'}`}
          style={{ height: `${topBarHeight}px` }}
        >
          <div className="flex flex-col gap-0.5">
            <h1 className="text-white text-sm sm:text-lg md:text-2xl font-black italic tracking-tighter leading-none flex items-center gap-1.5">
              <span className="truncate max-w-[120px] sm:max-w-none">
                {status === GameStatus.VIEWING ? 'REVEAL' : selectedTheme.name.toUpperCase()}
              </span>
              <span className="text-red-500">{status === GameStatus.VIEWING ? 'PHASE' : 'HARVEST'}</span>
            </h1>
            <p className="text-[6px] sm:text-[9px] text-white/50 uppercase font-black tracking-[0.2em] leading-none">
              {status === GameStatus.VIEWING ? 'Enjoy the unlocked view' : `Collected: ${score}/${WIN_TARGET}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4">
             <button 
                onPointerDown={(e) => { e.stopPropagation(); setIsMuted(!isMuted); playSound('click'); }}
                className="bg-white/5 hover:bg-white/10 active:scale-90 transition-all text-white p-2 sm:p-3 rounded-lg sm:rounded-xl border border-white/20 flex items-center justify-center min-w-[34px] sm:min-w-[48px]"
              >
                {isMuted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-6 sm:h-6 fill-white/60" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-6 sm:h-6 fill-white" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                )}
              </button>

             {showGameStats && (
               <div className="flex flex-col gap-1 items-end">
                 {status !== GameStatus.VIEWING && status !== GameStatus.WON && status !== GameStatus.LOST ? (
                   <>
                     <button onPointerDown={endGame} className="bg-red-600 hover:bg-red-500 active:scale-95 transition-all text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-black text-[7px] sm:text-xs uppercase shadow-lg border border-red-400/30 w-16 sm:w-28">QUIT</button>
                     <button onPointerDown={initGame} className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-black text-[7px] sm:text-xs uppercase border border-white/10 w-16 sm:w-28">RESTART</button>
                   </>
                 ) : null}
               </div>
             )}
             
             {showGameStats && (
               <div className="flex items-center gap-2 sm:gap-6 bg-black px-2 sm:px-6 py-1.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-white/20 shadow-inner z-[10001]">
                  <div className="flex flex-col items-center">
                    <span className="text-white/30 text-[5px] sm:text-[8px] uppercase font-black">Time</span>
                    <span className={`text-[11px] sm:text-lg md:text-2xl font-mono font-black tabular-nums transition-colors ${timeLeft < 10 && status !== GameStatus.VIEWING ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  {status !== GameStatus.VIEWING && status !== GameStatus.WON && status !== GameStatus.LOST && (
                    <>
                      <div className="w-[1px] h-4 sm:h-8 bg-white/10"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-white/30 text-[5px] sm:text-[8px] uppercase font-black">Popped</span>
                        <span className="text-[11px] sm:text-lg md:text-2xl font-mono font-black text-green-400 tabular-nums">{score}</span>
                      </div>
                    </>
                  )}
                </div>
             )}
          </div>
        </header>
      )}

      <main className="relative flex-grow w-full bg-stone-950 overflow-hidden" style={{ paddingTop: showHUD ? `${topBarHeight}px` : 0 }}>
        
        <div className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out" style={{ opacity: backgroundOpacity }}>
          <img src={selectedTheme.image} className="w-full h-full object-cover brightness-[0.75] scale-105" alt="Background" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30"></div>
        </div>

        <div className="relative w-full h-full overflow-hidden" style={{ perspective: '1200px' }}>
          <div className="absolute inset-0 z-20 pointer-events-auto" style={{ transformStyle: 'preserve-3d' }}>
            {apples.map(a => <Apple key={a.id} data={a} onClick={handleAppleClick} />)}
            {particles.map(p => <Particle key={p.id} data={p} />)}
          </div>
        </div>

        {status === GameStatus.COUNTDOWN && (
          <div className="absolute inset-0 z-[2500] flex flex-col items-center justify-center pointer-events-none bg-black/50 backdrop-blur-md">
            <div key={countdown} className={`text-[8rem] sm:text-[14rem] md:text-[24rem] font-black italic text-center ${countdown === 'GO!' ? 'text-red-500' : 'text-white'} animate-[countdown-pop_0.6s_forwards] drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]`}>
              {countdown}
            </div>
          </div>
        )}

        {status === GameStatus.IDLE && (
          <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 sm:p-10 overflow-y-auto">
            <div className="bg-stone-900/95 p-8 sm:p-16 rounded-[3rem] sm:rounded-[5rem] border border-white/10 max-w-lg w-full text-center shadow-2xl relative my-auto">
              <div className="relative w-full h-32 sm:h-48 flex items-center justify-center mb-8 sm:mb-12">
                <img src={HERO_APPLE_IMAGE} className="w-32 sm:w-48 h-32 sm:h-48 object-contain rounded-full border-4 border-white/5 shadow-[0_0_60px_rgba(255,0,0,0.2)] animate-[bounce_5s_infinite_ease-in-out]" alt="Apple Hero" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 italic tracking-tighter uppercase leading-none">APPLE HARVEST</h2>
              <p className="text-white/60 mb-10 sm:mb-14 text-sm sm:text-lg font-medium leading-relaxed px-4">The seasonal harvest is here. Collect all 200 apples to unlock breathtaking views.</p>
              <button onPointerDown={startThemeSelection} className="w-full py-5 sm:py-7 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl sm:rounded-[2.5rem] transition-all active:scale-95 text-xl sm:text-3xl uppercase tracking-widest shadow-2xl border-t border-white/20">START HARVEST</button>
            </div>
          </div>
        )}

        {status === GameStatus.SELECT_THEME && (
          <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 sm:p-10 overflow-y-auto scrollbar-hide">
            <div className="bg-stone-900/95 p-6 sm:p-14 rounded-[2rem] sm:rounded-[4rem] border border-white/10 max-w-4xl w-full flex flex-col items-center shadow-2xl my-auto backdrop-blur-xl">
              <h2 className="text-2xl sm:text-5xl font-black text-white mb-3 italic tracking-tighter uppercase">SELECT THEME</h2>
              <p className="text-white/40 text-[9px] sm:text-sm font-bold uppercase tracking-[0.3em] mb-8 sm:mb-12">Choose your location</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5 w-full mb-10 sm:mb-16 max-h-[50vh] overflow-y-auto p-2 scrollbar-hide">
                {THEMES.map((theme) => (
                  <button key={theme.id} onPointerDown={() => { playSound('click'); setSelectedTheme(theme); }} className={`group relative py-4 sm:py-6 px-3 rounded-2xl sm:rounded-3xl text-center transition-all duration-500 border-2 flex flex-col items-center justify-center gap-2 overflow-hidden ${selectedTheme.id === theme.id ? 'bg-red-600 border-red-400 scale-[1.05] shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-white/5 border-white/5 hover:bg-white/10 opacity-70 hover:opacity-100'}`}>
                    <img src={theme.image} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" alt="" />
                    <span className={`relative z-10 text-[10px] sm:text-sm font-black uppercase tracking-widest leading-tight ${selectedTheme.id === theme.id ? 'text-white' : 'text-white/70'}`}>{theme.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-4 w-full sm:max-w-md">
                <button onPointerDown={initGame} className="w-full py-5 sm:py-7 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl sm:rounded-[2.5rem] transition-all active:scale-95 text-xl sm:text-2xl uppercase tracking-widest shadow-2xl">START NOW</button>
                <button onPointerDown={() => setStatus(GameStatus.IDLE)} className="w-full py-2 text-white/30 hover:text-white uppercase font-black text-[10px] sm:text-sm tracking-widest transition-colors">CANCEL</button>
              </div>
            </div>
          </div>
        )}

        {(status === GameStatus.WON || status === GameStatus.LOST) && (
          <div className="absolute inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 sm:p-12 overflow-y-auto">
            <div className="bg-stone-900/95 p-10 sm:p-20 rounded-[3rem] sm:rounded-[6rem] border border-white/10 max-w-lg w-full text-center shadow-2xl relative my-auto">
              <div className="text-6xl sm:text-8xl mb-8 sm:mb-12 drop-shadow-2xl scale-125">{status === GameStatus.WON ? '🧺' : '❄️'}</div>
              <h2 className={`text-4xl sm:text-6xl font-black mb-4 italic uppercase tracking-tighter ${status === GameStatus.WON ? 'text-green-400' : 'text-red-500'}`}>{status === GameStatus.WON ? 'COMPLETE' : 'TIMEOUT'}</h2>
              <p className="text-white font-bold text-xl sm:text-2xl mb-8">Popped {score} of {WIN_TARGET}</p>
              {feedback && <div className="text-white/50 italic text-xs sm:text-base mb-10 sm:mb-16 px-6 leading-relaxed bg-black/20 py-4 rounded-2xl">"{feedback}"</div>}
              <div className="space-y-4 sm:space-y-6 w-full">
                <button onPointerDown={quitToHome} className="w-full py-5 sm:py-7 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl sm:rounded-[3rem] transition-all active:scale-95 text-lg sm:text-2xl uppercase tracking-widest shadow-2xl">REPLAY</button>
                <button onPointerDown={startThemeSelection} className="w-full py-4 sm:py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl sm:rounded-[3rem] transition-all active:scale-95 text-[10px] sm:text-sm uppercase tracking-widest border border-white/10">CHANGE THEME</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;

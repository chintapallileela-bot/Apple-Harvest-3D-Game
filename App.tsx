import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, AppleData, ParticleData } from './types';
import { GAME_DURATION } from './constants';
import Apple from './components/Apple';
import Particle from './components/Particle';
import { GoogleGenAI } from '@google/genai';

const INITIAL_SCREEN_APPLES = 300; 
const WIN_TARGET = 500; 
const BG_URL = "https://i.postimg.cc/tCCMJVcV/Avatar2.jpg";
const HERO_APPLE_IMAGE = "https://i.postimg.cc/nc3MbVTw/Apple.jpg";

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [apples, setApples] = useState<AppleData[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [countdown, setCountdown] = useState<number | string>(3);
  
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // Preload background image and hero apple
  useEffect(() => {
    const img = new Image();
    img.src = BG_URL;
    img.onload = () => {
      bgImageRef.current = img;
    };
    
    const heroImg = new Image();
    heroImg.src = HERO_APPLE_IMAGE;
  }, []);

  // Sound Engine
  const playSound = (type: 'pop' | 'start' | 'win' | 'lose' | 'chime' | 'countdown' | 'click', currentScore?: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  const clearMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (bgImageRef.current) {
      ctx.save();
      ctx.filter = 'blur(40px) saturate(0.2) brightness(0.4)';
      
      const img = bgImageRef.current;
      const canvasAspect = canvas.width / canvas.height;
      const imgAspect = img.width / img.height;
      let drawW, drawH, drawX, drawY;

      if (canvasAspect > imgAspect) {
        drawW = canvas.width;
        drawH = canvas.width / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawH) / 2;
      } else {
        drawH = canvas.height;
        drawW = canvas.height * imgAspect;
        drawY = 0;
        drawX = (canvas.width - drawW) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width >= 768 && width <= 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
      
      if (status === GameStatus.IDLE) {
        clearMask();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [status, clearMask]);

  const createApple = useCallback((id: string, isSpawnSequence = false): AppleData => {
    return {
      id,
      x: Math.random() * 90 + 5,
      y: Math.random() * 90 + 5,
      z: Math.random() * 100 - 50,
      size: deviceType === 'mobile' ? (45 + Math.random() * 20) : (65 + Math.random() * 20),
      rotation: Math.random() * 360,
      delay: isSpawnSequence ? 0 : Math.random() * 0.1,
      color: Math.random() > 0.05 ? 'red' : 'green', 
      variationSeed: Math.random(),
    };
  }, [deviceType]);

  const updateMask = (xPercent: number, yPercent: number, size: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = (xPercent / 100) * canvas.width;
    const y = (yPercent / 100) * canvas.height;
    const radius = size * 1.5;

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const triggerBurst = useCallback((apple: AppleData) => {
    const newParticles: ParticleData[] = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 70 + Math.random() * 100;
      newParticles.push({
        id: `p-${Date.now()}-${i}`,
        x: apple.x, y: apple.y, z: apple.z,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color: apple.color === 'red' ? '#ef4444' : '#bef264',
        type: Math.random() > 0.5 ? 'leaf' : 'dust',
        size: 8 + Math.random() * 10,
        rotation: Math.random() * 360,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
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

  const initGame = useCallback(() => {
    playSound('click');
    
    clearMask();
    setStatus(GameStatus.SPAWNING);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFeedback(null);
    setParticles([]);

    const initialBatch: AppleData[] = [];
    for (let i = 0; i < INITIAL_SCREEN_APPLES; i++) {
      initialBatch.push(createApple(`apple-${i}-${Date.now()}`, true));
    }
    setApples(initialBatch);

    setTimeout(() => {
      runCountdown();
    }, 800);
  }, [createApple, clearMask, runCountdown]);

  const quitToHome = useCallback(() => {
    playSound('click');
    setStatus(GameStatus.IDLE);
    setApples([]);
    setParticles([]);
    clearMask();
  }, [clearMask]);

  const handleAppleClick = useCallback((id: string) => {
    if (status !== GameStatus.PLAYING) return;
    
    setApples(prev => {
      const target = prev.find(a => a.id === id);
      if (target) {
        triggerBurst(target);
        updateMask(target.x, target.y, target.size);
        playSound('pop');
        setScore(s => {
          const next = s + 1;
          playSound('chime', next);
          if (next >= WIN_TARGET) setStatus(GameStatus.WON);
          return next;
        });
        
        const newOnes = [];
        if (Math.random() > 0.2) newOnes.push(createApple(`apple-new-${Date.now()}`));
        return [...prev.filter(a => a.id !== id), ...newOnes];
      }
      return prev;
    });
  }, [status, createApple, triggerBurst]);

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
            ? "Celebratory rustic one-liner for a winner who revealed a secret orchard."
            : "Brief encouraging rustic one-liner for someone who didn't finish harvesting in time.";
          const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setFeedback(res.text || null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "The vision is yours!" : "Winter claimed the orchard.");
        }
      };
      generateMessage();
    }
  }, [status]);

  const revealPercent = Math.min(Math.round((score / WIN_TARGET) * 100), 100);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* HUD */}
      <div className="fixed top-0 left-0 w-full z-[2000] p-6 flex justify-between items-start pointer-events-none safe-top">
        <div className="bg-black/60 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/10 shadow-2xl pointer-events-none">
          <h1 className="text-white text-2xl font-black italic tracking-tighter leading-none">
            APPLE <span className="text-red-500 underline decoration-red-500/30 underline-offset-4">HARVEST</span>
          </h1>
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Pop to clear the frost</p>
        </div>

        <div className={`flex items-center gap-6 bg-black/90 px-8 py-4 rounded-3xl border border-white/20 shadow-2xl transition-all duration-500 ${status === GameStatus.IDLE ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[9px] uppercase font-black">Time</span>
            <span className={`text-2xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-[1px] h-10 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/30 text-[9px] uppercase font-black">Revealed</span>
            <span className="text-2xl font-mono font-black text-green-400">{revealPercent}%</span>
          </div>
        </div>
      </div>

      {/* Floating Stop Button (Fixed for Quick Access) */}
      {(status === GameStatus.PLAYING || status === GameStatus.COUNTDOWN || status === GameStatus.SPAWNING) && (
        <button 
          onPointerDown={quitToHome}
          className="fixed bottom-10 right-10 z-[2500] w-20 h-20 bg-red-600 hover:bg-red-500 text-white rounded-full flex flex-col items-center justify-center shadow-[0_10px_40px_rgba(220,38,38,0.5)] active:scale-90 transition-all pointer-events-auto border-4 border-white/10"
          title="Stop Game"
        >
          <div className="w-5 h-5 bg-white rounded-sm mb-1"></div>
          <span className="text-[10px] font-black uppercase tracking-tighter">STOP</span>
        </button>
      )}

      {/* Main Render Plane */}
      <div className="relative w-full h-full overflow-hidden" style={{ perspective: '1200px' }}>
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src={BG_URL} 
            className="w-full h-full object-cover" 
            alt="Secret"
          />
        </div>

        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000"
          style={{ opacity: 1 }}
        >
          <canvas 
            ref={maskCanvasRef} 
            className="w-full h-full"
          />
        </div>

        <div className="absolute inset-0 z-20 pointer-events-auto" style={{ transformStyle: 'preserve-3d' }}>
          {apples.map(a => <Apple key={a.id} data={a} onClick={handleAppleClick} />)}
          {particles.map(p => <Particle key={p.id} data={p} />)}
        </div>
      </div>

      {/* Countdown Overlay - Perfectly Center Aligned */}
      {status === GameStatus.COUNTDOWN && (
        <div className="fixed inset-0 z-[2500] flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm overflow-hidden">
          <div 
            key={countdown}
            className={`text-[20rem] md:text-[30rem] font-black italic leading-none flex items-center justify-center text-center
              ${countdown === 'GO!' ? 'text-red-500 drop-shadow-[0_0_100px_rgba(220,38,38,0.9)]' : 'text-white drop-shadow-[0_20px_60px_rgba(255,255,255,0.4)]'}
              animate-[countdown-pop_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)_forwards]
            `}
            style={{ width: '100%', height: '100%' }}
          >
            {countdown}
          </div>
        </div>
      )}

      {/* Overlays */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
          <div className="bg-neutral-900/80 p-12 md:p-16 rounded-[4rem] border border-white/10 max-w-lg w-full text-center shadow-[0_0_200px_rgba(255,0,0,0.1)] overflow-hidden relative backdrop-saturate-150">
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
            
            {status === GameStatus.IDLE ? (
              <>
                <div className="relative w-full h-56 flex items-center justify-center mb-10">
                   <div className="relative w-64 h-64 animate-[bounce_3s_infinite_ease-in-out]">
                      <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full animate-pulse"></div>
                      <img 
                        src={HERO_APPLE_IMAGE} 
                        className="w-full h-full object-contain rounded-full border-4 border-white/10 shadow-2xl drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]" 
                        alt="Hero Apple"
                      />
                   </div>
                   <div className="absolute -top-4 -right-8 text-5xl animate-pulse">✨</div>
                   <div className="absolute -bottom-8 -left-8 text-3xl animate-pulse opacity-50">✨</div>
                </div>
                <h2 className="text-5xl font-black text-white mb-6 italic tracking-tighter leading-none uppercase">APPLE HARVEST</h2>
                <p className="text-white/60 mb-12 text-xl font-medium leading-relaxed">
                  The orchard is frozen. Pop <span className="text-red-500 font-black">{WIN_TARGET}</span> red apples to reveal what lies beneath.
                </p>
                <button
                  onPointerDown={initGame}
                  className="group relative w-full py-8 bg-red-600 hover:bg-red-500 text-white font-black rounded-[2.5rem] transition-all active:scale-90 text-3xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(220,38,38,0.5)] animate-pulse"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10">START</span>
                </button>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-8xl mb-8">🧺</div>
                <h2 className="text-5xl font-black text-green-400 mb-4 italic tracking-tighter uppercase">HARVESTED</h2>
                <p className="text-white/80 font-bold text-2xl mb-6">Masterful reveal!</p>
                {feedback && <div className="text-white/40 italic text-lg mb-12 bg-white/5 p-8 rounded-3xl border border-white/5">"{feedback}"</div>}
                <div className="flex flex-col gap-4">
                  <button
                    onPointerDown={initGame}
                    className="group relative w-full py-7 bg-red-600 hover:bg-red-500 text-white font-black rounded-[2.5rem] transition-all active:scale-95 text-xl uppercase tracking-[0.1em] shadow-[0_15px_30px_rgba(220,38,38,0.4)]"
                  >
                    PLAY AGAIN
                  </button>
                  <button
                    onPointerDown={quitToHome}
                    className="text-white/40 hover:text-white uppercase font-black tracking-widest text-xs py-2 transition-colors"
                  >
                    RETURN TO MENU
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-8xl mb-8 opacity-40">🍂</div>
                <h2 className="text-5xl font-black text-red-500 mb-4 italic tracking-tighter uppercase">FROZEN</h2>
                <p className="text-white/80 font-bold text-2xl mb-6">Cleared only {revealPercent}%</p>
                {feedback && <div className="text-white/40 italic text-lg mb-12 bg-white/5 p-8 rounded-3xl border border-white/5">"{feedback}"</div>}
                <div className="flex flex-col gap-4">
                  <button
                    onPointerDown={initGame}
                    className="group relative w-full py-7 bg-red-600 hover:bg-red-500 text-white font-black rounded-[2.5rem] transition-all active:scale-95 text-xl uppercase tracking-[0.1em] shadow-[0_15px_30px_rgba(220,38,38,0.4)]"
                  >
                    RETRY HARVEST
                  </button>
                  <button
                    onPointerDown={quitToHome}
                    className="text-white/40 hover:text-white uppercase font-black tracking-widest text-xs py-2 transition-colors"
                  >
                    RETURN TO MENU
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
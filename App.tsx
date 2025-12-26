import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameStatus, AppleData, ParticleData } from './types';
import { GAME_DURATION } from './constants';
import Apple from './components/Apple';
import Particle from './components/Particle';
import { GoogleGenAI } from '@google/genai';

const INITIAL_SCREEN_APPLES = 300; 
const WIN_TARGET = 500; 

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [apples, setApples] = useState<AppleData[]>([]);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  const timerRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sound Engine
  const playSound = (type: 'pop' | 'start' | 'win' | 'lose' | 'chime', currentScore?: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      switch (type) {
        case 'pop': {
          // Sharp apple crunch
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1100 + Math.random() * 400, now);
          osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);

          const wood = ctx.createOscillator();
          const woodGain = ctx.createGain();
          wood.type = 'sine';
          wood.frequency.setValueAtTime(180, now);
          woodGain.gain.setValueAtTime(0.08, now);
          woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          wood.connect(woodGain);
          woodGain.connect(ctx.destination);
          wood.start(now);
          wood.stop(now + 0.05);
          break;
        }
        case 'chime': {
          const progress = Math.min((currentScore || 0) / WIN_TARGET, 1);
          const baseFreq = 880 + (progress * 880);
          [1, 2.01, 3.14].forEach((mult, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(baseFreq * mult, now);
            o.connect(g);
            g.connect(ctx.destination);
            const maxVol = (0.02 + (progress * 0.04)) / (i + 1);
            g.gain.setValueAtTime(maxVol, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            o.start(now);
            o.stop(now + 0.4);
          });
          break;
        }
        case 'start': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.5);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }
        case 'win': {
          [523, 659, 783, 1046].forEach((f, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.setValueAtTime(f, now + i * 0.12);
            g.gain.setValueAtTime(0.1, now + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
            o.start(now + i * 0.12);
            o.stop(now + i * 0.12 + 0.6);
          });
          break;
        }
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

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width >= 768 && width <= 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
      
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = window.innerWidth;
        maskCanvasRef.current.height = window.innerHeight;
        // Re-draw initial state if resized during play? 
        // For simplicity, we just clear and fill
        if (status === GameStatus.IDLE) clearMask();
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [status]);

  const createApple = useCallback((id: string, isSpawnSequence = false): AppleData => {
    return {
      id,
      x: Math.random() * 94 + 3,
      y: Math.random() * 94 + 3,
      z: Math.random() * 150 - 75,
      size: deviceType === 'mobile' ? (45 + Math.random() * 25) : (80 + Math.random() * 35),
      rotation: Math.random() * 360,
      delay: isSpawnSequence ? 0 : Math.random() * 0.15,
      color: Math.random() > 0.1 ? 'red' : 'green',
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
    const radius = size * 1.8; 

    ctx.save();
    // destination-out removes the opaque frost where we "cut" holes
    ctx.globalCompositeOperation = 'destination-out';
    const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const triggerBurst = useCallback((apple: AppleData) => {
    const newParticles: ParticleData[] = [];
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;
      newParticles.push({
        id: `p-${Date.now()}-${i}`,
        x: apple.x, y: apple.y, z: apple.z,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color: apple.color === 'red' ? '#ef4444' : '#a3e635',
        type: Math.random() > 0.4 ? 'leaf' : 'dust',
        size: 6 + Math.random() * 12,
        rotation: Math.random() * 360,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 800);
  }, []);

  const initGame = useCallback(() => {
    playSound('start');
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

    setTimeout(() => setStatus(GameStatus.PLAYING), 1200);
  }, [createApple]);

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
        
        // Immediate replacement spawn
        const newOnes = [];
        if (Math.random() > 0.3) newOnes.push(createApple(`apple-new-${Date.now()}`));
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
            ? "Write a short celebratory rustic line for a user who revealed the orchard. Use apple metaphors."
            : `Encourage a user who harvested ${score} apples but failed the challenge. Short and charming.`;
          const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setFeedback(res.text || null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "The vision is clear!" : "Nature keeps its secrets.");
        }
      };
      generateMessage();
    }
  }, [status, score]);

  const revealPercent = Math.min(Math.round((score / WIN_TARGET) * 100), 100);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* HUD Layer */}
      <div className="fixed top-0 left-0 w-full z-[2000] p-6 flex justify-between items-start pointer-events-none safe-top">
        <div className="bg-black/60 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/20 shadow-2xl">
          <h1 className="text-white text-2xl font-black italic tracking-tighter leading-none">
            APPLE <span className="text-red-500">HARVEST</span>
          </h1>
          <p className="text-[10px] text-white/50 uppercase font-black tracking-[0.2em] mt-1">Tap to clear the view</p>
        </div>

        <div className={`flex items-center gap-6 bg-black/90 px-8 py-4 rounded-[2rem] border border-white/25 shadow-2xl transition-all duration-700 ${status === GameStatus.IDLE ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}`}>
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[9px] uppercase font-black">Time</span>
            <span className={`text-2xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-[1px] h-10 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[9px] uppercase font-black">Revealed</span>
            <span className="text-2xl font-mono font-black text-green-400">{revealPercent}%</span>
          </div>
        </div>
      </div>

      {/* World Engine */}
      <div className="relative w-full h-full" style={{ perspective: '1200px' }}>
        
        {/* Underlay: The Original Secret Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
            className="w-full h-full object-cover scale-[1.02]" 
            alt="The Secret"
          />
        </div>

        {/* The Obscuring Layer (Blurred + Masked) */}
        <div 
          className="absolute inset-0 z-10 transition-opacity duration-1000"
          style={{ 
            opacity: status === GameStatus.WON ? 0 : 1,
            pointerEvents: 'none'
          }}
        >
          {/* Blurred Obscuration */}
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-[60px] saturate-0"></div>
          <img 
            src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
            className="w-full h-full object-cover blur-[80px] brightness-[0.4] contrast-150 saturate-0" 
            alt="Obscured"
          />
          
          {/* The Dynamic Scratch-off Mask */}
          <canvas 
            ref={maskCanvasRef} 
            className="absolute inset-0 mix-blend-destination-in w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
        </div>

        {/* Game Entity Layer */}
        <div className="absolute inset-0 z-20 pointer-events-auto" style={{ transformStyle: 'preserve-3d' }}>
          {apples.map(a => <Apple key={a.id} data={a} onClick={handleAppleClick} />)}
          {particles.map(p => <Particle key={p.id} data={p} />)}
        </div>
      </div>

      {/* Pop-up Modals */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
          <div className="bg-neutral-900/50 p-10 md:p-16 rounded-[3.5rem] border border-white/10 max-w-md w-full text-center shadow-[0_0_120px_rgba(255,0,0,0.15)] backdrop-saturate-150">
            {status === GameStatus.IDLE ? (
              <>
                <div className="relative inline-block mb-10">
                   <div className="text-9xl animate-bounce drop-shadow-[0_20px_40px_rgba(220,38,38,0.5)]">🍎</div>
                   <div className="absolute -top-2 -right-4 text-3xl animate-pulse">✨</div>
                </div>
                <h2 className="text-5xl font-black text-white mb-6 italic tracking-tighter leading-none">THE<br/>ORCHARD</h2>
                <p className="text-white/60 mb-10 text-xl font-medium leading-relaxed px-4">
                  Pop the apples to clear the frost. Reveal the hidden view before the sun sets.
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-8xl mb-8">🧺</div>
                <h2 className="text-5xl font-black text-green-400 mb-4 italic tracking-tighter uppercase">HARVESTED!</h2>
                <p className="text-white/90 font-black text-2xl mb-6">The path is clear.</p>
                {feedback && <div className="text-white/50 italic text-base mb-10 bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-inner">"{feedback}"</div>}
              </>
            ) : (
              <>
                <div className="text-8xl mb-8 opacity-40">🍂</div>
                <h2 className="text-5xl font-black text-red-500 mb-4 italic tracking-tighter uppercase">FROSTBITTEN</h2>
                <p className="text-white/90 font-black text-2xl mb-6">Cleared only {revealPercent}%</p>
                {feedback && <div className="text-white/50 italic text-base mb-10 bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-inner">"{feedback}"</div>}
              </>
            )}

            <button
              onPointerDown={initGame}
              className="group relative w-full py-7 bg-red-600 hover:bg-red-500 text-white font-black rounded-[2.5rem] transition-all active:scale-90 text-2xl uppercase tracking-[0.2em] shadow-[0_25px_50px_rgba(220,38,38,0.4)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">{status === GameStatus.IDLE ? 'START' : 'RETRY'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
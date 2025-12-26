import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameStatus, AppleData, ParticleData } from './types';
import { GAME_DURATION } from './constants';
import Apple from './components/Apple';
import Particle from './components/Particle';
import { GoogleGenAI } from '@google/genai';

const INITIAL_SCREEN_APPLES = 350; 
const WIN_TARGET = 600; 

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

  // Procedural Sound Generator
  const playSound = (type: 'pop' | 'start' | 'win' | 'lose' | 'spawn' | 'chime', currentScore?: number) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      switch (type) {
        case 'pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1000 + Math.random() * 500, now);
          osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);

          // Wood-block/crunch component
          const noiseOsc = ctx.createOscillator();
          const noiseGain = ctx.createGain();
          noiseOsc.type = 'square';
          noiseOsc.frequency.setValueAtTime(150, now);
          noiseGain.gain.setValueAtTime(0.05, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          noiseOsc.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          noiseOsc.start(now);
          noiseOsc.stop(now + 0.03);
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
            const maxVol = (0.02 + (progress * 0.05)) / (i + 1);
            g.gain.setValueAtTime(maxVol, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            o.start(now);
            o.stop(now + 0.5);
          });
          break;
        }
        case 'spawn': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1800 + Math.random() * 500, now);
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
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
        case 'win':
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.setValueAtTime(freq, now + i * 0.1);
            g.gain.setValueAtTime(0.1, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
            o.start(now + i * 0.1);
            o.stop(now + i * 0.1 + 0.6);
          });
          break;
        case 'lose': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(50, now + 0.6);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.6);
          break;
        }
      }
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
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
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createApple = useCallback((id: string, isSpawnSequence = false): AppleData => {
    return {
      id,
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 200 - 100,
      size: deviceType === 'mobile' ? (40 + Math.random() * 20) : (70 + Math.random() * 30),
      rotation: Math.random() * 360,
      delay: isSpawnSequence ? 0 : Math.random() * 0.2,
      color: Math.random() > 0.15 ? 'red' : 'green',
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
    const radius = size * 1.5; // Reveal slightly larger than apple

    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.8)');
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
    ctx.fillStyle = 'black'; // The "frost" layer is technically black but masked
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const triggerBurst = useCallback((apple: AppleData) => {
    const newParticles: ParticleData[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      newParticles.push({
        id: `p-${Date.now()}-${i}`,
        x: apple.x, y: apple.y, z: apple.z,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        color: apple.color === 'red' ? '#ef4444' : '#84cc16',
        type: Math.random() > 0.5 ? 'leaf' : 'dust',
        size: 5 + Math.random() * 10,
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

    setTimeout(() => setStatus(GameStatus.PLAYING), 1500);
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
        
        // Spawn replacements
        const newOnes = [];
        if (Math.random() > 0.4) newOnes.push(createApple(`apple-new-${Date.now()}`));
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
            ? "Celebrate the user for revealing the hidden orchard photo. Keep it warm and seasonal."
            : `User failed to clear the orchard. They got ${score} apples. Encourage them to try again.`;
          const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
          setFeedback(res.text || null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "The path is clear!" : "The harvest was cut short.");
        }
      };
      generateMessage();
    }
  }, [status, score]);

  const revealPercent = Math.min(Math.round((score / WIN_TARGET) * 100), 100);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* UI Layer */}
      <div className="fixed top-0 left-0 w-full z-[2000] p-6 flex justify-between items-start pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 shadow-2xl">
          <h1 className="text-white text-xl font-black italic tracking-tighter">APPLE <span className="text-red-500 underline decoration-red-500/50">HARVEST</span></h1>
          <p className="text-[9px] text-white/40 uppercase font-bold tracking-[0.2em] mt-1">Reveal the hidden world</p>
        </div>

        <div className={`flex items-center gap-6 bg-black/80 px-8 py-4 rounded-3xl border border-white/20 shadow-2xl transition-opacity duration-500 ${status === GameStatus.IDLE ? 'opacity-0' : 'opacity-100'}`}>
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[9px] uppercase font-black">Time Left</span>
            <span className={`text-2xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/40 text-[9px] uppercase font-black">Revealed</span>
            <span className="text-2xl font-mono font-black text-green-400">{revealPercent}%</span>
          </div>
        </div>
      </div>

      {/* World Layer */}
      <div className="relative w-full h-full" style={{ perspective: '1000px' }}>
        
        {/* The Sharp Background (Revealed Layer) */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
            className="w-full h-full object-cover scale-105" 
            alt="Secret"
          />
        </div>

        {/* The Frost Overlay (Obscuring Layer) */}
        <div 
          className="absolute inset-0 z-10 transition-opacity duration-1000"
          style={{ 
            opacity: status === GameStatus.WON ? 0 : 1,
            pointerEvents: 'none'
          }}
        >
          {/* Blurred Version */}
          <img 
            src="https://i.postimg.cc/tCCMJVcV/Avatar2.jpg" 
            className="w-full h-full object-cover blur-3xl saturate-0 opacity-80 brightness-50" 
            alt="Blurred"
          />
          {/* Real-time Dynamic Mask */}
          <canvas 
            ref={maskCanvasRef} 
            className="absolute inset-0 mix-blend-destination-in w-full h-full"
            style={{ pointerEvents: 'none' }}
          />
        </div>

        {/* The Apple Layer */}
        <div className="absolute inset-0 z-20 pointer-events-auto" style={{ transformStyle: 'preserve-3d' }}>
          {apples.map(a => <Apple key={a.id} data={a} onClick={handleAppleClick} />)}
          {particles.map(p => <Particle key={p.id} data={p} />)}
        </div>
      </div>

      {/* Overlays */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-6">
          <div className="bg-neutral-900 p-10 md:p-14 rounded-[3rem] border border-white/10 max-w-md w-full text-center shadow-[0_0_100px_rgba(255,0,0,0.1)]">
            {status === GameStatus.IDLE ? (
              <>
                <div className="text-7xl mb-6">🍎</div>
                <h2 className="text-4xl font-black text-white mb-4 italic tracking-tighter">THE HARVEST</h2>
                <p className="text-white/50 mb-10 text-lg">
                  Behind these apples lies a secret image. Pop <span className="text-red-500 font-bold">{WIN_TARGET}</span> of them to clear the path.
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-7xl mb-6">🌟</div>
                <h2 className="text-4xl font-black text-green-400 mb-2 italic">VICTORY</h2>
                <p className="text-white/80 font-bold mb-6">The Secret is Revealed!</p>
                {feedback && <p className="text-white/40 italic text-sm mb-10 bg-white/5 p-6 rounded-2xl">{feedback}</p>}
              </>
            ) : (
              <>
                <div className="text-7xl mb-6">🍂</div>
                <h2 className="text-4xl font-black text-red-500 mb-2 italic">WINTER COMES</h2>
                <p className="text-white/80 font-bold mb-6">You only cleared {revealPercent}%</p>
                {feedback && <p className="text-white/40 italic text-sm mb-10 bg-white/5 p-6 rounded-2xl">{feedback}</p>}
              </>
            )}

            <button
              onClick={initGame}
              className="w-full py-6 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all active:scale-95 text-xl uppercase tracking-widest shadow-2xl shadow-red-900/40"
            >
              {status === GameStatus.IDLE ? 'BEGIN HARVEST' : 'PLAY AGAIN'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
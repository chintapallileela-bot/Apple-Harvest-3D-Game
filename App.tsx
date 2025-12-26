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

  // Procedural Sound Generator
  const playSound = (type: 'pop' | 'start' | 'win' | 'lose' | 'spawn') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'pop':
          osc.type = 'sine';
          osc.frequency.setValueAtTime(450 + Math.random() * 100, now);
          osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        case 'spawn':
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(200 + Math.random() * 200, now);
          gain.gain.setValueAtTime(0.03, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          osc.start(now);
          osc.stop(now + 0.08);
          break;
        case 'start':
          osc.type = 'square';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        case 'win':
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.setValueAtTime(freq, now + i * 0.1);
            g.gain.setValueAtTime(0.2, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
            o.start(now + i * 0.1);
            o.stop(now + i * 0.1 + 0.4);
          });
          break;
        case 'lose':
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(40, now + 0.8);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.linearRampToValueAtTime(0.01, now + 0.8);
          osc.start(now);
          osc.stop(now + 0.8);
          break;
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
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const createApple = useCallback((id: string, isSpawnSequence = false): AppleData => {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width <= 1024;

    return {
      id,
      x: Math.random() * 110 - 5,
      y: Math.random() * 110 - 5,
      z: Math.random() * 400 - 150,
      size: isMobile ? (45 + Math.random() * 20) : (isTablet ? 55 + Math.random() * 25 : 75 + Math.random() * 30),
      rotation: Math.random() * 360,
      delay: isSpawnSequence ? 0 : Math.random() * 0.3,
      color: Math.random() > 0.25 ? 'red' : 'green',
      variationSeed: Math.random(),
    };
  }, []);

  const triggerBurst = useCallback((apple: AppleData) => {
    const newParticles: ParticleData[] = [];
    const count = 6 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const types: ('seed' | 'leaf' | 'dust')[] = ['seed', 'leaf', 'dust'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      newParticles.push({
        id: `p-${Date.now()}-${i}`,
        x: apple.x,
        y: apple.y,
        z: apple.z,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: type === 'leaf' ? '#22c55e' : (apple.color === 'red' ? '#ef4444' : '#84cc16'),
        type,
        size: type === 'dust' ? 4 : (type === 'seed' ? 6 : 12),
        rotation: Math.random() * 360,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Clean up particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  }, []);

  const initGame = useCallback(() => {
    playSound('start');
    setStatus(GameStatus.SPAWNING);
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFeedback(null);
    setParticles([]);

    const initialBatch: AppleData[] = [];
    const spawnDuration = 1.8; 
    
    for (let i = 0; i < INITIAL_SCREEN_APPLES; i++) {
      const apple = createApple(`apple-${i}-${Date.now()}`, true);
      apple.delay = (i / INITIAL_SCREEN_APPLES) * spawnDuration;
      initialBatch.push(apple);
    }
    
    setApples(initialBatch);

    setTimeout(() => {
      setStatus(GameStatus.PLAYING);
    }, (spawnDuration + 0.5) * 1000);
  }, [createApple]);

  const handleAppleClick = useCallback((id: string) => {
    if (status !== GameStatus.PLAYING) return;
    
    const targetApple = apples.find(a => a.id === id);
    if (targetApple) {
      triggerBurst(targetApple);
    }

    playSound('pop');
    setScore(prev => {
      const newScore = prev + 1;
      if (newScore >= WIN_TARGET) {
        setStatus(GameStatus.WON);
        playSound('win');
      }
      return newScore;
    });

    setApples(prev => {
      const remaining = prev.filter(apple => apple.id !== id);
      const spawnChance = Math.random();
      const spawnCount = spawnChance > 0.8 ? 2 : (spawnChance > 0.4 ? 1 : 0);
      
      const newSpawn: AppleData[] = [];
      for(let i = 0; i < spawnCount; i++) {
        newSpawn.push(createApple(`apple-new-${Date.now()}-${i}`));
      }
      return [...remaining, ...newSpawn];
    });
  }, [status, createApple, apples, triggerBurst]);

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
            ? `The user successfully revealed the photo behind the apples in Apple Harvest. Congratulate them on their harvest skills and clear sight.`
            : `The user only cleared ${score} apples and couldn't fully reveal the photo in Apple Harvest. Give a funny, rustic encouragement to try again.`;
            
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });
          setFeedback(response.text ?? null);
        } catch (e) {
          setFeedback(status === GameStatus.WON ? "The secret is finally revealed!" : "Close, but the harvest continues. Try again!");
        }
      };
      generateMessage();
    }
  }, [status, score]);

  // Progressive Reveal logic: Photo visibility is updated every single pop
  const bgRevealProgress = useMemo(() => {
    if (status === GameStatus.IDLE || status === GameStatus.SPAWNING) return 0;
    if (status === GameStatus.WON) return 1;
    return Math.min(score / WIN_TARGET, 1);
  }, [score, status]);

  const getBgConfig = () => {
    // Completely hidden at the very start screen
    if (status === GameStatus.IDLE || status === GameStatus.SPAWNING) {
      return { scale: 1.1, z: -150, blur: '40px', opacity: 0, brightness: 0 };
    }
    
    // Background is visible but obscured from the first moment of play
    const baseBlur = deviceType === 'mobile' ? 20 : 35;
    const currentBlur = Math.max(0, baseBlur * (1 - bgRevealProgress));
    const currentBrightness = 0.2 + (bgRevealProgress * 0.8);
    const currentContrast = 0.8 + (bgRevealProgress * 0.2);

    switch(deviceType) {
      case 'mobile':
        return { scale: 1.15, z: -100, blur: `${currentBlur}px`, opacity: 1, brightness: currentBrightness, contrast: currentContrast };
      case 'tablet':
        return { scale: 1.0, z: -50, blur: `${currentBlur}px`, opacity: 1, brightness: currentBrightness, contrast: currentContrast };
      default:
        return { scale: 1.25, z: -200, blur: `${currentBlur}px`, opacity: 1, brightness: currentBrightness, contrast: currentContrast };
    }
  };

  const { scale: bgScale, z: bgZ, blur: bgBlur, opacity: bgOpacity, brightness: bgBrightness, contrast: bgContrast } = getBgConfig();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden font-sans select-none touch-none">
      
      {/* 3D Glass Header */}
      <div className="fixed top-0 left-0 w-full z-[2000] p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 bg-gradient-to-b from-black/95 via-black/40 to-transparent pointer-events-none safe-top">
        <div className="flex flex-col items-center md:items-start drop-shadow-lg">
          <h1 className="text-white text-2xl md:text-3xl font-black tracking-tighter">
            APPLE <span className="text-red-500">HARVEST</span>
          </h1>
          <p className="hidden md:block text-red-400 text-[10px] font-black uppercase tracking-[0.4em] opacity-90">Every pop clears the view</p>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 bg-black/80 px-6 md:px-10 py-3 rounded-2xl border border-white/20 backdrop-blur-3xl shadow-2xl transition-all duration-500" style={{ opacity: status === GameStatus.IDLE ? 0 : 1 }}>
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Time</span>
            <span className={`text-xl md:text-3xl font-mono font-black tabular-nums transition-colors ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              :{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
          <div className="w-px h-10 bg-white/20"></div>
          <div className="flex flex-col items-center">
            <span className="text-white/60 text-[8px] md:text-[9px] uppercase font-black tracking-widest">Revealed</span>
            <span className="text-xl md:text-3xl font-mono font-black tabular-nums text-green-400">
              {Math.floor(bgRevealProgress * 100)}<span className="text-sm text-white/30 ml-1">%</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3D Game Perspective Engine */}
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{ perspective: deviceType === 'mobile' ? '600px' : '1200px', perspectiveOrigin: '50% 50%' }}
      >
        <div 
          className="relative h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Background Layer - Strictly Reactive to Pops */}
          <div 
            className="absolute inset-0 transition-all duration-300 ease-out pointer-events-none" 
            style={{ 
              transform: `translate3d(0,0,${bgZ}px) scale(${bgScale})`,
              transformOrigin: 'center center',
              filter: `blur(${bgBlur}) brightness(${bgBrightness}) contrast(${bgContrast || 1})`,
              opacity: bgOpacity
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
            {particles.map(p => (
              <Particle key={p.id} data={p} />
            ))}
          </div>
        </div>
      </div>

      {/* Spawning Overlay Message */}
      {status === GameStatus.SPAWNING && (
        <div className="fixed inset-0 z-[2500] pointer-events-none flex items-center justify-center">
          <div className="text-6xl md:text-9xl font-black text-white italic tracking-tighter uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,1)] animate-pulse">
            READY?
          </div>
        </div>
      )}

      {/* Overlays */}
      {(status === GameStatus.IDLE || status === GameStatus.WON || status === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-3xl p-6 transition-all duration-700">
          <div className="bg-gradient-to-br from-neutral-900 to-black p-10 md:p-14 rounded-[3.5rem] shadow-2xl border border-white/10 max-w-sm md:max-w-md w-full transform transition-all text-center">
            {status === GameStatus.IDLE ? (
              <>
                <div className="w-28 h-28 bg-gradient-to-br from-red-600 to-red-950 rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center shadow-[0_20px_50px_rgba(220,38,38,0.4)] relative">
                   <div className="w-16 h-16 bg-white rounded-full relative shadow-inner overflow-hidden">
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-8 bg-amber-900 rounded-full"></div>
                      <div className="absolute top-2 left-2 w-8 h-8 bg-red-100 rounded-full blur-xl opacity-50"></div>
                   </div>
                   <div className="absolute -top-4 -right-2 text-4xl animate-bounce">🍎</div>
                </div>
                <h2 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase leading-none italic">APPLE<br/>HARVEST</h2>
                <p className="text-white/50 mb-10 font-medium leading-relaxed px-2 text-lg">
                  Pop the apple curtain to clarify the secret view. Reach <span className="text-red-400 font-bold">{WIN_TARGET}</span> clears before time expires!
                </p>
              </>
            ) : status === GameStatus.WON ? (
              <>
                <div className="text-8xl mb-8 animate-bounce">✨</div>
                <h2 className="text-5xl font-black text-green-400 mb-4 italic uppercase tracking-tighter">SUCCESS!</h2>
                <p className="text-white/80 text-xl font-bold mb-8">The Orchard is Revealed</p>
                {feedback && <div className="text-white/60 italic mb-10 bg-white/5 p-6 rounded-[2rem] border border-white/5 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            ) : (
              <>
                <div className="text-8xl mb-8 opacity-40">⏳</div>
                <h2 className="text-5xl font-black text-red-500 mb-4 uppercase italic tracking-tighter">TIME'S UP</h2>
                <p className="text-white/80 text-xl font-bold mb-8">Harvested {score} / {WIN_TARGET} apples</p>
                {feedback && <div className="text-white/60 italic mb-10 bg-white/5 p-6 rounded-[2rem] border border-white/5 text-sm leading-relaxed">"{feedback}"</div>}
              </>
            )}

            <button
              onClick={initGame}
              className="group relative w-full py-7 px-10 bg-red-600 hover:bg-red-500 text-white font-black rounded-[2rem] transition-all shadow-[0_20px_40px_rgba(220,38,38,0.3)] active:scale-95 text-2xl uppercase tracking-[0.2em] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative drop-shadow-2xl">{status === GameStatus.IDLE ? 'START HARVEST' : 'TRY AGAIN'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
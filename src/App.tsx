/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Radio, 
  Wifi, 
  WifiOff, 
  Volume2, 
  MessageCircle, 
  Facebook, 
  Youtube, 
  Phone, 
  Terminal, 
  Check, 
  FileCode, 
  Sliders, 
  HelpCircle,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// @ts-ignore
import bannerImage from './assets/images/regenerated_image_1780884894287.png';

// Shared database structures
const STATIONS = [
  {
    id: 'ecosdelmar',
    nombre: 'Ecos del Mar',
    stream: 'http://137.220.54.196:8000/ecosdelmar',
    genero: 'Latin / Tropical',
    descripcion: 'Sonidos del Mar',
    color: '#e94560',
    autoplay: true,
    cover: bannerImage,
  },
  {
    id: '94.9fm',
    nombre: '94.9 FM',
    stream: 'https://949fm.ca/stream',
    genero: 'Hit Music',
    descripcion: 'Top 40 & Current Hits',
    color: '#f5a623',
    autoplay: false,
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
  }
];

const BANNER_URL = 'https://drive.google.com/uc?export=view&id=1lC-H9RChTT03J5pWJ1JK3-DifKaKlpVq';

const SOCIAL_LINKS = [
  {
    name: 'WhatsApp',
    url: 'https://wa.me/15196190373',
    icon: MessageCircle,
    color: '#25D366',
  },
  {
    name: 'Facebook',
    url: 'https://www.facebook.com/share/18sTJS5yKm/',
    icon: Facebook,
    color: '#1877F2',
  },
  {
    name: 'YouTube',
    url: 'https://youtube.com/@ecosdelmar',
    icon: Youtube,
    color: '#FF0000',
  }
];

// React Native Source Files database to render under the Developer Source Tab (removed simulation files to clean code)

export default function App() {
  const [activeStation, setActiveStation] = useState(STATIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showNetworkAlert, setShowNetworkAlert] = useState(!navigator.onLine);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio API and Canvas Refs for spectrum frequency visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync state with offline detection
  const wasPlayingBeforeOffline = useRef(false);

  // Initialize AudioContext inside a user gesture interaction to satisfy browser security requirements
  const initAudioContext = () => {
    if (!audioRef.current) return;

    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch((err) => console.warn("Failed to resume AudioContext:", err));
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn("Web Audio API not supported in this browser.");
        return;
      }

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      // small fftSize produces 32 discrete, high-quality chunky frequency bars (good for mobile cards)
      analyser.fftSize = 64; 

      if (!sourceRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
      }

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      console.log("Web Audio API successfully connected to HTML5 Audio element.");
    } catch (err) {
      console.warn("Web Audio API connection failed (possibly because of double element attachment):", err);
    }
  };

  // Keep canvas element sharp and scaled correctly on high-DPI / Retina screens
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Web Audio frequency draw render loop
  useEffect(() => {
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Clean canvas and prepare scale
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Render aesthetic glowing music frequency visualizer bars
      const activeBins = Math.floor(bufferLength * 0.85); // Skip extreme treble ranges which are usually flat
      const barWidth = width / activeBins;
      const accentColor = activeStation.color || "#e94560";

      for (let i = 0; i < activeBins; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        // Display subtle tiny resting bars when stream is technically connected but silent
        const barHeight = Math.max(2, percent * height * 0.85);

        const x = i * barWidth;
        const y = height - barHeight;

        ctx.fillStyle = accentColor;
        ctx.shadowBlur = isPlaying ? 8 : 0;
        ctx.shadowColor = accentColor;

        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x + 1.5, y, barWidth - 3, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        } else {
          ctx.fillRect(x + 1.5, y, barWidth - 3, barHeight);
        }
      }

      ctx.restore();
    };

    if (isPlaying) {
      draw();
    } else {
      // Draw quiet idle bars when audio is paused
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const width = canvas.width / dpr;
          const height = canvas.height / dpr;

          ctx.save();
          ctx.scale(dpr, dpr);

          const binsCount = 24;
          const barWidth = width / binsCount;
          const accentColor = activeStation.color || "#e94560";

          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.25;

          for (let i = 0; i < binsCount; i++) {
            const x = i * barWidth;
            const barHeight = 2; // static low height
            const y = height - barHeight;

            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(x + 1.5, y, barWidth - 3, barHeight, [1.5, 1.5, 0, 0]);
              ctx.fill();
            } else {
              ctx.fillRect(x + 1.5, y, barWidth - 3, barHeight);
            }
          }
          ctx.restore();
        }
      }
    }

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, activeStation]);

  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      setShowNetworkAlert(false);
      if (wasPlayingBeforeOffline.current) {
        setIsPlaying(true);
      }
    };

    const handleOffline = () => {
      wasPlayingBeforeOffline.current = isPlaying;
      setIsConnected(false);
      setShowNetworkAlert(true);
      setIsPlaying(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isPlaying]);

  // Load from localstorage (mimics React Native AsyncStorage on load)
  useEffect(() => {
    // Set fallback audio ref matching active browser capabilities
    const savedStationId = localStorage.getItem("@RadioMix:last_station_id");
    const savedVolume = localStorage.getItem("@RadioMix:volume");
    const savedPlayingState = localStorage.getItem("@RadioMix:playing_state");

    if (savedVolume !== null) {
      const volInt = parseFloat(savedVolume);
      setVolume(volInt);
      if (audioRef.current) audioRef.current.volume = volInt;
    }

    if (savedStationId !== null) {
      const stat = STATIONS.find(s => s.id === savedStationId);
      if (stat) {
        setActiveStation(stat);
        // Autoplay check
        if (stat.autoplay || savedPlayingState === "true") {
          setIsPlaying(true);
        }
      }
    } else {
      // First initiation: Ecos del Mar has autoplay: true
      const defaultStat = STATIONS[0];
      if (defaultStat.autoplay) {
        setIsPlaying(true);
      }
    }
  }, []);

  // Playback monitor & streams triggers
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    // Stream state listeners for clean buffer feedback
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onError = (e) => {
      console.warn("Audio streaming load error:", e);
      setIsBuffering(false);
    };

    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);

    if (isPlaying && isConnected) {
      setIsBuffering(true);
      // Proxy ALL radio streams over our secure HTTPS Express proxy to avoid mixed-content and enforce anonymous CORS headers for Web Audio API
      const streamUrl = `/api/stream?url=${encodeURIComponent(activeStation.stream)}`;
      
      audio.src = streamUrl;
      audio.load(); // Cleanly initiate stream loading sequence
      audio.volume = volume;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsBuffering(false);
          })
          .catch((e) => {
            console.warn("Unable to trigger autoplay or blocked by browser gesture rules. Awaiting press.", e);
            setIsBuffering(false);
            setIsPlaying(false);
          });
      }
    } else {
      audio.pause();
      audio.src = "";
      setIsBuffering(false);
    }

    return () => {
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
    };
  }, [isPlaying, activeStation, isConnected]);

  // Adjust volume
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    localStorage.setItem('@RadioMix:volume', newVolume.toString());
  };

  // Stop & Play cleanly when switching stations
  const handleStationChange = (station: typeof STATIONS[0]) => {
    initAudioContext();
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      } catch (err) {
        console.warn("Error stopping audio stream on change:", err);
      }
    }
    setActiveStation(station);
    setIsPlaying(true);
    localStorage.setItem("@RadioMix:last_station_id", station.id);
    localStorage.setItem("@RadioMix:playing_state", "true");
  };

  const handleStationClick = (station: typeof STATIONS[0]) => {
    initAudioContext();
    if (activeStation.id === station.id) {
      togglePlayPause();
    } else {
      handleStationChange(station);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      } catch (err) {
        console.warn("Error stopping audio:", err);
      }
    }
    localStorage.setItem("@RadioMix:playing_state", "false");
  };

  const togglePlayPause = () => {
    initAudioContext();
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    localStorage.setItem("@RadioMix:playing_state", nextState ? "true" : "false");
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white flex flex-col justify-center items-center p-4 md:p-6 lg:p-8 font-sans select-none antialiased relative overflow-hidden">
      
      {/* Decorative Immersive Ambient Glow Lights background */}
      <div className="absolute top-12 left-10 w-96 h-96 bg-[#e94560]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-20 w-[450px] h-[450px] bg-[#0f3460]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[#1a1a2e] bg-gradient-to-b from-[#1a1a2e] to-[#111122] -z-20 pointer-events-none" />

      {/* Dynamic Network Alert Toast Notification */}
      <AnimatePresence>
        {showNetworkAlert && (
          <motion.div 
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#e94560] border border-red-500 py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(233,69,96,0.6)] flex items-center gap-3 z-50 text-sm font-semibold text-center"
          >
            <WifiOff className="w-4 h-4 text-white animate-pulse" />
            <span>CRITICAL: Conectividad Perdida. Conéctate a internet para continuar.</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col items-center gap-6 max-w-sm w-full z-10">

        {/* Center Phone Frame Container */}
        <div className="relative w-[340px] h-[670px] bg-[#1a1a2e] rounded-[48px] border-[12px] border-[#2c2d42] shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden ring-4 ring-black/40">
          
          {/* Phone Status Notch Indicator */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#2c2d42] rounded-b-2xl z-30 flex items-center justify-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 pointer-events-none" />
            <div className="w-12 h-1 bg-black/40 rounded-full" />
          </div>

          {/* Completely non-scrollable layout adjusted perfectly to the screen size */}
          <div className="flex-1 overflow-hidden flex flex-col justify-between pt-0 pb-3 bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
            
            {/* 1. Header Banner */}
            <div className="w-full h-[170px] bg-[#16213e] relative select-none min-h-[170px] shrink-0">
              <img 
                src={bannerImage} 
                alt="Ecos del Mar tropical Banner" 
                className="w-full h-[170px] object-cover object-top opacity-90"
                onError={(e) => {
                  e.currentTarget.src = BANNER_URL;
                }}
              />
              {!isConnected && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#e94560] text-center text-[10px] font-bold py-1 tracking-wider uppercase z-10">
                   MODO OFFLINE — Sin Conexión
                </div>
              )}
            </div>

            {/* Grouping Live control stage and volume controls to sit tightly together */}
            <div className="flex flex-col gap-2 shrink-0">
              {/* 2. Visual Audio Stage Container (Optimized Space) */}
              <div className="w-[310px] h-[118px] ml-[5px] mr-[-8px] mt-[33px] mb-[-4px] pl-0 pr-[2px] pt-[4px] pb-[9px] rounded-xl glass shadow-lg border border-white/10 flex flex-col items-center relative overflow-hidden">
                {/* Sleek dynamic frequency visualizer canvas */}
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full opacity-35 pointer-events-none -z-10 rounded-xl"
                />
                
                {/* Indicators badge */}
                <div className="flex items-center justify-between w-full mb-1">
                  {isBuffering ? (
                    <div className="flex items-center gap-1 bg-[#e94560]/20 border border-[#e94560]/40 px-2 py-0.5 rounded-full text-[8px] font-black text-[#e94560] animate-pulse uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-[#e94560] animate-ping" />
                      CONECTANDO...
                    </div>
                  ) : isPlaying ? (
                    <div className="flex items-center gap-1 bg-[#e94560] px-2 py-0.5 rounded-full text-[8px] font-black text-white animate-pulse-badge uppercase tracking-wider shadow-[0_0_8px_rgba(233,69,96,0.6)]">
                      <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                      LIVE BROADCAST
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                      PAUSED
                    </div>
                  )}

                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className={`w-1 h-1 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {isConnected ? 'ONLINE' : 'DESCONECTADO'}
                  </div>
                </div>

                {/* Selected station info labels */}
                <div className="text-center mt-0.5 px-1 shrink-0">
                  <h3 className="text-xs font-extrabold tracking-tight text-white line-clamp-1">{activeStation.nombre}</h3>
                  <p className="text-[9px] text-[#e94560] font-bold tracking-widest mt-0.5 uppercase leading-none">{activeStation.genero}</p>
                </div>

                {/* Primary control button row */}
                <div className="flex items-center justify-center gap-3 mt-1.5 w-full shrink-0">
                  
                  {/* Stop stream button */}
                  <button 
                    onClick={handleStop}
                    className="w-8.5 h-8.5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-90"
                    title="Detener Stream"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>

                  {/* Play/Pause toggler button */}
                  <button 
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full bg-[#e94560] glow-accent flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer shadow-lg shadow-red-500/20 hover:scale-105"
                    title={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Slider Volume Controls */}
              <div className="mx-4 mt-0.5">
                <div className="flex justify-between text-[10px] text-slate-300 font-semibold mb-0.5">
                  <div className="flex items-center gap-1 text-[#e94560]">
                    <Volume2 className="w-3 h-3" />
                    <span>Volumen</span>
                  </div>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#e94560]"
                />
              </div>
            </div>

            {/* 4. Station Switcher list */}
            <div className="mt-3 px-3 flex flex-col shrink-0">
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">EMISORAS MIX</span>
                <span className="text-[8px] text-slate-500 font-mono">Pausa / Play</span>
              </div>
              
              <div className="space-y-1.5">
                {STATIONS.map((station) => {
                  const isActive = activeStation.id === station.id;
                  return (
                    <div 
                      key={station.id}
                      onClick={() => handleStationClick(station)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all border ${isActive ? 'bg-[#16213e]/95 border-[#e94560] border-l-2 border-l-[#e94560] pl-2 shadow-sm' : 'bg-[#0f407c]/15 hover:bg-[#0f407c]/30 border-white/5 border-l-2 border-l-transparent'}`}
                    >
                      <img 
                        src={station.cover} 
                        alt={station.nombre} 
                        className="w-8.5 h-8.5 rounded-md object-cover bg-slate-950 border border-white/10 shadow"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate leading-none">{station.nombre}</h4>
                          {isActive && isPlaying && (
                            <span className="bg-[#e94560] text-white text-[7px] font-black tracking-widest px-1 rounded animate-pulse">ON AIR</span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 truncate leading-none mt-1">{station.genero}</p>
                      </div>
                      
                      {/* Interactive Individual Station Play/Pause button */}
                      <button
                        className={`p-1.5 rounded-full transition-all flex items-center justify-center ${isActive && isPlaying ? 'bg-[#e94560] text-white shadow-sm' : 'bg-white/5 text-slate-350 hover:text-white hover:bg-white/10'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStationClick(station);
                        }}
                      >
                        {isActive && isPlaying ? (
                          <Pause className="w-2.5 h-2.5 fill-current" />
                        ) : (
                          <Play className="w-2.5 h-2.5 translate-x-[0.5px] fill-current" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Footer Social Links Section (SÍGUENOS) */}
            <div className="text-center shrink-0 max-w-[316px] w-full border-t border-white/5 pl-[11px] pr-3 pt-[-7px] ml-0 mr-[-2px] mt-[-4px] pb-[-11px] mb-[6px]">
              <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase block ml-0 mr-[2px] mt-0 mb-[33px] pb-[5px]">SÍGUENOS EN REDES</span>
              
              <div className="flex gap-1.5 justify-between">
                {SOCIAL_LINKS.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <a 
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex flex-col items-center gap-0.5 py-1 px-0.5 bg-white/5 rounded-lg hover:scale-105 active:scale-95 border border-white/5 text-slate-200 transition-all text-[9px] font-medium"
                    >
                      <IconComp className="w-3.5 h-3.5" style={{ color: item.color }} />
                      <span className="text-[8px] mt-0.5" style={{ color: item.color }}>{item.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom smartphone bar spacing */}
          <div className="h-4 bg-[#2c2d42] border-t border-slate-950/20 flex justify-center items-center">
            <div className="w-24 h-1 bg-white/30 rounded-full" />
          </div>

        </div>

      </div>
    </div>
  );
}


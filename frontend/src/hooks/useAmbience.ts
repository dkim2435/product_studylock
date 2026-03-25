'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Howl, Howler } from 'howler';

interface SoundOption {
  id: string;
  name: string;
  icon: string;
  files: string[];
  sequential?: boolean; // Must play in order 1→2→3→4→1... no skip
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: 'lofi', name: 'Lofi', icon: '🎵', files: ['lofi1.mp3', 'lofi2.mp3', 'lofi3.mp3', 'lofi4.mp3', 'lofi5.mp3', 'lofi6.mp3', 'lofi7.mp3'] },
  { id: 'cabin', name: 'Cabin', icon: '✈️', files: ['cabin1.mp3', 'cabin2.mp3', 'cabin3.mp3', 'cabin4.mp3'], sequential: true },
  { id: 'rain', name: 'Rain', icon: '🌧', files: ['rain1.mp3', 'rain2.mp3', 'rain3.mp3', 'rain4.mp3', 'rain5.mp3'] },
  { id: 'ocean', name: 'Ocean', icon: '🌊', files: ['ocean1.mp3', 'ocean2.mp3', 'ocean3.mp3', 'ocean4.mp3', 'ocean5.mp3'] },
  { id: 'birds', name: 'Birds', icon: '🐦', files: ['birds1.mp3', 'birds2.mp3', 'birds3.mp3', 'birds4.mp3', 'birds5.mp3'] },
  { id: 'fire', name: 'Fire', icon: '🔥', files: ['fireplace1.mp3', 'fireplace2.mp3'] },
];

export function useAmbience() {
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [freqData, setFreqData] = useState<Uint8Array>(new Uint8Array(32));

  const howlRef = useRef<Howl | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      howlRef.current?.unload();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const stopCurrent = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (howlRef.current) {
      howlRef.current.fade(howlRef.current.volume(), 0, 300);
      const old = howlRef.current;
      setTimeout(() => { old.stop(); old.unload(); }, 300);
      howlRef.current = null;
    }
    analyserRef.current = null;
    setIsPlaying(false);
    setFreqData(new Uint8Array(32));
  }, []);

  // Visualizer loop — reads frequency data from analyser
  const startVisualizer = useCallback(() => {
    const loop = () => {
      if (analyserRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        // Downsample to 32 bars
        const bars = new Uint8Array(32);
        const step = Math.floor(data.length / 32);
        for (let i = 0; i < 32; i++) {
          bars[i] = data[i * step];
        }
        setFreqData(bars);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const playTrack = useCallback((soundId: string, idx: number, vol: number) => {
    const option = SOUND_OPTIONS.find(o => o.id === soundId);
    if (!option) return;

    const safeIdx = idx % option.files.length;
    const file = option.files[safeIdx];

    stopCurrent();

    const isSequential = option.sequential === true;

    const howl = new Howl({
      src: [`/assets/sounds/${file}`],
      loop: false, // Never loop — always advance to next track
      volume: isMuted ? 0 : vol,
      html5: false, // Use Web Audio API for analyser access
      onplay: () => {
        setIsPlaying(true);

        // Setup analyser for visualizer
        try {
          const ctx = Howler.ctx;
          if (ctx) {
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.8;

            Howler.masterGain.connect(analyser);
            analyserRef.current = analyser;
            startVisualizer();
          }
        } catch {
          // Web Audio API not available
        }
      },
      onend: () => {
        // Auto-advance: cabin plays in order, others shuffle
        let nextIdx: number;
        if (isSequential) {
          nextIdx = (safeIdx + 1) % option.files.length;
        } else if (option.files.length <= 1) {
          nextIdx = 0;
        } else {
          // Random next, avoiding same track
          nextIdx = safeIdx;
          while (nextIdx === safeIdx) {
            nextIdx = Math.floor(Math.random() * option.files.length);
          }
        }
        setTrackIndex(nextIdx);
        playTrack(soundId, nextIdx, vol);
      },
    });

    howlRef.current = howl;
    setTrackIndex(safeIdx);
    howl.play();
  }, [isMuted, stopCurrent, startVisualizer]);

  const selectSound = useCallback((id: string) => {
    if (currentSound === id) {
      stopCurrent();
      setCurrentSound(null);
      return;
    }

    setCurrentSound(id);
    const opt = SOUND_OPTIONS.find(o => o.id === id);
    const startIdx = opt?.sequential ? 0 : Math.floor(Math.random() * (opt?.files.length || 1));
    playTrack(id, startIdx, volume);
  }, [currentSound, volume, playTrack, stopCurrent]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    if (howlRef.current && !isMuted) {
      howlRef.current.volume(vol);
    }
  }, [isMuted]);

  const togglePlay = useCallback(() => {
    if (!howlRef.current || !currentSound) return;

    if (isPlaying) {
      howlRef.current.pause();
      setIsPlaying(false);
    } else {
      howlRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, currentSound]);

  const nextTrack = useCallback(() => {
    if (!currentSound) return;
    const option = SOUND_OPTIONS.find(o => o.id === currentSound);
    if (!option || option.files.length <= 1) return;
    const nextIdx = (trackIndex + 1) % option.files.length;
    playTrack(currentSound, nextIdx, volume);
  }, [currentSound, trackIndex, volume, playTrack]);

  const prevTrack = useCallback(() => {
    if (!currentSound) return;
    const option = SOUND_OPTIONS.find(o => o.id === currentSound);
    if (!option || option.files.length <= 1) return;
    const prevIdx = (trackIndex - 1 + option.files.length) % option.files.length;
    playTrack(currentSound, prevIdx, volume);
  }, [currentSound, trackIndex, volume, playTrack]);

  const shuffle = useCallback(() => {
    if (!currentSound) return;
    const option = SOUND_OPTIONS.find(o => o.id === currentSound);
    if (!option || option.files.length <= 1) return;
    let randomIdx = Math.floor(Math.random() * option.files.length);
    while (randomIdx === trackIndex && option.files.length > 1) {
      randomIdx = Math.floor(Math.random() * option.files.length);
    }
    playTrack(currentSound, randomIdx, volume);
  }, [currentSound, trackIndex, volume, playTrack]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (howlRef.current) {
        howlRef.current.volume(newMuted ? 0 : volume);
      }
      return newMuted;
    });
  }, [volume]);

  const option = SOUND_OPTIONS.find(o => o.id === currentSound);
  const trackName = option
    ? `${option.name} #${trackIndex + 1}`
    : '';

  return {
    currentSound,
    volume,
    isPlaying,
    trackIndex,
    trackTotal: option?.files.length || 0,
    trackName,
    freqData,
    isSequential: option?.sequential ?? false,
    selectSound,
    setVolume,
    togglePlay,
    nextTrack,
    prevTrack,
    shuffle,
    isMuted,
    toggleMute,
    soundOptions: SOUND_OPTIONS,
  };
}

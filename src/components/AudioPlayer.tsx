"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AudioPlayerProps {
  index: number;
  title: string;
  subtitle: string;
  src: string;
  isActive: boolean;
  onPlay: () => void;
}

export default function AudioPlayer({ index, title, subtitle, src, isActive, onPlay }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const barsRef = useRef<number[]>([]);
  const [waveformReady, setWaveformReady] = useState(false);

  // Analyze actual audio file for real waveform + get duration
  useEffect(() => {
    let cancelled = false;

    async function analyzeAudio() {
      try {
        const res = await fetch(src);
        const arrayBuffer = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        if (cancelled) { audioCtx.close(); return; }

        // Set duration from decoded buffer (reliable)
        if (!cancelled) setDuration(audioBuffer.duration);

        const channelData = audioBuffer.getChannelData(0);
        const barCount = 200;
        const blockSize = Math.floor(channelData.length / barCount);
        const bars: number[] = [];

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[i * blockSize + j]);
          }
          bars.push(sum / blockSize);
        }

        const max = Math.max(...bars, 0.001);
        barsRef.current = bars.map((b) => b / max);
        audioCtx.close();
        if (!cancelled) setWaveformReady(true);
      } catch {
        // Fallback: sine envelope waveform
        const bars: number[] = [];
        for (let i = 0; i < 200; i++) {
          const t = i / 200;
          const env = Math.sin(t * Math.PI);
          const detail = Math.sin(t * 13) * 0.12 + Math.sin(t * 29) * 0.07 + Math.random() * 0.06;
          bars.push(Math.max(0.05, env * 0.9 + detail));
        }
        barsRef.current = bars;
        if (!cancelled) setWaveformReady(true);
      }
    }

    analyzeAudio();
    return () => { cancelled = true; };
  }, [src]);

  // Stop this player when another becomes active
  useEffect(() => {
    if (!isActive && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  // Stop when Approche video starts
  useEffect(() => {
    const handler = () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    };
    window.addEventListener("studiombc:stopAudio", handler);
    return () => window.removeEventListener("studiombc:stopAudio", handler);
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bars = barsRef.current;
    if (!bars.length) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    if (!W || !H) return;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const barGap = 1;
    const barW = Math.max(0.5, (W - bars.length * barGap) / bars.length);

    bars.forEach((h, i) => {
      const x = i * (barW + barGap);
      const barH = Math.max(2, h * H * 0.85);
      const y = (H - barH) / 2;
      const frac = i / bars.length;
      ctx.fillStyle =
        frac <= progress
          ? "rgba(200,207,196,0.9)"
          : "rgba(200,207,196,0.18)";
      ctx.fillRect(x, y, barW, barH);
    });
  }, [progress]);

  // Redraw when waveform data or progress changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform, waveformReady]);

  // Redraw quand le canvas devient visible (ex: "Écouter plus" sur mobile)
  // Le canvas passe de offsetWidth=0 à une vraie largeur → ResizeObserver le détecte
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      if (barsRef.current.length) drawWaveform();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawWaveform]);

  // Animation loop only while playing
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const loop = () => {
      drawWaveform();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, drawWaveform]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    audio.addEventListener("ended", onEnded);

    // In case metadata already loaded before listener attached
    if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      onPlay(); // notify parent to stop others
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || !audio.duration) return;
    const rect = canvas.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    audio.currentTime = frac * audio.duration;
    setProgress(frac);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s) || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const numStr = String(index + 1).padStart(2, "0");

  return (
    <div className="ecouter-track" style={{ borderTop: "1px solid var(--line)", padding: "1.75rem 0" }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* Track number */}
        <span
          className="ecouter-num"
          style={{
            fontFamily: "var(--font-label)",
            fontSize: "10px",
            fontWeight: 200,
            color: "var(--muted)",
            letterSpacing: "0.1em",
            paddingTop: "5px",
            flexShrink: 0,
            width: "20px",
          }}
        >
          {numStr}
        </span>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: "0.2rem",
            }}
          >
            <span
              className="ecouter-title"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: "1.3rem",
                color: "var(--text)",
              }}
            >
              {title}
            </span>

            {/* Play / Pause text button */}
            <button
              className="ecouter-play-btn"
              onClick={togglePlay}
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "10px",
                fontWeight: 200,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: isPlaying ? "var(--text)" : "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                flexShrink: 0,
                transition: "color 0.2s",
                paddingLeft: "1.5rem",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = isPlaying ? "var(--text)" : "var(--accent)")
              }
            >
              {isPlaying ? (
                <>
                  <svg width="7" height="9" viewBox="0 0 7 9" fill="currentColor">
                    <rect x="0" y="0" width="2" height="9" rx="0.5" />
                    <rect x="5" y="0" width="2" height="9" rx="0.5" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg width="7" height="9" viewBox="0 0 7 9" fill="currentColor">
                    <path d="M0.5 0.5L6.5 4.5L0.5 8.5V0.5Z" />
                  </svg>
                  Écouter
                </>
              )}
            </button>
          </div>

          {/* Subtitle */}
          <p
            className="ecouter-subtitle"
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "9px",
              fontWeight: 200,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "1rem",
            }}
          >
            {subtitle}
          </p>

          {/* Waveform */}
          <canvas
            ref={canvasRef}
            className="ecouter-waveform"
            style={{ width: "100%", height: "36px", display: "block", cursor: "pointer" }}
            onClick={handleCanvasClick}
          />

          {/* Time */}
          <div
            className="ecouter-time"
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "9px",
              fontWeight: 200,
              color: "var(--muted)",
              letterSpacing: "0.08em",
              marginTop: "0.4rem",
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal, flushSync } from "react-dom";
import RevealWrapper from "./RevealWrapper";

const VIMEO_BASE =
  "https://player.vimeo.com/video/872893131?h=6ed5f18815&api=1&controls=0&title=0&byline=0&portrait=0&color=c8cfc4&dnt=1";

export default function Approche() {
  const [expanded, setExpanded] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileCinema, setMobileCinema] = useState(false);
  const [cinemaVisible, setCinemaVisible] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [cinemaIframeKey, setCinemaIframeKey] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubberVisible, setScrubberVisible] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const cinemaIframeRef = useRef<HTMLIFrameElement>(null);
  const suppressScroll = useRef(false);
  const scrubberTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);
  const mobileCinemaRef = useRef(false);
  const playerRef = useRef<any>(null);       // instance Vimeo.Player principale
  const cinemaPlayerRef = useRef<any>(null); // instance Vimeo.Player cinéma

  // SSR safety for createPortal
  useEffect(() => setMounted(true), []);

  // Charger le Vimeo Player SDK une seule fois
  useEffect(() => {
    if (document.getElementById("vimeo-player-sdk")) return;
    const s = document.createElement("script");
    s.id = "vimeo-player-sdk";
    s.src = "https://player.vimeo.com/api/player.js";
    document.head.appendChild(s);
  }, []);

  // Initialiser Vimeo.Player SDK — vidéo principale
  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!(window as any).Vimeo?.Player || !iframeRef.current) {
        setTimeout(tryInit, 200);
        return;
      }
      const p = new (window as any).Vimeo.Player(iframeRef.current);
      playerRef.current = p;
      p.on("timeupdate", ({ seconds, duration: d }: { seconds: number; duration: number }) => {
        setCurrentTime(seconds);
        if (d) setDuration(d);
      });
    };
    tryInit();
    return () => {
      cancelled = true;
      playerRef.current?.off?.("timeupdate");
      playerRef.current = null;
    };
  }, [playing, iframeKey]);

  // Initialiser Vimeo.Player SDK — cinéma
  useEffect(() => {
    if (!mobileCinema) return;
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (!(window as any).Vimeo?.Player || !cinemaIframeRef.current) {
        setTimeout(tryInit, 200);
        return;
      }
      const p = new (window as any).Vimeo.Player(cinemaIframeRef.current);
      cinemaPlayerRef.current = p;
      p.on("timeupdate", ({ seconds, duration: d }: { seconds: number; duration: number }) => {
        setCurrentTime(seconds);
        if (d) setDuration(d);
      });
    };
    tryInit();
    return () => {
      cancelled = true;
      cinemaPlayerRef.current?.off?.("timeupdate");
      cinemaPlayerRef.current = null;
    };
  }, [mobileCinema, cinemaIframeKey]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    mobileCinemaRef.current = mobileCinema;
  }, [mobileCinema]);

  // Collapse on scroll (desktop expanded mode)
  useEffect(() => {
    if (!expanded) return;
    const onScroll = () => {
      if (suppressScroll.current) return;
      handleCollapse();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [expanded]);

  // SDK en priorité, fallback postMessage brut
  function vimeoCmd(method: string, value?: unknown) {
    const player = mobileCinemaRef.current ? cinemaPlayerRef.current : playerRef.current;
    if (player) {
      if (method === "play")  { player.play().catch(() => {}); return; }
      if (method === "pause") { player.pause().catch(() => {}); return; }
      if (method === "setCurrentTime") {
        player.setCurrentTime(value as number)
          .then(() => { if (playingRef.current) player.play().catch(() => {}); })
          .catch(() => {});
        return;
      }
    }
    // Fallback postMessage
    const ref = mobileCinemaRef.current ? cinemaIframeRef : iframeRef;
    ref.current?.contentWindow?.postMessage(
      JSON.stringify(value !== undefined ? { method, value } : { method }),
      "*"
    );
  }

  function showControlsBriefly() {
    setControlsVisible(true);
    showScrubberBriefly();
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setControlsVisible(false), 3000);
  }

  function handleCinemaEnter() {
    // Pause la vidéo principale avant de basculer en cinéma
    if (playerRef.current) {
      playerRef.current.pause();
    } else {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method: "pause" }), "*");
    }
    mobileCinemaRef.current = true;
    // flushSync : monte le portal cinéma synchronement dans la gesture utilisateur
    flushSync(() => {
      setMobileCinema(true);
      setControlsVisible(false);
      setCinemaIframeKey(k => k + 1);
    });
    document.body.style.overflow = "hidden";
    setTimeout(() => window.scrollTo(0, 1), 50);
    requestAnimationFrame(() => requestAnimationFrame(() => setCinemaVisible(true)));
  }

  function handleCinemaExit() {
    if (cinemaPlayerRef.current) {
      cinemaPlayerRef.current.pause();
    } else {
      cinemaIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ method: "pause" }), "*");
    }
    setCinemaVisible(false);
    setTimeout(() => {
      setMobileCinema(false);
      mobileCinemaRef.current = false;
      document.body.style.overflow = "";
    }, 380);
    setPaused(true);
  }

  // Swipe up to exit cinema
  useEffect(() => {
    if (!mobileCinema) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (startY - e.touches[0].clientY > 60) handleCinemaExit();
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [mobileCinema]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (expanded || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 5, y: x * -5 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  function handlePlay() {
    window.dispatchEvent(new CustomEvent("studiombc:stopAudio"));
    suppressScroll.current = true;

    const el = videoRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const containerWidth = el.parentElement?.offsetWidth ?? window.innerWidth * 0.92;
      const expandedWidth = isMobile ? containerWidth : containerWidth * 0.78;
      const expandedHeight = expandedWidth * 0.5625;
      const videoTopAbsolute = rect.top + window.scrollY;
      const targetScroll = videoTopAbsolute + expandedHeight / 2 - window.innerHeight / 2;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }

    playingRef.current = true;
    // flushSync : force le render synchrone dans le click handler
    // → le nouvel iframe avec autoplay=1 est dans le DOM AVANT que iOS ferme la fenêtre gesture
    flushSync(() => {
      setPlaying(true);
      setIframeKey(k => k + 1);
      setPaused(false);
    });
    if (!isMobile) setTimeout(() => setExpanded(true), 20);
    setTimeout(() => { suppressScroll.current = false; }, 1600);
  }

  function handlePauseToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (paused) {
      vimeoCmd("play");
      setPaused(false);
    } else {
      vimeoCmd("pause");
      setPaused(true);
    }
  }

  function handleCollapse() {
    vimeoCmd("pause");
    playingRef.current = false;
    setIsCollapsing(true);
    setExpanded(false);
    setPaused(false);
    setTimeout(() => {
      setPlaying(false);
      setIsCollapsing(false);
      setCurrentTime(0);
    }, 950);
  }

  function handleScrubberClick(
    e: React.MouseEvent,
    _targetRef: React.RefObject<HTMLIFrameElement | null>
  ) {
    e.stopPropagation();
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTo = frac * duration;
    vimeoCmd("setCurrentTime", seekTo);
    setCurrentTime(seekTo);
  }

  function showScrubberBriefly() {
    setScrubberVisible(true);
    if (scrubberTimeout.current) clearTimeout(scrubberTimeout.current);
    scrubberTimeout.current = setTimeout(() => setScrubberVisible(false), 3000);
  }

  const videoSrc = playing ? VIMEO_BASE + "&autoplay=1" : VIMEO_BASE;
  const cinemaSrc =
    VIMEO_BASE + "&autoplay=1" + (currentTime > 1 ? `&t=${Math.floor(currentTime)}` : "");

  const pauseIcon = (
    <div
      className="pause-icon"
      style={{
        opacity: paused ? 1 : 0,
        transition: "opacity 0.2s ease",
        width: "52px", height: "52px", borderRadius: "50%",
        border: "1px solid rgba(240,236,228,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      {paused ? (
        <svg width="14" height="16" viewBox="0 0 14 16" fill="rgba(240,236,228,0.9)" style={{ marginLeft: "2px" }}>
          <path d="M1 1l12 7L1 15V1z" />
        </svg>
      ) : (
        <svg width="10" height="14" viewBox="0 0 10 14" fill="rgba(240,236,228,0.9)">
          <rect x="0" y="0" width="3" height="14" rx="0.5" />
          <rect x="7" y="0" width="3" height="14" rx="0.5" />
        </svg>
      )}
    </div>
  );

  function scrubberBar(_targetRef: React.RefObject<HTMLIFrameElement | null>) {
    const PAD = 14;
    const pct = duration ? (currentTime / duration) * 100 : 0;

    function seek(clientX: number, containerRect: DOMRect) {
      if (!duration) return;
      const frac = Math.max(0, Math.min(1, (clientX - containerRect.left - PAD) / (containerRect.width - PAD * 2)));
      const seekTo = frac * duration;
      vimeoCmd("setCurrentTime", seekTo);
      setCurrentTime(seekTo);
    }

    return (
      <div
        onClick={(e) => { e.stopPropagation(); seek(e.clientX, e.currentTarget.getBoundingClientRect()); }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          const t = e.changedTouches[0];
          seek(t.clientX, e.currentTarget.getBoundingClientRect());
        }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "44px",          // grande zone de clic (pas juste 3px)
          zIndex: 6,
          display: "flex",
          alignItems: "center",
          padding: `0 ${PAD}px`,
          background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
          opacity: scrubberVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: scrubberVisible ? "auto" : "none",
          cursor: "pointer",
        }}
      >
        {/* Track visuel */}
        <div style={{ position: "relative", width: "100%", height: "3px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", pointerEvents: "none" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: "2px" }} />
          <div style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: "9px", height: "9px", borderRadius: "50%",
            background: "var(--accent)",
          }} />
        </div>
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="approche"
      className="py-32"
      style={{
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--line)",
        overflow: "hidden",
        cursor: "default",
      }}
      onClick={expanded ? handleCollapse : undefined}
    >
      <div style={{ width: "100%", padding: "0 4vw" }}>
        <div className="approche-layout" style={{
          display: "flex",
          gap: expanded ? "0" : "4rem",
          alignItems: "start",
          justifyContent: expanded ? "center" : "flex-start",
          transition: "gap 0.95s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>

          {/* ── VIDEO ── */}
          <div
            ref={videoRef}
            className="approche-video"
            style={{
              flexShrink: 0,
              width: isMobile ? "100%" : expanded ? "78%" : "calc(50% - 2rem)",
              transition: "width 0.95s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <RevealWrapper delay={0}>
              <div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => playing && setScrubberVisible(true)}
                onMouseLeave={() => { handleMouseLeave(); setScrubberVisible(false); }}
                onTouchStart={() => { if (playing) showScrubberBriefly(); }}
                style={{
                  position: "relative",
                  width: "100%",
                  paddingBottom: "56.25%",
                  backgroundColor: "#0a0c0a",
                  transformOrigin: "center center",
                  transform: expanded
                    ? "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)"
                    : `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x === 0 && tilt.y === 0 ? 1 : 1.015})`,
                  transition: "transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.7s ease",
                  boxShadow: expanded
                    ? "none"
                    : tilt.x === 0 && tilt.y === 0
                    ? "0 8px 40px rgba(0,0,0,0.35)"
                    : "0 24px 60px rgba(0,0,0,0.55)",
                }}
              >
                <iframe
                  key={iframeKey}
                  ref={iframeRef}
                  src={videoSrc}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Approche"
                />

                {/* Bouton Cinéma — coin haut droit de la vidéo */}
                {isMobile && playing && !mobileCinema && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCinemaEnter(); }}
                    style={{
                      position: "absolute",
                      top: "0.75rem",
                      right: "0.75rem",
                      zIndex: 10,
                      background: "rgba(8,9,8,0.65)",
                      border: "1px solid rgba(200,207,196,0.35)",
                      color: "rgba(200,207,196,0.85)",
                      cursor: "pointer",
                      padding: "5px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontFamily: "var(--font-label)",
                      fontSize: "9px",
                      fontWeight: 200,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M0 0h4v1.5H1.5V4H0V0zm6 0h4v4H8.5V1.5H6V0zM0 6h1.5v2.5H4V10H0V6zm8.5 2.5H6V10h4V6H8.5v2.5z"/>
                    </svg>
                  </button>
                )}

                {/* Overlay play */}
                <div
                  onClick={!playing ? handlePlay : undefined}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 2,
                    background: "linear-gradient(135deg, rgba(8,10,8,0.45) 0%, rgba(8,10,8,0.15) 100%)",
                    opacity: playing ? 0 : 1,
                    pointerEvents: playing ? "none" : "auto",
                    cursor: "pointer",
                    transition: "opacity 0.4s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!playing) e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(8,10,8,0.6) 0%, rgba(8,10,8,0.25) 100%)";
                  }}
                  onMouseLeave={(e) => {
                    if (!playing) e.currentTarget.style.background =
                      "linear-gradient(135deg, rgba(8,10,8,0.45) 0%, rgba(8,10,8,0.15) 100%)";
                  }}
                >
                  <div style={{
                    width: "60px", height: "60px", borderRadius: "50%",
                    border: "1px solid rgba(240,236,228,0.6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "0.85rem", backdropFilter: "blur(4px)",
                  }}>
                    <svg width="16" height="18" viewBox="0 0 16 18" fill="rgba(240,236,228,0.9)" style={{ marginLeft: "2px" }}>
                      <path d="M1 1l14 8L1 17V1z" />
                    </svg>
                  </div>
                  <span style={{
                    fontFamily: "Inter, sans-serif", fontSize: "0.55rem",
                    fontWeight: 200, letterSpacing: "0.25em", textTransform: "uppercase",
                    color: "rgba(240,236,228,0.9)",
                  }}>
                    Regarder
                  </span>
                </div>

                {/* Fermer — desktop expanded */}
                {expanded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCollapse(); }}
                    style={{
                      position: "absolute",
                      top: "1.25rem",
                      right: "1.25rem",
                      fontFamily: "var(--font-label)",
                      fontSize: "9px",
                      fontWeight: 200,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      background: "none",
                      border: "1px solid var(--line)",
                      padding: "5px 10px",
                      cursor: "pointer",
                      transition: "color 0.2s, border-color 0.2s",
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text)";
                      e.currentTarget.style.borderColor = "var(--muted)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--muted)";
                      e.currentTarget.style.borderColor = "var(--line)";
                    }}
                  >
                    Fermer
                  </button>
                )}

                {/* Pause/play overlay — desktop expanded + mobile playing */}
                {(expanded || (playing && isMobile && !mobileCinema)) && (
                  <div
                    onClick={handlePauseToggle}
                    style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 3,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0,0,0,0.18)";
                      const icon = e.currentTarget.querySelector(".pause-icon") as HTMLElement;
                      if (icon) icon.style.opacity = "1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      const icon = e.currentTarget.querySelector(".pause-icon") as HTMLElement;
                      if (icon) icon.style.opacity = "0";
                    }}
                  >
                    {pauseIcon}
                  </div>
                )}

                {/* Scrubber — main video */}
                {playing && !mobileCinema && scrubberBar(iframeRef)}
              </div>
            </RevealWrapper>
          </div>

          {/* ── TEXTE ── */}
          <div
            className="approche-text"
            style={{
              flex: expanded ? "0 0 0%" : "1 1 0%",
              minWidth: 0,
              overflow: "hidden",
              paddingTop: "1rem",
              paddingRight: "2vw",
              transform: expanded ? "translateX(120%)" : "translateX(0)",
              opacity: expanded ? 0 : 1,
              pointerEvents: expanded ? "none" : "auto",
              transition: isCollapsing
                ? "flex 0.95s cubic-bezier(0.4, 0, 0.2, 1), transform 0.85s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.75s ease 0.1s"
                : "flex 0.95s cubic-bezier(0.4, 0, 0.2, 1), transform 0.85s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease",
            }}
          >
            <RevealWrapper delay={100}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
                <div style={{ width: "40px", height: "1px", background: "var(--muted)", opacity: 0.4 }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--muted)" }}>
                  01 — approche
                </span>
              </div>
            </RevealWrapper>

            <RevealWrapper delay={180}>
              <h2 style={{
                fontFamily: "Cormorant Garamond, serif", fontWeight: 400,
                fontSize: "clamp(3rem, 4.2vw, 3.6rem)", lineHeight: 1.12,
                color: "#f5f2eb", marginBottom: "2.5rem", maxWidth: "1100px", letterSpacing: "-0.015em",
              }}>
                Un langage singulier à la croisée de l&apos;organique et de l&apos;électronique
              </h2>
            </RevealWrapper>

            <RevealWrapper delay={260}>
              <p style={{
                fontFamily: "Lora, serif", fontWeight: 400, fontSize: "1rem",
                color: "rgba(240,236,228,0.88)", lineHeight: 1.95, marginBottom: "2.5rem", maxWidth: "820px",
              }}>
                Nous composons une musique organique et texturée qui explore les tensions invisibles des personnages — une écriture douce et mélodique en surface, traversée par une noirceur sous-jacente, conçue pour révéler ce que l&apos;image ne montre pas.
              </p>
            </RevealWrapper>

            <RevealWrapper delay={340}>
              <div style={{ borderLeft: "1px solid rgba(240,236,228,0.35)", paddingLeft: "1.75rem", maxWidth: "780px" }}>
                <p style={{
                  fontFamily: "Cormorant Garamond, serif", fontWeight: 500,
                  fontSize: "1.35rem", fontStyle: "italic", color: "#ffffff", lineHeight: 1.7, letterSpacing: "-0.01em",
                }}>
                  &ldquo;Une musique qui expose la fracture intérieure sous une apparente douceur.&rdquo;
                </p>
              </div>
            </RevealWrapper>
          </div>

        </div>
      </div>

      {/* ── CINEMA PORTAL — rendu directement dans document.body pour iOS Safari ── */}
      {mounted && mobileCinema && createPortal(
        <div
          onClick={showControlsBriefly}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: "100dvh",
            zIndex: 9999,
            background: "#080908",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: cinemaVisible ? 1 : 0,
            transform: cinemaVisible ? "scale(1)" : "scale(0.92)",
            transition: "opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1), transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Fermer — visible uniquement après tap sur zone noire */}
          <button
            onClick={(e) => { e.stopPropagation(); handleCinemaExit(); }}
            style={{
              position: "absolute",
              top: "1.25rem",
              right: "1.25rem",
              fontFamily: "var(--font-label)",
              fontSize: "9px",
              fontWeight: 200,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--muted)",
              background: "none",
              border: "1px solid var(--line)",
              padding: "5px 10px",
              cursor: "pointer",
              zIndex: 10,
              opacity: controlsVisible ? 1 : 0,
              pointerEvents: controlsVisible ? "auto" : "none",
              transition: "opacity 0.25s ease",
            }}
          >
            Fermer
          </button>

          {/* Video — s'adapte portrait ET paysage via 100dvh */}
          <div
            style={{
              position: "relative",
              width: "min(100vw, calc(100dvh * 16 / 9))",
              height: "min(100dvh, calc(100vw * 9 / 16))",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              key={cinemaIframeKey}
              ref={cinemaIframeRef}
              src={cinemaSrc}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Approche Cinéma"
            />

            {/* Pause/play overlay */}
            <div
              onClick={handlePauseToggle}
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 3,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
              }}
            >
              {pauseIcon}
            </div>

            {/* Scrubber */}
            {scrubberBar(cinemaIframeRef)}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

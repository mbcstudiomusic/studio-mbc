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
  const [muted, setMuted] = useState(true);
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
  const playerRef = useRef<any>(null);
  const cinemaPlayerRef = useRef<any>(null);

  useEffect(() => setMounted(true), []);

  // Charger Vimeo Player SDK
  useEffect(() => {
    if (document.getElementById("vimeo-player-sdk")) return;
    const s = document.createElement("script");
    s.id = "vimeo-player-sdk";
    s.src = "https://player.vimeo.com/api/player.js";
    document.head.appendChild(s);
  }, []);

  // Initialiser Vimeo.Player — vidéo principale
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

  // Initialiser Vimeo.Player — cinéma
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
      // Synchroniser l'état mute courant sur le player cinéma
      p.setMuted(muted).catch(() => {});
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

  useEffect(() => { mobileCinemaRef.current = mobileCinema; }, [mobileCinema]);

  useEffect(() => {
    if (!expanded) return;
    const onScroll = () => { if (!suppressScroll.current) handleCollapse(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [expanded]);

  // Commandes Vimeo — SDK en priorité, fallback postMessage
  function vimeoCmd(method: string, value?: unknown) {
    const player = mobileCinemaRef.current ? cinemaPlayerRef.current : playerRef.current;
    if (player) {
      try {
        if (method === "play")  { player.play().catch(() => {}); return; }
        if (method === "pause") { player.pause().catch(() => {}); return; }
        if (method === "setCurrentTime") {
          player.setCurrentTime(value as number)
            .then(() => { if (playingRef.current) player.play().catch(() => {}); })
            .catch(() => {});
          return;
        }
      } catch {}
    }
    // Fallback postMessage Vimeo
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
    try { playerRef.current?.pause?.().catch(() => {}); } catch {}
    mobileCinemaRef.current = true;
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
    try { cinemaPlayerRef.current?.pause?.().catch(() => {}); } catch {}
    setCinemaVisible(false);
    setTimeout(() => {
      setMobileCinema(false);
      mobileCinemaRef.current = false;
      document.body.style.overflow = "";
    }, 380);
    setPaused(true);
  }

  useEffect(() => {
    if (!mobileCinema) return;
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchMove  = (e: TouchEvent) => { if (startY - e.touches[0].clientY > 60) handleCinemaExit(); };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove",  onTouchMove,  { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove",  onTouchMove);
    };
  }, [mobileCinema]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (expanded || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientY - rect.top)  / rect.height - 0.5) * 5,
               y: ((e.clientX - rect.left) / rect.width  - 0.5) * -5 });
  }
  function handleMouseLeave() { setTilt({ x: 0, y: 0 }); }

  function handlePlay() {
    window.dispatchEvent(new CustomEvent("studiombc:stopAudio"));
    suppressScroll.current = true;
    const el = videoRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const cw = el.parentElement?.offsetWidth ?? window.innerWidth * 0.92;
      const ew = isMobile ? cw : cw * 0.78;
      const targetScroll = rect.top + window.scrollY + ew * 0.5625 / 2 - window.innerHeight / 2;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    }
    playingRef.current = true;
    // flushSync : render synchrone → iframe autoplay=1 dans le DOM avant fermeture gesture iOS
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
    if (paused) { vimeoCmd("play");  setPaused(false); }
    else        { vimeoCmd("pause"); setPaused(true);  }
  }

  function handleCollapse() {
    vimeoCmd("pause");
    playingRef.current = false;
    setIsCollapsing(true);
    setExpanded(false);
    setPaused(false);
    setTimeout(() => { setPlaying(false); setIsCollapsing(false); setCurrentTime(0); }, 950);
  }

  function handleMuteToggle(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !muted;
    const player = mobileCinemaRef.current ? cinemaPlayerRef.current : playerRef.current;
    if (player) {
      player.setMuted(next).catch(() => {});
    }
    setMuted(next);
  }

  function showScrubberBriefly() {
    setScrubberVisible(true);
    if (scrubberTimeout.current) clearTimeout(scrubberTimeout.current);
    scrubberTimeout.current = setTimeout(() => setScrubberVisible(false), 3000);
  }

  const videoSrc  = playing ? VIMEO_BASE + "&autoplay=1&muted=1" : VIMEO_BASE;
  const cinemaSrc = VIMEO_BASE + "&autoplay=1&muted=1" + (currentTime > 1 ? `&t=${Math.floor(currentTime)}` : "");

  const pauseIcon = (
    <div className="pause-icon" style={{ opacity: paused ? 1 : 0, transition: "opacity 0.2s ease", width: "52px", height: "52px", borderRadius: "50%", border: "1px solid rgba(240,236,228,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      {paused
        ? <svg width="14" height="16" viewBox="0 0 14 16" fill="rgba(240,236,228,0.9)" style={{ marginLeft: "2px" }}><path d="M1 1l12 7L1 15V1z"/></svg>
        : <svg width="10" height="14" viewBox="0 0 10 14" fill="rgba(240,236,228,0.9)"><rect x="0" y="0" width="3" height="14" rx="0.5"/><rect x="7" y="0" width="3" height="14" rx="0.5"/></svg>
      }
    </div>
  );

  function scrubberBar(_ref: React.RefObject<HTMLIFrameElement | null>) {
    const PAD = 14;
    const pct = duration ? (currentTime / duration) * 100 : 0;
    function seek(clientX: number, rect: DOMRect) {
      if (!duration) return;
      const seekTo = Math.max(0, Math.min(1, (clientX - rect.left - PAD) / (rect.width - PAD * 2))) * duration;
      vimeoCmd("setCurrentTime", seekTo);
      setCurrentTime(seekTo);
    }
    return (
      <div
        onClick={(e) => { e.stopPropagation(); seek(e.clientX, e.currentTarget.getBoundingClientRect()); }}
        onTouchEnd={(e) => { e.stopPropagation(); const t = e.changedTouches[0]; seek(t.clientX, e.currentTarget.getBoundingClientRect()); }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "44px", zIndex: 6, display: "flex", alignItems: "center", padding: `0 ${PAD}px`, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)", opacity: scrubberVisible ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: scrubberVisible ? "auto" : "none", cursor: "pointer" }}
      >
        <div style={{ position: "relative", width: "100%", height: "3px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", pointerEvents: "none" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: "2px" }} />
          <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", width: "9px", height: "9px", borderRadius: "50%", background: "var(--accent)" }} />
        </div>
      </div>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="approche"
      className="py-32"
      style={{ backgroundColor: "var(--surface)", borderTop: "1px solid var(--line)", overflow: "hidden", cursor: "default" }}
      onClick={expanded ? handleCollapse : undefined}
    >
      <div style={{ width: "100%", padding: "0 4vw" }}>
        <div className="approche-layout" style={{ display: "flex", gap: expanded ? "0" : "4rem", alignItems: "start", justifyContent: expanded ? "center" : "flex-start", transition: "gap 0.95s cubic-bezier(0.4,0,0.2,1)" }}>

          {/* ── VIDEO ── */}
          <div ref={videoRef} className="approche-video" style={{ flexShrink: 0, width: isMobile ? "100%" : expanded ? "78%" : "calc(50% - 2rem)", transition: "width 0.95s cubic-bezier(0.4,0,0.2,1)" }} onClick={(e) => e.stopPropagation()}>
            <RevealWrapper delay={0}>
              <div
                onMouseMove={handleMouseMove}
                onMouseEnter={() => playing && setScrubberVisible(true)}
                onMouseLeave={() => { handleMouseLeave(); setScrubberVisible(false); }}
                onTouchStart={() => { if (playing) showScrubberBriefly(); }}
                style={{ position: "relative", width: "100%", paddingBottom: "56.25%", backgroundColor: "#0a0c0a", transformOrigin: "center center", transform: expanded ? "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)" : `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x === 0 && tilt.y === 0 ? 1 : 1.015})`, transition: "transform 0.7s cubic-bezier(0.23,1,0.32,1), box-shadow 0.7s ease", boxShadow: expanded ? "none" : tilt.x === 0 && tilt.y === 0 ? "0 8px 40px rgba(0,0,0,0.35)" : "0 24px 60px rgba(0,0,0,0.55)" }}
              >
                <iframe key={iframeKey} ref={iframeRef} src={videoSrc} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Approche" />

                {/* Bouton mute/unmute — coin haut gauche */}
                {playing && !mobileCinema && (
                  <button
                    onClick={handleMuteToggle}
                    style={{ position: "absolute", top: "0.75rem", left: "0.75rem", zIndex: 10, background: "rgba(8,9,8,0.65)", border: "1px solid rgba(200,207,196,0.35)", color: "rgba(200,207,196,0.85)", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", borderRadius: "2px" }}
                  >
                    {muted ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <line x1="23" y1="9" x2="17" y2="15"/>
                        <line x1="17" y1="9" x2="23" y2="15"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                      </svg>
                    )}
                  </button>
                )}

                {/* Bouton Cinéma */}
                {isMobile && playing && !mobileCinema && (
                  <button onClick={(e) => { e.stopPropagation(); handleCinemaEnter(); }} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", zIndex: 10, background: "rgba(8,9,8,0.65)", border: "1px solid rgba(200,207,196,0.35)", color: "rgba(200,207,196,0.85)", cursor: "pointer", padding: "5px 10px", display: "flex", alignItems: "center", fontFamily: "var(--font-label)", fontSize: "9px", fontWeight: 200, letterSpacing: "0.15em", textTransform: "uppercase", backdropFilter: "blur(4px)" }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M0 0h4v1.5H1.5V4H0V0zm6 0h4v4H8.5V1.5H6V0zM0 6h1.5v2.5H4V10H0V6zm8.5 2.5H6V10h4V6H8.5v2.5z"/></svg>
                  </button>
                )}

                {/* Overlay play */}
                <div onClick={!playing ? handlePlay : undefined} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 2, background: "linear-gradient(135deg,rgba(8,10,8,0.45) 0%,rgba(8,10,8,0.15) 100%)", opacity: playing ? 0 : 1, pointerEvents: playing ? "none" : "auto", cursor: "pointer", transition: "opacity 0.4s ease" }} onMouseEnter={(e) => { if (!playing) e.currentTarget.style.background = "linear-gradient(135deg,rgba(8,10,8,0.6) 0%,rgba(8,10,8,0.25) 100%)"; }} onMouseLeave={(e) => { if (!playing) e.currentTarget.style.background = "linear-gradient(135deg,rgba(8,10,8,0.45) 0%,rgba(8,10,8,0.15) 100%)"; }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "1px solid rgba(240,236,228,0.6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.85rem", backdropFilter: "blur(4px)" }}>
                    <svg width="16" height="18" viewBox="0 0 16 18" fill="rgba(240,236,228,0.9)" style={{ marginLeft: "2px" }}><path d="M1 1l14 8L1 17V1z"/></svg>
                  </div>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", fontWeight: 200, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(240,236,228,0.9)" }}>Regarder</span>
                </div>

                {/* Fermer — desktop expanded */}
                {expanded && (
                  <button onClick={(e) => { e.stopPropagation(); handleCollapse(); }} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", fontFamily: "var(--font-label)", fontSize: "9px", fontWeight: 200, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", background: "none", border: "1px solid var(--line)", padding: "5px 10px", cursor: "pointer", transition: "color 0.2s, border-color 0.2s", zIndex: 10 }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--muted)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.borderColor = "var(--line)"; }}>
                    Fermer
                  </button>
                )}

                {/* Pause/play overlay */}
                {(expanded || (playing && isMobile && !mobileCinema)) && (
                  <div onClick={handlePauseToggle} style={{ position: "absolute", inset: 0, zIndex: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", transition: "background 0.2s ease" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.18)"; const i = e.currentTarget.querySelector(".pause-icon") as HTMLElement; if (i) i.style.opacity = "1"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; const i = e.currentTarget.querySelector(".pause-icon") as HTMLElement; if (i) i.style.opacity = "0"; }}>
                    {pauseIcon}
                  </div>
                )}

                {playing && !mobileCinema && scrubberBar(iframeRef)}
              </div>
            </RevealWrapper>
          </div>

          {/* ── TEXTE ── */}
          <div className="approche-text" style={{ flex: expanded ? "0 0 0%" : "1 1 0%", minWidth: 0, overflow: "hidden", paddingTop: "1rem", paddingRight: "2vw", transform: expanded ? "translateX(120%)" : "translateX(0)", opacity: expanded ? 0 : 1, pointerEvents: expanded ? "none" : "auto", transition: isCollapsing ? "flex 0.95s cubic-bezier(0.4,0,0.2,1), transform 0.85s cubic-bezier(0.4,0,0.2,1), opacity 0.75s ease 0.1s" : "flex 0.95s cubic-bezier(0.4,0,0.2,1), transform 0.85s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease" }}>
            <RevealWrapper delay={100}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
                <div style={{ width: "40px", height: "1px", background: "var(--muted)", opacity: 0.4 }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.55rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--muted)" }}>01 — approche</span>
              </div>
            </RevealWrapper>
            <RevealWrapper delay={180}>
              <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 400, fontSize: "clamp(3rem,4.2vw,3.6rem)", lineHeight: 1.12, color: "#f5f2eb", marginBottom: "2.5rem", maxWidth: "1100px", letterSpacing: "-0.015em" }}>
                Un langage singulier à la croisée de l&apos;organique et de l&apos;électronique
              </h2>
            </RevealWrapper>
            <RevealWrapper delay={260}>
              <p style={{ fontFamily: "Lora, serif", fontWeight: 400, fontSize: "1rem", color: "rgba(240,236,228,0.88)", lineHeight: 1.95, marginBottom: "2.5rem", maxWidth: "820px" }}>
                Nous composons une musique organique et texturée qui explore les tensions invisibles des personnages — une écriture douce et mélodique en surface, traversée par une noirceur sous-jacente, conçue pour révéler ce que l&apos;image ne montre pas.
              </p>
            </RevealWrapper>
            <RevealWrapper delay={340}>
              <div style={{ borderLeft: "1px solid rgba(240,236,228,0.35)", paddingLeft: "1.75rem", maxWidth: "780px" }}>
                <p style={{ fontFamily: "Cormorant Garamond, serif", fontWeight: 500, fontSize: "1.35rem", fontStyle: "italic", color: "#ffffff", lineHeight: 1.7, letterSpacing: "-0.01em" }}>
                  &ldquo;Une musique qui expose la fracture intérieure sous une apparente douceur.&rdquo;
                </p>
              </div>
            </RevealWrapper>
          </div>

        </div>
      </div>

      {/* ── CINEMA PORTAL ── */}
      {mounted && mobileCinema && createPortal(
        <div onClick={showControlsBriefly} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, height: "100dvh", zIndex: 9999, background: "#080908", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: cinemaVisible ? 1 : 0, transform: cinemaVisible ? "scale(1)" : "scale(0.92)", transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
          <button onClick={(e) => { e.stopPropagation(); handleCinemaExit(); }} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", fontFamily: "var(--font-label)", fontSize: "9px", fontWeight: 200, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", background: "none", border: "1px solid var(--line)", padding: "5px 10px", cursor: "pointer", zIndex: 10, opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? "auto" : "none", transition: "opacity 0.25s ease" }}>
            Fermer
          </button>
          {/* Mute/unmute cinéma */}
          <button
            onClick={(e) => { e.stopPropagation(); handleMuteToggle(e); }}
            style={{ position: "absolute", top: "1.25rem", left: "1.25rem", zIndex: 10, background: "rgba(8,9,8,0.65)", border: "1px solid rgba(200,207,196,0.35)", color: "rgba(200,207,196,0.85)", cursor: "pointer", padding: "7px", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", borderRadius: "2px", opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? "auto" : "none", transition: "opacity 0.25s ease" }}
          >
            {muted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          <div style={{ position: "relative", width: "min(100vw, calc(100dvh * 16 / 9))", height: "min(100dvh, calc(100vw * 9 / 16))" }} onClick={(e) => e.stopPropagation()}>
            <iframe key={cinemaIframeKey} ref={cinemaIframeRef} src={cinemaSrc} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Approche Cinéma" />
            <div onClick={handlePauseToggle} style={{ position: "absolute", inset: 0, zIndex: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent" }}>
              {pauseIcon}
            </div>
            {scrubberBar(cinemaIframeRef)}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

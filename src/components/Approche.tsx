"use client";

import { useState, useRef, useEffect } from "react";
import RevealWrapper from "./RevealWrapper";

const VIMEO_BASE =
  "https://player.vimeo.com/video/872893131?h=6ed5f18815&controls=0&title=0&byline=0&portrait=0&color=c8cfc4&dnt=1";

export default function Approche() {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const suppressScroll = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // Collapse on scroll (ignore le scroll déclenché par handlePlay)
  useEffect(() => {
    if (!expanded) return;
    const onScroll = () => {
      if (suppressScroll.current) return;
      handleCollapse();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [expanded]);

  function vimeoMessage(method: string) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ method }),
      "*"
    );
  }

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

    setPlaying(true);
    setPaused(false);
    if (!isMobile) setTimeout(() => setExpanded(true), 20);
    setTimeout(() => { suppressScroll.current = false; }, 1600);
  }

  function handlePauseToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (paused) {
      vimeoMessage("play");
      setPaused(false);
    } else {
      vimeoMessage("pause");
      setPaused(true);
    }
  }

  function handleCollapse() {
    vimeoMessage("pause");
    setExpanded(false);
    setPaused(false);
    setTimeout(() => {
      setPlaying(false);
    }, 950);
  }

  const videoSrc = playing ? VIMEO_BASE + "&autoplay=1" : VIMEO_BASE;

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
                onMouseLeave={handleMouseLeave}
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

                {/* Overlay play — avant le lancement */}
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

                {/* Overlay pause/play — visible quand la vidéo est lancée */}
                {(expanded || (playing && isMobile)) && (
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
                  </div>
                )}
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
              transition:
                "flex 0.95s cubic-bezier(0.4, 0, 0.2, 1), transform 0.85s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease",
              pointerEvents: expanded ? "none" : "auto",
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
    </section>
  );
}

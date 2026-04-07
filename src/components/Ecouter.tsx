"use client";

import { useState, useRef } from "react";
import RevealWrapper from "./RevealWrapper";
import SectionLabel from "./SectionLabel";
import AudioPlayer from "./AudioPlayer";

const tracks = [
  {
    title: "Dessiner Encore - Je suis Charlie ",
    subtitle: "Théâtre · 2026",
    src: "/audio/Je suis charlie.wav",
  },
  {
    title: "Le ballon de la liberté ",
    subtitle: "Série · 2024",
    src: "/audio/Le ballon de la liberté.wav",
  },
  {
    title: "Gorfou & Alabatros - Parades ",
    subtitle: "Documentaire · 2019",
    src: "/audio/Parades.wav",
  },
];

export default function Ecouter() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);

  function handlePlay(index: number) {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setActiveIndex(index);
  }

  return (
    <section
      ref={sectionRef}
      id="ecouter"
      className="py-24"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div style={{ width: "100%", padding: "0 4vw" }}>
        <div className="ecouter-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}>

          {/* COLONNE GAUCHE — extraits actuels */}
          <div>
            <RevealWrapper delay={0}>
              <SectionLabel label="02 — écouter" />
            </RevealWrapper>


            <div>
              {tracks.map((track, i) => (
                <RevealWrapper key={track.src} delay={160 + i * 100}>
                  <AudioPlayer
                    index={i}
                    title={track.title}
                    subtitle={track.subtitle}
                    src={track.src}
                    isActive={activeIndex === i}
                    onPlay={() => handlePlay(i)}
                  />
                </RevealWrapper>
              ))}
            </div>

            {/* Last separator */}
            <div style={{ borderTop: "1px solid var(--line)", marginTop: "0", paddingTop: "2.5rem" }} />

            <RevealWrapper delay={500}>
              <a
                href="https://open.spotify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-inter inline-flex items-center gap-3 transition-colors duration-200"
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 200,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  fontStyle: "normal",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Écouter sur Spotify
              </a>
            </RevealWrapper>
          </div>

          {/* COLONNE DROITE — réservée pour 3 nouveaux extraits */}
          <div />

        </div>
      </div>
    </section>
  );
}

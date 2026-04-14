"use client";

import { useState, useRef } from "react";
import RevealWrapper from "./RevealWrapper";
import SectionLabel from "./SectionLabel";
import AudioPlayer from "./AudioPlayer";
import { type AudioTrack } from "@/data/audio";

interface EcouterProps {
  tracks: AudioTrack[];
  extraTracks: AudioTrack[];
}

export default function Ecouter({ tracks, extraTracks }: EcouterProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showExtra, setShowExtra] = useState(false);
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

            {/* Extra tracks — mobile uniquement, après le 3e morceau */}
            <div className={showExtra ? "ecouter-extra-mobile ecouter-extra-mobile-visible" : "ecouter-extra-mobile"}>
              {extraTracks.map((track, i) => {
                const index = tracks.length + i;
                return (
                  <RevealWrapper key={`mobile-${track.src}`} delay={160}>
                    <AudioPlayer
                      index={index}
                      title={track.title}
                      subtitle={track.subtitle}
                      src={track.src}
                      isActive={activeIndex === index}
                      onPlay={() => handlePlay(index)}
                    />
                  </RevealWrapper>
                );
              })}
            </div>

            {/* Bouton "Écouter plus" — mobile uniquement */}
            {!showExtra && (
              <button
                className="ecouter-more-btn"
                onClick={() => setShowExtra(true)}
                style={{
                  display: "none", // affiché via CSS sur mobile
                  width: "100%",
                  marginTop: "1.25rem",
                  marginBottom: "0.5rem",
                  padding: "0.75rem",
                  background: "transparent",
                  border: "1px solid var(--line)",
                  color: "var(--muted)",
                  fontFamily: "var(--font-label)",
                  fontSize: "8px",
                  fontWeight: 200,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "color 0.2s, border-color 0.2s",
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
                + Écouter plus
              </button>
            )}

            {/* Last separator */}
            <div style={{ borderTop: "1px solid var(--line)", marginTop: "0", paddingTop: "2.5rem" }} />

            <RevealWrapper delay={500}>
              <div className="streaming-links" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "1.5rem" }}>
                {[
                  {
                    href: "https://open.spotify.com/intl-fr/artist/1tY9ToP9utLYCAFg6uaRd2?si=4sfs8tjqRxWQ5E4DkjO2Sg",
                    label: "Spotify",
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                      </svg>
                    ),
                  },
                  {
                    href: "https://link.deezer.com/s/32VxqTJmSJgvy6QXe6Kbf",
                    label: "Deezer",
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M18.81 4.16v1.73H24V4.16zm0 3.61v1.73H24V7.77zm0 3.61v1.73H24v-1.73zm-6.28 3.6v1.74h5.19v-1.74zm0 3.61v1.73h5.19v-1.73zM6.28 18.2v1.73h5.19V18.2zm-6.28 0v1.73h5.19V18.2zm6.28-3.61v1.74h5.19v-1.74zm-6.28 0v1.74h5.19v-1.74zm6.28-3.61v1.73h5.19v-1.73zm12.53 0v1.73H24v-1.73z" />
                      </svg>
                    ),
                  },
                  {
                    href: "https://music.apple.com/fr/artist/valentin-marinelli/1195845946",
                    label: "Apple Music",
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.769-.75c-.69-.144-1.392-.204-2.083-.204H6.278C5.587 0 4.884.060 4.195.204a5.022 5.022 0 0 0-1.768.75C1.31 1.684.565 2.684.248 3.994A9.23 9.23 0 0 0 .008 6.184C0 6.445 0 6.71 0 6.97v10.06c0 .26 0 .524.008.785a9.23 9.23 0 0 0 .24 2.19c.317 1.31 1.062 2.31 2.18 3.043a5.022 5.022 0 0 0 1.769.75c.69.144 1.392.204 2.083.204h11.444c.69 0 1.394-.06 2.083-.204a5.022 5.022 0 0 0 1.769-.75c1.118-.734 1.863-1.734 2.18-3.043a9.23 9.23 0 0 0 .24-2.19c.007-.26.007-.525.007-.785V6.97c0-.26 0-.525-.007-.846zM15.006 9.74l-4.99 2.88V7.5l4.99 2.24z" />
                      </svg>
                    ),
                  },
                  {
                    href: "https://s.disco.ac/oewhndxuwgwr",
                    label: "Disco.ac",
                    icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                      </svg>
                    ),
                  },
                ].map(({ href, label, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      fontSize: "0.65rem",
                      fontWeight: 200,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      fontStyle: "normal",
                      fontFamily: "'Inter', sans-serif",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                  >
                    {icon}
                    {label}
                  </a>
                ))}
              </div>
            </RevealWrapper>
          </div>

          {/* COLONNE DROITE — extraits supplémentaires */}
          <div className={showExtra ? "ecouter-extra-col ecouter-extra-visible" : "ecouter-extra-col"} style={{ paddingTop: "calc(3rem + 15px)" }}>
            {extraTracks.map((track, i) => {
              const index = tracks.length + i;
              return (
                <RevealWrapper key={track.src} delay={160 + i * 100}>
                  <AudioPlayer
                    index={index}
                    title={track.title}
                    subtitle={track.subtitle}
                    src={track.src}
                    isActive={activeIndex === index}
                    onPlay={() => handlePlay(index)}
                  />
                </RevealWrapper>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

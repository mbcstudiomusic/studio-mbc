"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import RevealWrapper from "./RevealWrapper";
import SectionLabel from "./SectionLabel";
import { type Project } from "@/data/projets";
import { getLinkMeta } from "@/lib/linkMeta";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="carousel-card cursor-pointer"
      style={{ width: "calc((100vw - 9rem) / 4)", flexShrink: 0, border: "1px solid var(--line)", minWidth: "180px" }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          backgroundColor: "#0f110f",
          overflow: "hidden",
        }}
      >
        <div
          role="img"
          aria-label={`${project.title} — musique originale de Valentin Marinelli & Clément Barbier`}
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: `url('${project.poster.replace(/\.(jpg|jpeg)$/i, ".webp")}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: hovered ? "brightness(0.45)" : "brightness(0.8)",
            transition: "filter 0.3s ease",
          }}
        />

        {/* Hover: view indicator */}
        {hovered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-label)",
                fontSize: "0.55rem",
                fontWeight: 200,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent)",
                fontStyle: "normal",
              }}
            >
              Voir le projet
            </span>
          </div>
        )}
      </div>

      {/* Barre de finition sous le poster */}
      <div style={{ height: "1px", backgroundColor: "var(--line)" }} />

      {/* Text below poster */}
      <div style={{ padding: "0.75rem" }}>
        <p
          style={{
            fontFamily: "var(--font-label)",
            fontSize: "0.55rem",
            fontWeight: 200,
            fontStyle: "normal",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "0.35rem",
          }}
        >
          {project.type}
        </p>
        <p
          style={{
            fontFamily: "var(--font-title)",
            fontWeight: 300,
            fontSize: "1rem",
            color: "var(--text)",
            lineHeight: 1.2,
            marginBottom: "0.25rem",
          }}
        >
          {project.title}
        </p>
        {project.production && (
          <p
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "0.7rem",
              fontWeight: 200,
              fontStyle: "normal",
              color: "var(--muted)",
            }}
          >
            {project.production}
          </p>
        )}
      </div>
    </div>
  );
}

interface OverlayProps {
  project: Project;
  onClose: () => void;
  isClosing: boolean;
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-label)",
  fontSize: "8px",
  fontWeight: 200,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  display: "block",
  marginBottom: "0.4rem",
};

const valueStyle: React.CSSProperties = {
  fontFamily: "var(--font-label)",
  fontSize: "0.75rem",
  fontWeight: 200,
  color: "var(--text)",
  display: "block",
  marginBottom: "0.75rem",
};

const linkBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-label)",
  fontSize: "8px",
  fontWeight: 200,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "var(--muted)",
  textDecoration: "none",
  border: "1px solid var(--line)",
  padding: "5px 12px",
  transition: "color 0.2s, border-color 0.2s",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
};

function ProjectOverlay({ project, onClose, isClosing }: OverlayProps) {
  const initial = project.title.charAt(0).toUpperCase();
  const [visible, setVisible] = useState(false);
  const touchStartY = useRef<number>(0);
  const touchStartOnSynopsis = useRef<boolean>(false);
  const synopsisRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Bloquer le scroll du body
  // Sur mobile (touch) : position:fixed pour iOS Safari sinon le fond défile
  // Sur desktop : overflow:hidden suffit, pas de position:fixed (évite le saut au démontage)
  useEffect(() => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const scrollY = window.scrollY;
    if (isTouchDevice) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      return () => {
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    } else {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, []);

  // touchmove non-passif : empêche le scroll du fond sauf si on est sur le synopsis
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    function onTouchMove(e: TouchEvent) {
      if (synopsisRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
    }
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchStartOnSynopsis.current = !!synopsisRef.current?.contains(e.target as Node);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartOnSynopsis.current) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 80) onClose();
  }

  const active = visible && !isClosing;

  return (
    <div
      onClick={onClose}
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: active ? "rgba(4,6,4,0.88)" : "rgba(4,6,4,0)",
        backdropFilter: active ? "blur(12px) saturate(1.2)" : "blur(0px) saturate(1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 4vw",
        transition: "background-color 0.45s ease, backdrop-filter 0.45s ease",
      }}
    >
      <div
        ref={innerRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="modal-inner"
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          maxWidth: "860px",
          width: "100%",
          maxHeight: "92vh",
          overflow: "hidden",
          border: "1px solid var(--line)",
          transform: active ? "scale(1) translateY(0px)" : "scale(0.88) translateY(48px)",
          opacity: active ? 1 : 0,
          transition: active
            ? "transform 0.52s cubic-bezier(0.34, 1.18, 0.64, 1), opacity 0.38s ease"
            : "transform 0.38s cubic-bezier(0.4, 0, 1, 1), opacity 0.28s ease",
        }}
      >
        {/* ── Left column ── */}
        <div
          className="modal-image-col"
          style={{
            backgroundColor: "#080908",
            display: "flex",
            flexDirection: "column",
            padding: "1.25rem",
            overflow: "hidden",
            minHeight: "400px",
            gap: "0.75rem",
          }}
        >
          {/* Genre badge */}
          <span
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "8px",
              fontWeight: 200,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--muted)",
              border: "1px solid var(--line)",
              padding: "4px 8px",
              alignSelf: "flex-start",
              position: "relative",
              zIndex: 1,
            }}
          >
            {project.type}
          </span>

          {/* A4 image (if provided) */}
          {project.image ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.75rem",
                minHeight: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.image.replace(/\.(jpg|jpeg)$/i, ".webp")}
                alt={project.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  border: "1px solid var(--line)",
                  opacity: 0.9,
                }}
              />
            </div>
          ) : (
            /* Watermark initial when no image */
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <span
                style={{
                  position: "absolute",
                  bottom: "-1.5rem",
                  right: "-0.5rem",
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: "9rem",
                  color: "#141814",
                  lineHeight: 1,
                  pointerEvents: "none",
                  userSelect: "none",
                  textTransform: "uppercase",
                }}
              >
                {initial}
              </span>
            </div>
          )}

          {/* Year */}
          <span
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 200,
              fontSize: "2.5rem",
              color: "#1e221e",
              lineHeight: 1,
            }}
          >
            {project.year}
          </span>
        </div>

        {/* ── Right column ── */}
        <div
          className="modal-right-col"
          style={{
            backgroundColor: "var(--surface)",
            padding: "2rem",
            position: "relative",
            overflowY: "auto",
            maxHeight: "92vh",
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="modal-close-btn"
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

          {/* Type · Année */}
          <span style={{ ...labelStyle, marginBottom: "0.5rem" }}>
            {project.type} · {project.year}
          </span>

          {/* Titre */}
          <h2
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 300,
              fontSize: "2rem",
              color: "var(--text)",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
            }}
          >
            {project.title}
          </h2>

          <div style={{ borderTop: "1px solid var(--line)", marginBottom: "1.25rem" }} />

          {/* Synopsis */}
          <span style={labelStyle}>Synopsis</span>
          <div
            ref={synopsisRef}
            className="modal-synopsis"
            style={{
              maxHeight: "160px",
              overflowY: "auto",
              marginBottom: "1.5rem",
              paddingRight: "0.5rem",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontStyle: "italic",
                fontSize: "0.85rem",
                color: "var(--muted)",
                lineHeight: 1.8,
              }}
            >
              {project.synopsis}
            </p>
          </div>

          <div style={{ borderTop: "1px solid var(--line)", marginBottom: "1.25rem" }} />

          {project.realisateur && (
            <>
              <span style={{ ...labelStyle, fontWeight: 400 }}>{project.type === "Théâtre" ? "Mise en scène" : "Réalisation"}</span>
              <span style={valueStyle}>{project.realisateur}</span>
            </>
          )}

          {project.production && (
            <>
              <span style={{ ...labelStyle, fontWeight: 400 }}>Production</span>
              <span style={valueStyle}>{project.production}</span>
            </>
          )}

          <span style={{ ...labelStyle, fontWeight: 400 }}>Musique</span>
          <span style={{ ...valueStyle, marginBottom: "1.5rem" }}>Valentin <span style={{ textTransform: "uppercase" }}>Marinelli</span> &amp; Clément <span style={{ textTransform: "uppercase" }}>Barbier</span></span>

          {/* Distinctions — si remplies */}
          {project.distinctions && (
            <>
              <div style={{ borderTop: "1px solid var(--line)", marginBottom: "1.25rem" }} />
              <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Distinctions</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                {project.distinctions.split("|").map((d, i) => (
                  <span
                    key={i}
                    style={{ ...linkBtnStyle, cursor: "default" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.color = "var(--text)";
                      (e.currentTarget as HTMLSpanElement).style.borderColor = "var(--muted)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)";
                      (e.currentTarget as HTMLSpanElement).style.borderColor = "var(--line)";
                    }}
                  >
                    {d.trim()}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Liens — uniquement si renseignés */}
          {(project.trailer || project.imdb) && (
            <>
              <div style={{ borderTop: "1px solid var(--line)", marginBottom: "1.25rem" }} />
              <span style={{ ...labelStyle, marginBottom: "0.75rem" }}>Liens</span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                {[project.trailer, project.imdb].filter(Boolean).map((url) => {
                  const { label } = getLinkMeta(url!);
                  return (
                    <a
                      key={url}
                      href={url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ ...linkBtnStyle, color: "var(--text)", borderColor: "var(--muted)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)";
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--text)";
                        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--muted)";
                      }}
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projets({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState<Project | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const infiniteProjects = useMemo(() => [...projects, ...projects, ...projects], [projects]);

  // Positionner sur la copie du milieu au montage
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth / 3;
    });
  }, [projects]);

  // Saut silencieux quand on approche des bords
  function handleScroll() {
    const el = carouselRef.current;
    if (!el) return;
    const oneSetWidth = el.scrollWidth / 3;
    if (el.scrollLeft < oneSetWidth * 0.2) {
      el.scrollLeft += oneSetWidth;
    } else if (el.scrollLeft > oneSetWidth * 1.8) {
      el.scrollLeft -= oneSetWidth;
    }
  }

  function scrollBy(dir: 1 | -1) {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.75), behavior: "smooth" });
  }

  function openProject(project: Project) {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setIsClosing(false);
    setSelected(project);
    window.history.pushState(null, "", `/projets/${project.slug}`);
  }

  function closeProject() {
    setIsClosing(true);
    setTimeout(() => {
      setSelected(null);
      setIsClosing(false);
      window.history.pushState(null, "", "/");
    }, 400);
  }

  useEffect(() => {
    function onPopState() {
      closeProject();
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="projets"
      className="py-24"
      style={{
        backgroundColor: "var(--surface)",
        borderTop: "1px solid var(--line)",
      }}
    >
      {/* Header + flèches */}
      <div style={{ padding: "0 4vw", marginBottom: "2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <RevealWrapper delay={0}>
          <SectionLabel label="03 — projets" />
        </RevealWrapper>

        <RevealWrapper delay={80}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {/* Flèche gauche */}
            <button
              onClick={() => scrollBy(-1)}
              style={{
                width: "36px",
                height: "36px",
                border: "1px solid var(--line)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--muted)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
            >
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="var(--muted)" strokeWidth="1">
                <polyline points="5,1 1,5 5,9" />
                <line x1="1" y1="5" x2="11" y2="5" />
              </svg>
            </button>

            {/* Flèche droite */}
            <button
              onClick={() => scrollBy(1)}
              style={{
                width: "36px",
                height: "36px",
                border: "1px solid var(--line)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "border-color 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--muted)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
            >
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="var(--muted)" strokeWidth="1">
                <polyline points="7,1 11,5 7,9" />
                <line x1="11" y1="5" x2="1" y2="5" />
              </svg>
            </button>
          </div>
        </RevealWrapper>
      </div>

      {/* Carousel + fondus latéraux */}
      <RevealWrapper delay={160} className="w-full">
        <div style={{ position: "relative" }}>
          {/* Fondu gauche */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: "4vw", zIndex: 1, pointerEvents: "none",
            background: "linear-gradient(to right, var(--surface), transparent)",
          }} />
          {/* Fondu droite */}
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: "6vw", zIndex: 1, pointerEvents: "none",
            background: "linear-gradient(to left, var(--surface), transparent)",
          }} />

          <div
            ref={carouselRef}
            className="carousel-track"
            style={{ padding: "0 4vw" }}
            onScroll={handleScroll}
          >
            {infiniteProjects.map((project, idx) => (
              <ProjectCard
                key={`${idx}-${project.title}-${project.year}`}
                project={project}
                onClick={() => openProject(project)}
              />
            ))}
          </div>
        </div>
      </RevealWrapper>

      {/* Overlay */}
      {selected && (
        <ProjectOverlay project={selected} onClose={closeProject} isClosing={isClosing} />
      )}
    </section>
  );
}

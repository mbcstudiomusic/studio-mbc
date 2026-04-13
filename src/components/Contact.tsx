"use client";

import { useState, useRef, useEffect } from "react";
import RevealWrapper from "./RevealWrapper";
import SectionLabel from "./SectionLabel";

const projectTypes = [
  "Fiction",
  "Documentaire",
  "Spectacle vivant / Théâtre",
  "Animation",
  "Autre",
];

function CustomSelect({ name, value, onChange }: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const baseStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.8rem",
    fontWeight: 200,
    color: value ? "var(--text)" : "var(--muted)",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Champ affiché */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...baseStyle,
          width: "100%",
          borderBottom: `1px solid ${open ? "var(--accent)" : "var(--line)"}`,
          padding: "0.75rem 1.5rem 0.75rem 0",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "border-color 0.2s ease",
          userSelect: "none",
        }}
      >
        <span>{value || "Sélectionner..."}</span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{ flexShrink: 0, transition: "transform 0.2s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M0 0l5 6 5-6z" fill="var(--muted)" />
        </svg>
      </div>

      {/* Liste déroulante */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            backgroundColor: "#0f110f",
            border: "1px solid var(--line)",
            zIndex: 10,
            animation: "fadeIn 0.15s ease forwards",
          }}
        >
          {projectTypes.map((t) => (
            <div
              key={t}
              onClick={() => { onChange(t); setOpen(false); }}
              style={{
                ...baseStyle,
                color: t === value ? "var(--text)" : "var(--muted)",
                padding: "0.65rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                transition: "color 0.15s ease, background-color 0.15s ease",
                backgroundColor: t === value ? "rgba(200,207,196,0.06)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(200,207,196,0.08)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = t === value ? "rgba(200,207,196,0.06)" : "transparent";
                e.currentTarget.style.color = t === value ? "var(--text)" : "var(--muted)";
              }}
            >
              {t}
            </div>
          ))}
        </div>
      )}

      {/* Champ caché pour la soumission du formulaire */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [typeProjet, setTypeProjet] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("https://formspree.io/f/TONID", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setSubmitted(true);
        setTypeProjet("");
        form.reset();
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    fontStyle: "normal",
    fontSize: "0.55rem",
    fontWeight: 200,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "var(--muted)",
    display: "block",
    marginBottom: "0.5rem",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "1px solid var(--line)",
    padding: "0.75rem 0",
    color: "var(--text)",
    fontFamily: "'Lora', serif",
    fontStyle: "italic",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  return (
    <section
      id="contact"
      style={{
        backgroundColor: "var(--bg)",
        borderTop: "1px solid var(--line)",
        padding: "8rem 4vw 4rem",
      }}
    >
      {/* 2-column layout */}
      <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6rem", alignItems: "start" }}>

        {/* LEFT — texte */}
        <div>
          <RevealWrapper delay={0}>
            <SectionLabel label="05 — contact" />
          </RevealWrapper>

          <RevealWrapper delay={80}>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                color: "var(--text)",
                lineHeight: 1.05,
                marginBottom: "2rem",
                marginTop: "1.5rem",
              }}
            >
              Travaillons<br />ensemble
            </h2>
          </RevealWrapper>

          <RevealWrapper delay={160}>
            <p
              style={{
                fontFamily: "'Lora', serif",
                fontStyle: "italic",
                fontSize: "0.95rem",
                color: "var(--muted)",
                lineHeight: 1.9,
                marginBottom: "2.5rem",
                maxWidth: "420px",
              }}
            >
              Vous développez un projet de fiction, une série, un spectacle ou un film&nbsp;? Nous serions heureux d&apos;échanger sur votre univers et la façon dont la musique peut le servir.
            </p>
          </RevealWrapper>

          <RevealWrapper delay={220}>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.7rem",
                fontWeight: 200,
                letterSpacing: "0.1em",
                color: "var(--muted)",
                fontStyle: "normal",
                lineHeight: 1.7,
              }}
            >
              34 rue d&apos;Hauteville<br />75010 Paris
            </p>
          </RevealWrapper>
        </div>

        {/* RIGHT — formulaire */}
        <RevealWrapper delay={200}>
          {submitted ? (
            <div
              style={{
                padding: "3rem",
                border: "1px solid var(--line)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontSize: "1.4rem",
                  color: "var(--accent)",
                  marginBottom: "0.5rem",
                }}
              >
                Message envoyé
              </p>
              <p
                style={{
                  fontFamily: "'Lora', serif",
                  fontStyle: "italic",
                  fontSize: "0.9rem",
                  color: "var(--muted)",
                }}
              >
                Nous vous répondrons dans les meilleurs délais.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

              {/* Nom */}
              <div>
                <label htmlFor="name" style={labelStyle}>Nom</label>
                <input
                  id="name" name="name" type="text" required
                  placeholder="Votre nom"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                  id="email" name="email" type="email" required
                  placeholder="votre@email.com"
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                />
              </div>

              {/* Type de projet — dropdown custom */}
              <div>
                <label style={labelStyle}>Type de projet</label>
                <CustomSelect
                  name="type_projet"
                  value={typeProjet}
                  onChange={setTypeProjet}
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" style={labelStyle}>Message</label>
                <textarea
                  id="message" name="message" required rows={4}
                  placeholder="Décrivez votre projet..."
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                />
              </div>

              {/* Bouton */}
              <div>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.65rem",
                    fontWeight: 200,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    fontStyle: "normal",
                    color: "var(--accent)",
                    backgroundColor: "transparent",
                    padding: "0.85rem 2.4rem",
                    border: "1px solid var(--line)",
                    cursor: sending ? "not-allowed" : "pointer",
                    transition: "color 0.2s, border-color 0.2s",
                    opacity: sending ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!sending) {
                      e.currentTarget.style.color = "var(--text)";
                      e.currentTarget.style.borderColor = "var(--muted)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!sending) {
                      e.currentTarget.style.color = "var(--accent)";
                      e.currentTarget.style.borderColor = "var(--line)";
                    }
                  }}
                >
                  {sending ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            </form>
          )}
        </RevealWrapper>
      </div>

      {/* Footer */}
      <div className="contact-footer" style={{ borderTop: "1px solid var(--line)", paddingTop: "2rem", marginTop: "6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.6rem", fontWeight: 200, color: "var(--muted)", fontStyle: "normal", letterSpacing: "0.05em" }}>
          © {new Date().getFullYear()}{' '}Studio MBC — Valentin Marinelli &amp; Clément Barbier
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.6rem", fontWeight: 200, color: "var(--muted)", fontStyle: "normal", letterSpacing: "0.05em" }}>
          Compositeurs pour l&apos;image
        </p>
      </div>
    </section>
  );
}

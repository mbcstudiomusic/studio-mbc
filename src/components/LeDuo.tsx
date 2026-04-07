"use client";

import RevealWrapper from "./RevealWrapper";
import SectionLabel from "./SectionLabel";

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function ImdbIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="1" y="5" width="22" height="14" rx="2"/>
      <text x="12" y="15.5" fontSize="7" fontWeight="bold" textAnchor="middle" fill="#080908" fontFamily="Arial,sans-serif">IMDb</text>
    </svg>
  );
}

const distinctions = [
  "Prix spécial du jury — FIFALE Rabat",
  "Sél. Festival de La Rochelle 2023",
  "Lauréats Émergence Cinéma 2017",
  "Cannes Séries 2018",
  "NextStep 2018",
  "TRIO 2019",
];

const socialLink = (href: string, label: string, icon: React.ReactNode) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    style={{ color: "var(--muted)", transition: "color 0.2s", display: "flex" }}
    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
  >
    {icon}
  </a>
);

export default function LeDuo() {
  return (
    <section
      id="duo"
      style={{
        backgroundColor: "var(--bg)",
        padding: "3.5rem 4vw 2.5rem",
      }}
    >
      <RevealWrapper delay={0}>
        <SectionLabel label="04 — le duo" />
      </RevealWrapper>

      {/* Members grid */}
      <div className="duo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "2rem" }}>

        {/* Valentin */}
        <RevealWrapper delay={160}>
          <div>
            {/* Photo A4 centrée */}
            <div className="duo-photo-wrap">
              <div
                className="duo-photo"
                style={{
                  width: "min(353px, 100%)",
                  aspectRatio: "141/200",
                  backgroundImage: "url('/images/valentin.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  backgroundColor: "#080908",
                  boxShadow: "inset 0 0 0 1px var(--line)",
                }}
              />
            </div>

            {/* Nom */}
            <div style={{ marginBottom: "0.5rem", fontFamily: "'Cormorant Garamond', serif", display: "flex", alignItems: "baseline", gap: "0.4em", flexWrap: "wrap" }}>
              <span className="duo-firstname" style={{ fontWeight: 300, fontSize: "1.2rem", color: "var(--muted)" }}>Valentin</span>
              <span className="duo-lastname" style={{ fontWeight: 700, fontSize: "1.6rem", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Marinelli</span>
            </div>

            {/* Réseaux */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {socialLink("https://www.instagram.com/valval13/", "Instagram Valentin", <InstagramIcon />)}
              {socialLink("https://fr.linkedin.com/in/valentin-marinelli", "LinkedIn Valentin", <LinkedInIcon />)}
              {socialLink("https://www.imdb.com/fr/name/nm8016007/", "IMDb Valentin", <ImdbIcon />)}
            </div>

            <p className="font-lora" style={{ fontStyle: "italic", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8 }}>
              Violoniste de formation (1er prix du Conservatoire de Paris, Licence de musicologie à la Sorbonne), son parcours en musique de chambre et en orchestre l’amène à porter une attention particulière aux équilibres entre les voix et aux dynamiques d’ensemble. Des musiques classiques aux esthétiques contemporaines, jusqu’aux musiques du monde — notamment le tango argentin —, son parcours nourrit cette approche. Il accompagne également, en tant que violoniste, différents artistes tels que Étienne Daho, Jean-Jacques Goldman ou encore Thomas Jolly.
            </p>
          </div>
        </RevealWrapper>

        {/* Clément */}
        <RevealWrapper delay={240}>
          <div>
            {/* Photo A4 centrée */}
            <div className="duo-photo-wrap">
              <div
                className="duo-photo"
                style={{
                  width: "min(353px, 100%)",
                  aspectRatio: "141/200",
                  backgroundImage: "url('/images/clement.jpg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center top",
                  backgroundColor: "#080908",
                  boxShadow: "inset 0 0 0 1px var(--line)",
                }}
              />
            </div>

            {/* Nom */}
            <div style={{ marginBottom: "0.5rem", fontFamily: "'Cormorant Garamond', serif", display: "flex", alignItems: "baseline", gap: "0.4em", flexWrap: "wrap" }}>
              <span className="duo-firstname" style={{ fontWeight: 300, fontSize: "1.2rem", color: "var(--muted)" }}>Clément</span>
              <span className="duo-lastname" style={{ fontWeight: 700, fontSize: "1.6rem", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Barbier</span>
            </div>

            {/* Réseaux */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
              {socialLink("https://www.instagram.com/clem_barb_/", "Instagram Clément", <InstagramIcon />)}
              {socialLink("https://fr.linkedin.com/in/cl%C3%A9ment-barbier-b0022359", "LinkedIn Clément", <LinkedInIcon />)}
              {socialLink("https://www.imdb.com/fr/name/nm8667331/", "IMDb Clément", <ImdbIcon />)}
            </div>

            <p className="font-lora" style={{ fontStyle: "italic", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.8 }}>
              Guitariste et ingénieur du son de formation (ISTS/ESRA, Cégep Lionel-Groulx), son parcours l'amène à travailler le son comme une matière, attentif aux textures et aux transformations. Nourri par les musiques concrètes et acousmatiques, il développe une approche du studio comme espace de recherche et de composition. Habitué des scènes rock, il est également chanteur et guitariste du groupe Indigo Birds, avec lequel il a sorti deux albums.
            </p>
          </div>
        </RevealWrapper>
      </div>

      {/* Bio commune — 2 colonnes */}
      <RevealWrapper delay={300}>
        <div
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <p className="font-lora" style={{ fontStyle: "italic", fontSize: "1rem", color: "var(--text)", lineHeight: 1.9, marginBottom: "1rem" }}>
            Valentin Marinelli et Clément Barbier sont un duo de compositeurs de musique à l'image basé en France. Ils développent une musique au plus près des personnages, qui laisse apparaître ce qui se fissure sous la surface. Entre matière organique et textures électroniques, leur écriture conjugue douceur et tension pour révéler une dimension invisible du récit.
          </p>
          <p className="font-lora" style={{ fontStyle: "italic", fontSize: "1rem", color: "var(--text)", lineHeight: 1.9, marginBottom: "1rem" }}>
            Formé en 2016, le duo compose pour l'image en développant une approche centrée sur les trajectoires intérieures des personnages, attentive aux tensions, aux silences et aux déséquilibres qui les traversent. Leur musique fait émerger ce qui échappe au visible, en jouant des contrastes entre proximité et distance.
          </p>
          <p className="font-lora" style={{ fontStyle: "italic", fontSize: "1rem", color: "var(--text)", lineHeight: 1.9 }}>
            Issus respectivement de la musique classique et de l'ingénierie sonore, leur collaboration repose sur un dialogue constant entre écriture mélodique et recherche de matière. Ils développent un langage singulier mêlant instruments acoustiques détournés, textures électroniques et travail du grain, au service d'une approche sensible et incarnée.
          </p>
        </div>
      </RevealWrapper>

      {/* Distinctions — tags encadrés */}
      <RevealWrapper delay={360}>
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: "1.25rem" }}>
          <p
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "10px",
              fontWeight: 200,
              fontStyle: "normal",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "0.75rem",
            }}
          >
            distinctions
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
            {distinctions.map((d, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--font-label)",
                  fontSize: "9px",
                  fontWeight: 200,
                  fontStyle: "normal",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  border: "1px solid var(--line)",
                  padding: "5px 12px",
                  transition: "border-color 0.3s, color 0.3s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLSpanElement).style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLSpanElement).style.borderColor = "var(--line)";
                  (e.currentTarget as HTMLSpanElement).style.color = "var(--muted)";
                }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </RevealWrapper>
    </section>
  );
}

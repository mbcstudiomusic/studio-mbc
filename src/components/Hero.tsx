"use client";

export default function Hero() {
  return (
    <section id="hero">
      {/* Background photo */}
      <div
        className="hero-bg"
        role="img"
        aria-label="Valentin Marinelli et Clément Barbier, compositeurs de musique à l'image, dans leur studio parisien"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/hero.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.55,
        }}
      />

      {/* Vignette — darker left, gradient to right */}
      <div className="hero-vignette" />

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "180px",
          background: "linear-gradient(to bottom, transparent, #080908)",
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div className="hero-content">
        {/* Eyebrow label */}
        <p className="hero-eyebrow">Compositeurs · Musique à l&apos;image</p>

        {/* Title */}
        <h1 className="hero-title">
          <span className="line">
            <span className="t-light">Valentin </span>
            <span className="t-bold">Marinelli</span>
            <span className="t-amp">&amp;</span>
            <span className="hero-name-2">
              <span className="t-amp">&amp;</span>
              <span className="t-light">Clément </span>
              <span className="t-bold">Barbier</span>
            </span>
          </span>
        </h1>

        {/* Tagline */}
        <p className="hero-tagline">
          Duo de compositeurs pour l&apos;image — cordes et textures
          électroniques au service du cinéma, des séries et du théâtre.
        </p>

        {/* CTAs */}
        <div className="hero-ctas">
          <a href="#ecouter" className="cta-primary">Écouter</a>
          <a href="#contact" className="cta-secondary">Nous contacter</a>
        </div>
      </div>

      {/* Section number */}
      <span className="section-num">00</span>
    </section>
  );
}

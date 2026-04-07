"use client";

import { useEffect, useState } from "react";

const navLinks = [
  { label: "approche", href: "#approche" },
  { label: "écouter",  href: "#ecouter" },
  { label: "projets",  href: "#projets" },
  { label: "le duo",   href: "#duo" },
  { label: "contact",  href: "#contact" },
];

const instagramSvg = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function closeMenu() { setMenuOpen(false); }

  return (
    <>
      <nav
        id="nav"
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          padding: "1.25rem 4vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.5s, backdrop-filter 0.5s",
          backgroundColor: scrolled || menuOpen ? "rgba(8,9,8,0.95)" : "transparent",
          backdropFilter: scrolled && !menuOpen ? "blur(14px)" : "none",
          borderBottom: scrolled && !menuOpen ? "1px solid var(--line)" : "none",
        }}
      >
        {/* Logo */}
        <a
          href="#hero"
          onClick={closeMenu}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: "clamp(0.75rem, 2.2vw, 1rem)",
            color: "var(--accent)",
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          <span>Valentin </span>
          <strong style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Marinelli</strong>
          <span style={{ color: "var(--muted)", fontStyle: "italic", margin: "0 0.4em", fontWeight: 200 }}>&amp;</span>
          <span>Clément </span>
          <strong style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Barbier</strong>
        </a>

        {/* Desktop nav links + Instagram */}
        <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
          <ul style={{ gap: "2rem", listStyle: "none", alignItems: "center", display: "flex", margin: 0, padding: 0 }}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  style={{
                    fontSize: "10px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    textDecoration: "none",
                    transition: "color 0.3s",
                    fontFamily: "'Inter', sans-serif",
                    fontStyle: "normal",
                    fontWeight: 200,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="https://www.instagram.com/mbcstudiomusic/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Studio MBC"
            style={{ color: "var(--accent)", display: "flex", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
          >
            {instagramSvg}
          </a>
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            color: "var(--accent)",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            alignItems: "flex-end",
          }}
        >
          <span style={{
            display: "block", width: "22px", height: "1px", background: "currentColor",
            transition: "transform 0.3s, opacity 0.3s",
            transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
          }} />
          <span style={{
            display: "block", width: "15px", height: "1px", background: "currentColor",
            transition: "opacity 0.3s",
            opacity: menuOpen ? 0 : 1,
          }} />
          <span style={{
            display: "block", width: "22px", height: "1px", background: "currentColor",
            transition: "transform 0.3s, opacity 0.3s",
            transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
          }} />
        </button>
      </nav>

      {/* Mobile overlay menu */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          backgroundColor: "rgba(8,9,8,0.98)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2.5rem",
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transition: "opacity 0.35s ease",
        }}
      >
        {navLinks.map((link, i) => (
          <a
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            className="mobile-menu-link"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(1.8rem, 8vw, 2.8rem)",
              letterSpacing: "0.06em",
              color: "var(--text)",
              textDecoration: "none",
              transition: "color 0.2s, opacity 0.2s",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(12px)",
              transitionDelay: `${i * 0.04}s`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text)")}
          >
            {link.label}
          </a>
        ))}
        <a
          href="https://www.instagram.com/mbcstudiomusic/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          style={{ color: "var(--muted)", display: "flex", marginTop: "0.5rem", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          {instagramSvg}
        </a>
      </div>
    </>
  );
}

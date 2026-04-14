import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjects, getProjectBySlug, type Project } from "@/data/projets";
import { getLinkMeta } from "@/lib/linkMeta";

const SITE_URL = "https://studiombc.fr";

export const revalidate = 300;
export const dynamicParams = true; // génère à la demande les slugs ajoutés après déploiement

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const description = project.synopsis.slice(0, 160);

  return {
    title: `${project.title} — Studio MBC`,
    description,
    alternates: { canonical: `${SITE_URL}/projets/${project.slug}` },
    openGraph: {
      title: `${project.title} — Studio MBC`,
      description,
      url: `${SITE_URL}/projets/${project.slug}`,
      siteName: "Studio MBC",
      type: "website",
      locale: "fr_FR",
      images: [{
        url: `${SITE_URL}${project.poster}`,
        width: 1200,
        height: 675,
        alt: project.title,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — Studio MBC`,
      description,
      images: [`${SITE_URL}${project.poster}`],
    },
  };
}

export default async function ProjetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, allProjects] = await Promise.all([
    getProjectBySlug(slug),
    getProjects(),
  ]) as [Project | undefined, Project[]];
  if (!project) notFound();

  const currentIndex = allProjects.findIndex((p) => p.slug === slug);
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
  const nextProject = currentIndex < allProjects.length - 1 ? allProjects[currentIndex + 1] : null;

  const composers = [
    {
      "@type": "Person",
      name: "Valentin Marinelli",
      jobTitle: "Compositeur",
      memberOf: { "@type": "Organization", name: "Studio MBC", url: SITE_URL },
    },
    {
      "@type": "Person",
      name: "Clément Barbier",
      jobTitle: "Compositeur",
      memberOf: { "@type": "Organization", name: "Studio MBC", url: SITE_URL },
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    additionalType: "https://schema.org/MusicComposition",
    name: project.title,
    description: project.synopsis,
    dateCreated: String(project.year),
    genre: project.type,
    url: `${SITE_URL}/projets/${project.slug}`,
    image: `${SITE_URL}${project.poster}`,
    author: composers,
    contributor: composers,
    ...(project.realisateur && { director: { "@type": "Person", name: project.realisateur } }),
    ...(project.production && { productionCompany: { "@type": "Organization", name: project.production } }),
    ...(project.trailer && { sameAs: project.trailer }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--text)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nav */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "1.5rem 4vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--line)",
          backgroundColor: "rgba(8,9,8,0.9)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Link
          href="/#projets"
          style={{
            fontFamily: "var(--font-label)",
            fontSize: "0.6rem",
            fontWeight: 200,
            fontStyle: "normal",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--muted)",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
        >
          ← Retour
        </Link>
        <Link
          href="/"
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
        </Link>
      </header>

      {/* Barre prev/next — fixe sous le header */}
      <nav
        style={{
          position: "fixed",
          top: "4.25rem",
          left: 0,
          right: 0,
          zIndex: 9,
          padding: "0.6rem 4vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--line)",
          backgroundColor: "rgba(8,9,8,0.85)",
          backdropFilter: "blur(8px)",
        }}
      >
        {prevProject ? (
          <Link
            href={`/projets/${prevProject.slug}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textDecoration: "none",
              gap: "0.2rem",
            }}
          >
            <span style={{ fontFamily: "var(--font-label)", fontSize: "0.55rem", fontWeight: 200, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", transition: "color 0.2s" }}>← Précédent</span>
            <span className="project-nav-label" style={{ fontFamily: "var(--font-title)", fontSize: "0.85rem", fontWeight: 300, color: "var(--text)" }}>{prevProject.title}</span>
          </Link>
        ) : <span />}

        {nextProject ? (
          <Link
            href={`/projets/${nextProject.slug}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              textDecoration: "none",
              gap: "0.2rem",
            }}
          >
            <span style={{ fontFamily: "var(--font-label)", fontSize: "0.55rem", fontWeight: 200, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", transition: "color 0.2s" }}>Suivant →</span>
            <span className="project-nav-label" style={{ fontFamily: "var(--font-title)", fontSize: "0.85rem", fontWeight: 300, color: "var(--text)" }}>{nextProject.title}</span>
          </Link>
        ) : <span />}
      </nav>

      {/* Content */}
      <div
        className="project-page-wrapper"
        style={{
          flex: 1,
          padding: "12rem 4vw 6rem",
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          className="project-page-content"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "5rem",
          }}
        >
        {/* Poster */}
        <div
          className={`project-poster ${project.image ? "project-poster-portrait" : "project-poster-landscape"}`}
          style={{
            width: "260px",
            height: "370px",
            flexShrink: 0,
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#080908",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image || project.poster}
            alt={project.title}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              opacity: 0.9,
            }}
          />
        </div>

        {/* Text */}
        <div style={{ flex: 1, maxWidth: "580px" }}>
          {/* Type + year — Inter 200 */}
          <span
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "0.6rem",
              fontWeight: 200,
              fontStyle: "normal",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--muted)",
              display: "block",
              marginBottom: "1.25rem",
            }}
          >
            {project.type} · {project.year}
          </span>

          {/* Title — Cormorant Garamond 700 */}
          <h1
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 700,
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              color: "var(--text)",
              lineHeight: 1.0,
              marginBottom: "2rem",
            }}
          >
            {project.title}
          </h1>

          <div
            style={{
              width: "32px",
              height: "1px",
              backgroundColor: "var(--line)",
              marginBottom: "2rem",
            }}
          />

          {/* Synopsis */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              fontSize: "1rem",
              color: "var(--muted)",
              lineHeight: 1.9,
              marginBottom: "2rem",
            }}
          >
            {project.synopsis}
          </p>

          {/* Équipe + distinctions + liens */}
          {(() => {
            const label: React.CSSProperties = {
              fontFamily: "var(--font-label)", fontSize: "8px", fontWeight: 200,
              letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)",
              display: "block", marginBottom: "0.4rem",
            };
            const value: React.CSSProperties = {
              fontFamily: "var(--font-label)", fontSize: "0.75rem", fontWeight: 200,
              color: "var(--text)", display: "block", marginBottom: "0.75rem",
            };
            const linkBtn: React.CSSProperties = {
              fontFamily: "var(--font-label)", fontSize: "8px", fontWeight: 200,
              letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)",
              textDecoration: "none", border: "1px solid var(--line)", padding: "5px 12px",
              display: "inline-flex", alignItems: "center", gap: "0.4rem",
            };
            const divider = <div style={{ borderTop: "1px solid var(--line)", margin: "1.25rem 0" }} />;
            return (
              <div style={{ marginTop: "0.5rem" }}>
                {divider}
                {project.realisateur && (
                  <>
                    <span style={label}>{project.type === "Théâtre" ? "Mise en scène" : "Réalisation"}</span>
                    <span style={value}>{project.realisateur}</span>
                  </>
                )}
                {project.production && (
                  <>
                    <span style={label}>Production</span>
                    <span style={value}>{project.production}</span>
                  </>
                )}
                <span style={label}>Musique originale</span>
                <span style={value}>Valentin Marinelli &amp; Clément Barbier</span>

                {project.distinctions && (
                  <>
                    {divider}
                    <span style={{ ...label, marginBottom: "0.75rem" }}>Distinctions</span>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                      {project.distinctions.split("|").map((d, i) => (
                        <span key={i} style={{ ...linkBtn, cursor: "default" }}>{d.trim()}</span>
                      ))}
                    </div>
                  </>
                )}

                {divider}
                <span style={{ ...label, marginBottom: "0.75rem" }}>Liens</span>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {[project.trailer, project.imdb].filter(Boolean).map((url) => {
                    const { label: linkLabel, icon } = getLinkMeta(url!);
                    return (
                      <a key={url} href={url!} target="_blank" rel="noopener noreferrer" style={linkBtn}>
                        {icon}{linkLabel}
                      </a>
                    );
                  })}
                  {!project.trailer && !project.imdb && (
                    <span style={{ ...linkBtn, opacity: 0.3, cursor: "default" }}>— Aucun lien disponible</span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
        </div>
      </div>
    </main>
    </>
  );
}

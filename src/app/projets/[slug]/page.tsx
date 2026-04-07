import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjects, getProjectBySlug } from "@/data/projets";

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
    alternates: {
      canonical: `${SITE_URL}/projets/${project.slug}`,
    },
    openGraph: {
      title: `${project.title} — Studio MBC`,
      description,
      siteName: "Studio MBC",
      images: [{ url: `${SITE_URL}${project.poster}` }],
    },
  };
}

export default async function ProjetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: project.title,
    description: project.synopsis,
    dateCreated: String(project.year),
    genre: project.type,
    composer: [
      { "@type": "Person", name: "Valentin Marinelli" },
      { "@type": "Person", name: "Clément Barbier" },
    ],
    ...(project.realisateur && { director: { "@type": "Person", name: project.realisateur } }),
    ...(project.production && { productionCompany: { "@type": "Organization", name: project.production } }),
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
        <span
          style={{
            fontFamily: "var(--font-title)",
            fontSize: "0.85rem",
            fontWeight: 300,
            color: "var(--muted)",
            letterSpacing: "0.04em",
          }}
        >
          Studio <strong style={{ fontWeight: 700, textTransform: "uppercase" }}>MBC</strong>
        </span>
      </header>

      {/* Content */}
      <div
        className="project-page-content"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          padding: "10rem 4vw 6rem",
          gap: "5rem",
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Poster */}
        <div
          className="project-poster"
          style={{
            width: "260px",
            height: "370px",
            flexShrink: 0,
            backgroundImage: `url('${project.poster}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: "1px solid var(--line)",
          }}
        />

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

          {/* Équipe */}
          <p
            style={{
              fontFamily: "var(--font-label)",
              fontSize: "0.6rem",
              fontWeight: 200,
              fontStyle: "normal",
              letterSpacing: "0.1em",
              color: "var(--muted)",
              borderTop: "1px solid var(--line)",
              paddingTop: "1.25rem",
            }}
          >
            {project.realisateur}
          </p>
        </div>
      </div>
    </main>
    </>
  );
}

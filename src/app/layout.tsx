import type { Metadata } from "next";
import { Cormorant_Garamond, Lora, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  weight: ["300", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-title",
  display: "swap",
});

const lora = Lora({
  weight: ["400"],
  style: ["italic"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const inter = Inter({
  weight: ["200"],
  subsets: ["latin"],
  variable: "--font-label",
  display: "swap",
});

const SITE_URL = "https://studiombc.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Valentin Marinelli & Clément Barbier — Compositeurs de musique à l'image | Studio MBC",
    template: "%s | Valentin Marinelli & Clément Barbier",
  },
  description:
    "Valentin Marinelli et Clément Barbier, compositeurs de musique à l'image basés à Paris. Musique originale pour le cinéma, les séries, le théâtre, le documentaire et la publicité — Studio MBC.",
  keywords: [
    // Recherches principales
    "compositeur de musique à l'image",
    "compositeur musique à l'image",
    "compositeur",
    "compositeur Paris",
    "compositeur cinéma",
    "compositeur fiction",
    "compositeur court métrage",
    "compositeur long métrage",
    "compositeur documentaire",
    "compositeur théâtre",
    "compositeur pub",
    "compositeur publicité",
    "compositeur animation",
    "compositeur série",
    "compositeur série TV",
    "compositeur télévision",
    // Recherches anglaises (IA, casting international)
    "film composer France",
    "film composer Paris",
    "film scoring France",
    "original score composer",
    "music for film",
    // Intentions de recherche (trouver un compositeur)
    "trouver un compositeur pour un film",
    "musique originale pour film",
    "bande originale sur mesure",
    "musique de film sur mesure",
    "musique originale documentaire",
    "musique pour court métrage",
    // Noms propres
    "Valentin Marinelli",
    "Clément Barbier",
    "Studio MBC",
  ],
  authors: [
    { name: "Valentin Marinelli", url: SITE_URL },
    { name: "Clément Barbier", url: SITE_URL },
  ],
  creator: "Studio MBC",
  publisher: "Studio MBC",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: "Studio MBC",
    title: "Valentin Marinelli & Clément Barbier — Compositeurs de musique à l'image",
    description:
      "Valentin Marinelli et Clément Barbier, compositeurs de musique à l'image basés à Paris. Musique originale pour le cinéma, les séries et le théâtre.",
    images: [
      {
        url: `${SITE_URL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Studio MBC — Compositeurs musique à l'image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Valentin Marinelli & Clément Barbier — Compositeurs de musique à l'image",
    description:
      "Valentin Marinelli & Clément Barbier — Compositeurs de musique à l'image basés à Paris. Cinéma, séries, théâtre, documentaire.",
    images: [`${SITE_URL}/images/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // Entité principale : Valentin Marinelli
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#valentin-marinelli`,
      name: "Valentin Marinelli",
      givenName: "Valentin",
      familyName: "Marinelli",
      jobTitle: "Compositeur de musique à l'image",
      description:
        "Valentin Marinelli est compositeur de musique à l'image, basé à Paris. Violoniste formé au Conservatoire National Supérieur de Paris, il compose des musiques originales pour le cinéma, les séries, le théâtre et le documentaire. Il travaille en duo avec Clément Barbier.",
      url: SITE_URL,
      email: "contact@studiombc.fr",
      worksFor: { "@id": `${SITE_URL}/#studio-mbc` },
      sameAs: [
        "https://www.instagram.com/valentin_marinelli_",
        "https://www.imdb.com/name/nm8016007/",
        "https://fr.linkedin.com/in/valentin-marinelli",
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "34 rue d'Hauteville",
        postalCode: "75010",
        addressLocality: "Paris",
        addressCountry: "FR",
      },
    },
    // Entité principale : Clément Barbier
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#clement-barbier`,
      name: "Clément Barbier",
      givenName: "Clément",
      familyName: "Barbier",
      jobTitle: "Compositeur de musique à l'image",
      description:
        "Clément Barbier est compositeur de musique à l'image, basé à Paris. Il compose des musiques originales pour le cinéma, les séries, le théâtre, le documentaire et la publicité. Il travaille en duo avec Valentin Marinelli.",
      url: SITE_URL,
      email: "contact@studiombc.fr",
      worksFor: { "@id": `${SITE_URL}/#studio-mbc` },
      sameAs: [
        "https://www.instagram.com/clem_barb_/",
        "https://www.imdb.com/name/nm8667331/",
        "https://fr.linkedin.com/in/clément-barbier-b0022359",
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "34 rue d'Hauteville",
        postalCode: "75010",
        addressLocality: "Paris",
        addressCountry: "FR",
      },
    },
    // Studio MBC : marque/structure des deux compositeurs
    {
      "@type": "MusicGroup",
      "@id": `${SITE_URL}/#studio-mbc`,
      name: "Studio MBC",
      url: SITE_URL,
      description:
        "Studio MBC est le studio de création musicale de Valentin Marinelli et Clément Barbier, compositeurs de musique à l'image basés à Paris.",
      member: [
        { "@id": `${SITE_URL}/#valentin-marinelli` },
        { "@id": `${SITE_URL}/#clement-barbier` },
      ],
      sameAs: ["https://www.instagram.com/mbcstudiomusic/"],
    },
    // Site web
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Studio MBC",
      description:
        "Site officiel de Valentin Marinelli et Clément Barbier, compositeurs de musique à l'image — studiombc.fr",
      inLanguage: "fr-FR",
      author: [
        { "@id": `${SITE_URL}/#valentin-marinelli` },
        { "@id": `${SITE_URL}/#clement-barbier` },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${lora.variable} ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

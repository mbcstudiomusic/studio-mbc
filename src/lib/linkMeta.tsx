import React from "react";

export interface LinkMeta {
  label: string;
  icon: React.ReactNode;
}

function IconIMDb() {
  return (
    <svg width="28" height="14" viewBox="0 0 28 14" fill="none" aria-hidden="true">
      <rect width="28" height="14" rx="2" fill="#F5C518" />
      <text x="4" y="11" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#000000" letterSpacing="0.3">IMDb</text>
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
      <path d="M15.67 1.87C15.5.96 14.85.26 14 .1 12.05 0 8 0 8 0S3.95 0 2 .1C1.15.26.5.96.33 1.87.17 2.78.17 4.67.17 6s0 3.22.16 4.13C.5 11.04 1.15 11.74 2 11.9 3.95 12 8 12 8 12s4.05 0 6-.1c.85-.16 1.5-.86 1.67-1.77.16-.91.16-2.8.16-4.13 0-1.33 0-3.22-.16-4.13zM6.4 8.57V3.43L10.67 6 6.4 8.57z"/>
    </svg>
  );
}

function IconVimeo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 12.3C4.603 9.713 3.834 8.419 3.01 8.419c-.169 0-.752.354-1.755 1.056L0 8.138c1.expected-.854 1.709-1.701 2.558-2.532 1.13-1.099 1.98-1.677 2.561-1.735 1.355-.13 2.188.793 2.509 2.76.338 2.103.573 3.407.705 3.919.392 1.778.822 2.666 1.297 2.666.366 0 .917-.577 1.652-1.731.733-1.154 1.128-2.035 1.176-2.641.104-.995-.287-1.494-1.175-1.494-.419 0-.851.095-1.297.285 1.016-3.328 2.964-4.945 5.843-4.852 2.138.063 3.144 1.446 3.019 4.153z"/>
    </svg>
  );
}

function IconAllocine() {
  // Clapperboard icon as generic cinema
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4zm0 2h16v3H4V4zm2 1l1.5 1L9 5l1.5 1L12 5l1.5 1L15 5l1.5 1L18 5v1H6V5zm-2 4h16v11H4V9z"/>
    </svg>
  );
}

function IconArte() {
  return (
    <svg width="30" height="14" viewBox="0 0 30 14" fill="none" aria-hidden="true">
      <rect width="30" height="14" rx="2" fill="#E8190A" />
      <text x="5" y="11" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#FFFFFF" letterSpacing="0.5">ARTE</text>
    </svg>
  );
}

function IconFranceTV() {
  return (
    <svg width="30" height="14" viewBox="0 0 30 14" fill="none" aria-hidden="true">
      <rect width="30" height="14" rx="2" fill="#003189" />
      <text x="3" y="11" fontFamily="Arial, sans-serif" fontSize="7.5" fontWeight="700" fill="#FFFFFF" letterSpacing="0.2">france.tv</text>
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

export function getLinkMeta(url: string): LinkMeta {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");

    if (hostname.includes("imdb.com"))        return { label: "IMDb",         icon: <IconIMDb /> };
    if (hostname.includes("youtube.com") ||
        hostname.includes("youtu.be"))        return { label: "YouTube",      icon: <IconYouTube /> };
    if (hostname.includes("vimeo.com"))       return { label: "Vimeo",        icon: <IconVimeo /> };
    if (hostname.includes("allocine.fr"))     return { label: "Allociné",     icon: <IconAllocine /> };
    if (hostname.includes("arte.tv"))         return { label: "Arte",         icon: <IconArte /> };
    if (hostname.includes("france.tv") ||
        hostname.includes("francetv"))        return { label: "France TV",    icon: <IconFranceTV /> };
  } catch {
    // url invalide → fallback
  }
  return { label: "Voir", icon: <IconLink /> };
}

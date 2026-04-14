export function getLinkLabel(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");

    if (hostname.includes("imdb.com"))                    return "IMDb";
    if (hostname.includes("youtube.com") ||
        hostname.includes("youtu.be"))                    return "YouTube";
    if (hostname.includes("vimeo.com"))                   return "Vimeo";
    if (hostname.includes("allocine.fr"))                 return "Allociné";
    if (hostname.includes("arte.tv"))                     return "Arte";
    if (hostname.includes("france.tv") ||
        hostname.includes("francetv"))                    return "France TV";
    if (hostname.includes("lepic") ||
        hostname.includes("theatrelepic"))                return "Théâtre Lepic";
    if (hostname.includes("cinematheque"))                return "Cinémathèque";
    if (hostname.includes("cnc.fr"))                      return "CNC";

    // Dernier recours : nom de domaine propre (ex: "monsite.fr" → "Monsite")
    const name = hostname.split(".")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Lien";
  }
}

// Compat avec l'ancien import { getLinkMeta } — retourne juste le label, pas d'icône
export function getLinkMeta(url: string): { label: string } {
  return { label: getLinkLabel(url) };
}

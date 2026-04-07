import fs from "fs";
import path from "path";

export interface Project {
  slug: string;
  title: string;
  year: number;
  type: string;
  poster: string;
  image: string;
  synopsis: string;
  realisateur: string;
  production: string;
  trailer: string;
  imdb: string;
}

function splitCSVLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(content: string, sep: string): Project[] {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const headers = splitCSVLine(lines[0], sep);
  const projects: Project[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCSVLine(line, sep);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] ?? "").trim();
    });

    if (!row["slug"]) continue;

    projects.push({
      slug: row["slug"],
      title: row["title"] ?? "",
      year: parseInt(row["year"]) || 0,
      type: row["type"] ?? "",
      // accepte "poster" (Google Sheets) ou "poster carousel" (ancien CSV local)
      poster: row["poster"] ?? row["poster carousel"] ?? "",
      image: row["image"] ?? row["affiche film"] ?? "",
      synopsis: row["synopsis"] ?? "",
      realisateur: row["realisateur"] ?? "",
      production: row["production"] ?? "",
      trailer: row["trailer"] ?? "",
      imdb: row["imdb"] ?? "",
    });
  }

  return projects;
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function getProjects(): Promise<Project[]> {
  if (SHEET_ID && !SHEET_ID.startsWith("REMPLACER")) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) throw new Error(`Google Sheets fetch failed: ${res.status}`);
      const text = await res.text();
      return parseCSV(text, ",");
    } catch (err) {
      console.warn("Google Sheets fetch failed, falling back to local CSV:", err);
    }
  }

  // Fallback local CSV (dev ou si Google Sheets inaccessible)
  const csvPath = path.join(process.cwd(), "content", "projets.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  return parseCSV(content, ";");
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug);
}

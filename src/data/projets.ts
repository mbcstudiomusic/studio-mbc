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

function parseCSVRows(content: string, sep: string): string[][] {
  // Parse propre : gère les champs entre guillemets contenant des sauts de ligne
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === sep && !inQuotes) {
      current.push(field);
      field = "";
    } else if ((ch === "\n" || (ch === "\r" && next === "\n")) && !inQuotes) {
      if (ch === "\r") i++;
      current.push(field);
      field = "";
      rows.push(current);
      current = [];
    } else if (ch === "\r" && !inQuotes) {
      current.push(field);
      field = "";
      rows.push(current);
      current = [];
    } else {
      field += ch;
    }
  }
  if (field || current.length) {
    current.push(field);
    if (current.some(f => f.trim())) rows.push(current);
  }

  return rows;
}

function parseCSV(content: string, sep: string): Project[] {
  const rows = parseCSVRows(content, sep);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const projects: Project[] = [];

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });

    if (!row["slug"]) continue;

    projects.push({
      slug: row["slug"],
      title: row["title"] ?? "",
      year: parseInt(row["year"]) || 0,
      type: row["type"] ?? "",
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

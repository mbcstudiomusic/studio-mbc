import fs from "fs";
import path from "path";

export interface AudioTrack {
  title: string;
  subtitle: string;
  src: string;
}

function parseAudioCSV(content: string, sep: string): AudioTrack[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(sep).map((h) => h.trim());
  const titleIdx = headers.indexOf("title");
  const subtitleIdx = headers.indexOf("subtitle");
  const srcIdx = headers.indexOf("src");

  const tracks: AudioTrack[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep);
    const src = cols[srcIdx]?.trim();
    if (!src) continue;
    tracks.push({
      title: cols[titleIdx]?.trim() ?? "",
      subtitle: cols[subtitleIdx]?.trim() ?? "",
      src,
    });
  }
  return tracks;
}

const SHEET_ID = process.env.GOOGLE_SHEET_AUDIO_ID;

export async function getAudioTracks(): Promise<AudioTrack[]> {
  if (SHEET_ID && !SHEET_ID.startsWith("REMPLACER")) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Google Sheets fetch failed: ${res.status}`);
      const text = await res.text();
      return parseAudioCSV(text, ",");
    } catch (err) {
      console.warn("Google Sheets audio fetch failed, falling back to local CSV:", err);
    }
  }

  const csvPath = path.join(process.cwd(), "content", "audio.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  return parseAudioCSV(content, ";");
}

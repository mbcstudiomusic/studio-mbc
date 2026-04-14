import fs from "fs";
import path from "path";

export interface AudioTrack {
  title: string;
  subtitle: string;
  src: string;
  extra: boolean;
}

function parseAudioCSV(content: string): AudioTrack[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const tracks: AudioTrack[] = [];
  for (let i = 1; i < lines.length; i++) {
    const [title, subtitle, src, extra] = lines[i].split(";");
    if (!src) continue;
    tracks.push({
      title: title?.trim() ?? "",
      subtitle: subtitle?.trim() ?? "",
      src: src?.trim() ?? "",
      extra: extra?.trim() === "true",
    });
  }
  return tracks;
}

const SHEET_ID = process.env.GOOGLE_SHEET_AUDIO_ID;

export async function getAudioTracks(): Promise<AudioTrack[]> {
  if (SHEET_ID && !SHEET_ID.startsWith("REMPLACER")) {
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) throw new Error(`Google Sheets fetch failed: ${res.status}`);
      const text = await res.text();
      return parseAudioCSV(text);
    } catch (err) {
      console.warn("Google Sheets audio fetch failed, falling back to local CSV:", err);
    }
  }

  const csvPath = path.join(process.cwd(), "content", "audio.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  return parseAudioCSV(content);
}

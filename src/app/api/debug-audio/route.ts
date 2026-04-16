import { getAudioTracks } from "@/data/audio";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const tracks = await getAudioTracks();
  return NextResponse.json({ tracks, googleSheetSet: !!process.env.GOOGLE_SHEET_AUDIO_ID });
}

/**
 * MoMo quiz leaderboard. Prefers Supabase table `vv_momo_quiz_scores` when configured;
 * falls back to per-browser localStorage so local demo mode still works.
 * Rank: more correct answers first, then a faster finish.
 */
import { realtimeConfigured } from "@/lib/realtime";

export type MomoScore = {
  id: string;
  room_id: string;
  player_name: string;
  correct: number;
  total: number;
  ms: number;
  created_at: string;
};

export const MOMO_TOTAL = 5;
export const MOMO_SCORE_MIN_MS = 1000;
export const MOMO_SCORE_MAX_MS = 15 * 60_000;
export const MOMO_TOP_N = 10;

const localKey = (roomId: string) => `vv-momo-scores:${roomId}`;

function rank(a: MomoScore, b: MomoScore) {
  if (b.correct !== a.correct) return b.correct - a.correct;
  return a.ms - b.ms;
}

function readLocal(roomId: string): MomoScore[] {
  try {
    const raw = localStorage.getItem(localKey(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MomoScore[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(roomId: string, rows: MomoScore[]) {
  localStorage.setItem(localKey(roomId), JSON.stringify(rows.slice(0, 50)));
}

export function formatMomoResult(correct: number, total: number, ms: number): string {
  const s = ms / 1000;
  const time = s < 10 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`;
  return `${correct}/${total} · ${time}`;
}

export async function fetchMomoScores(roomId: string): Promise<MomoScore[]> {
  if (!realtimeConfigured) {
    return readLocal(roomId).sort(rank).slice(0, MOMO_TOP_N);
  }
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client
      .from("vv_momo_quiz_scores")
      .select("id,room_id,player_name,correct,total,ms,created_at")
      .eq("room_id", roomId)
      .order("correct", { ascending: false })
      .order("ms", { ascending: true })
      .limit(MOMO_TOP_N);
    if (error) throw error;
    return (data ?? []) as MomoScore[];
  } catch {
    return readLocal(roomId).sort(rank).slice(0, MOMO_TOP_N);
  }
}

export async function submitMomoScore(
  roomId: string,
  playerName: string,
  correct: number,
  ms: number,
): Promise<boolean> {
  if (!Number.isInteger(correct) || correct < 0 || correct > MOMO_TOTAL) return false;
  if (!Number.isFinite(ms) || ms < MOMO_SCORE_MIN_MS || ms > MOMO_SCORE_MAX_MS) return false;
  const name = playerName.trim().slice(0, 30);
  if (!name) return false;
  const row: MomoScore = {
    id: crypto.randomUUID(),
    room_id: roomId,
    player_name: name,
    correct,
    total: MOMO_TOTAL,
    ms: Math.round(ms),
    created_at: new Date().toISOString(),
  };

  if (!realtimeConfigured) {
    writeLocal(roomId, [...readLocal(roomId), row].sort(rank));
    return true;
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await client.from("vv_momo_quiz_scores").insert({
      room_id: row.room_id,
      player_name: row.player_name,
      correct: row.correct,
      total: row.total,
      ms: row.ms,
    });
    if (error) throw error;
    return true;
  } catch {
    writeLocal(roomId, [...readLocal(roomId), row].sort(rank));
    return false;
  }
}

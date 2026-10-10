"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MOMO_QUESTION_MS, MOMO_QUIZ, orderChoices, type MomoChoice } from "@/lib/momo-quiz";
import { fetchMomoScores, formatMomoResult, submitMomoScore, type MomoScore } from "@/lib/momo-scores";

const CHOICE_STYLE = [
  { color: "#e21b3c", shape: "triangle" },
  { color: "#1368ce", shape: "diamond" },
  { color: "#d89e00", shape: "circle" },
  { color: "#26890c", shape: "square" },
] as const;

type Phase = "intro" | "question" | "reveal" | "done";

function Shape({ kind }: { kind: (typeof CHOICE_STYLE)[number]["shape"] }) {
  if (kind === "triangle") {
    return <span aria-hidden className="inline-block size-3 border-x-[6px] border-b-[10px] border-x-transparent border-b-white" />;
  }
  if (kind === "diamond") {
    return <span aria-hidden className="inline-block size-2.5 rotate-45 bg-white" />;
  }
  if (kind === "circle") {
    return <span aria-hidden className="inline-block size-2.5 rounded-full bg-white" />;
  }
  return <span aria-hidden className="inline-block size-2.5 bg-white" />;
}

export function MomoQuiz({
  roomId,
  playerName,
  open,
  onClose,
}: {
  roomId: string;
  playerName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [seed, setSeed] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [leftMs, setLeftMs] = useState(MOMO_QUESTION_MS);
  const [elapsed, setElapsed] = useState(0);
  const [rows, setRows] = useState<MomoScore[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const startedAt = useRef(0);
  const questionStarted = useRef(0);
  const correctRef = useRef(0);
  const savedRound = useRef(0);
  const answering = useRef(false);

  const question = MOMO_QUIZ[index];
  const choices = useMemo(() => (question ? orderChoices(question, seed + index * 17) : []), [question, seed, index]);

  const [sessionOpen, setSessionOpen] = useState(open);
  if (sessionOpen !== open) {
    setSessionOpen(open);
    if (!open) {
      setPhase("intro");
      setIndex(0);
      setPicked(null);
      setCorrectCount(0);
      setLeftMs(MOMO_QUESTION_MS);
      setElapsed(0);
      setSaveState("idle");
      setRows([]);
    }
  }

  useEffect(() => {
    if (!open || phase !== "question") return;
    answering.current = false;
    questionStarted.current = performance.now();
    const tick = window.setInterval(() => {
      const left = MOMO_QUESTION_MS - (performance.now() - questionStarted.current);
      setLeftMs(Math.max(0, left));
    }, 100);
    const timeout = window.setTimeout(() => {
      const q = MOMO_QUIZ[index];
      if (!q || answering.current) return;
      answering.current = true;
      setPicked(null);
      setPhase("reveal");
    }, MOMO_QUESTION_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timeout);
    };
  }, [open, phase, index]);

  const begin = () => {
    savedRound.current += 1;
    setSeed((Math.random() * 1e9) | 0);
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    correctRef.current = 0;
    setLeftMs(MOMO_QUESTION_MS);
    setElapsed(0);
    setSaveState("idle");
    setRows([]);
    startedAt.current = performance.now();
    setPhase("question");
  };

  const finishAnswer = (choiceId: string) => {
    if (phase !== "question" || answering.current) return;
    answering.current = true;
    const q = MOMO_QUIZ[index];
    if (choiceId === q.answer) {
      correctRef.current += 1;
      setCorrectCount(correctRef.current);
    }
    setPicked(choiceId);
    setPhase("reveal");
  };

  useEffect(() => {
    if (phase !== "reveal") return;
    const id = window.setTimeout(() => {
      if (index + 1 >= MOMO_QUIZ.length) {
        const ms = Math.max(1000, Math.round(performance.now() - startedAt.current));
        const round = savedRound.current;
        const correct = correctRef.current;
        setElapsed(ms);
        setPhase("done");
        setSaveState("saving");
        const mine: MomoScore = {
          id: `local-${round}`,
          room_id: roomId,
          player_name: playerName,
          correct,
          total: MOMO_QUIZ.length,
          ms,
          created_at: new Date().toISOString(),
        };
        void submitMomoScore(roomId, playerName, correct, ms).then(async (ok) => {
          if (savedRound.current !== round) return;
          setSaveState(ok ? "saved" : "failed");
          const remote = await fetchMomoScores(roomId);
          if (savedRound.current !== round) return;
          const visible = ok || remote.some((r) => r.player_name === mine.player_name && r.ms === mine.ms)
            ? remote
            : [mine, ...remote].sort((a, b) => b.correct - a.correct || a.ms - b.ms).slice(0, 10);
          setRows(visible);
        });
        return;
      }
      setPicked(null);
      setLeftMs(MOMO_QUESTION_MS);
      setIndex((i) => i + 1);
      setPhase("question");
    }, 1100);
    return () => window.clearTimeout(id);
  }, [phase, index, playerName, roomId]);

  if (!open) return null;

  const seconds = Math.ceil(leftMs / 1000);
  const progress = phase === "question" ? leftMs / MOMO_QUESTION_MS : phase === "reveal" ? 0 : 1;

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-3 sm:items-center" role="dialog" aria-label="MoMo Quiz">
      <div className="w-full max-w-[440px] border-4 border-[#1a0a10] bg-[#a50064] shadow-[0_24px_60px_rgba(26,10,16,0.45)]">
        <div className="border-b-4 border-[#1a0a10] bg-[#ff2d87] px-4 py-2 text-center">
          <p className="text-[11px] font-bold tracking-[0.28em] text-[#ffe08a]">● ● ● ● ● ●</p>
          <p className="font-display text-[22px] leading-none font-black tracking-[0.18em] text-white">QUIZ</p>
        </div>

        <div className="bg-[#2a0618] p-4 text-white">
          <header className="flex items-center gap-2">
            <p className="min-w-0 flex-1 text-[12px] font-semibold tracking-[0.08em] text-[#ffb3d4] uppercase">
              {phase === "done" ? "Kết quả" : phase === "intro" ? "Quiz trắc nghiệm" : `Câu ${index + 1}/${MOMO_QUIZ.length}`}
            </p>
            <button type="button" onClick={onClose} className="vv-focus grid size-8 place-items-center rounded-full text-[18px] text-white/70 hover:bg-white/10" aria-label="Đóng quiz">×</button>
          </header>

          {phase === "intro" && (
            <div className="mt-3">
              <p className="text-[20px] leading-snug font-semibold">5 câu về ví MoMo</p>
              <p className="mt-2 text-[14px] leading-snug text-white/70">Chọn một đáp án trước khi hết 20 giây. Đúng nhiều hơn, rồi xong nhanh hơn, sẽ đứng trên bảng xếp hạng.</p>
              <button type="button" onClick={begin} className="vv-focus mt-4 h-11 rounded-full bg-[#ff2d87] px-5 text-[15px] font-semibold text-white hover:bg-[#ff4f9a]">
                Bắt đầu
              </button>
            </div>
          )}

          {(phase === "question" || phase === "reveal") && question && (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#ff2d87] transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="mt-3 text-[18px] leading-snug font-semibold">{question.prompt}</p>
              {phase === "question" && <p className="mt-2 text-[13px] font-semibold text-[#ffb3d4]">{seconds}s</p>}
              {phase === "reveal" && (
                <p className="mt-2 text-[13px] font-semibold text-[#ffb3d4]">
                  {picked && picked === question.answer ? "Đúng rồi" : "Chưa đúng"} · {correctCount}/{MOMO_QUIZ.length}
                </p>
              )}
            </div>
          )}

          {phase === "done" && (
            <div className="mt-3">
              <p className="text-[28px] leading-none font-black">{correctCount}/{MOMO_QUIZ.length}</p>
              <p className="mt-2 text-[14px] text-white/75">{formatMomoResult(correctCount, MOMO_QUIZ.length, elapsed)}</p>
              <p className="mt-1 text-[13px] text-[#ffb3d4]">
                {saveState === "saving" && "Đang lưu bảng xếp hạng…"}
                {saveState === "saved" && "Đã lưu lên Supabase."}
                {saveState === "failed" && "Chưa lưu được lên Supabase. Điểm đang nằm tạm trên máy này."}
              </p>
              <button type="button" onClick={begin} className="vv-focus mt-4 h-10 rounded-full bg-white/10 px-4 text-[13px] font-semibold hover:bg-white/15">
                Chơi lại
              </button>
              <ol className="mt-4 grid gap-1.5">
                {rows.length === 0 && saveState !== "saving" && <li className="text-[13px] text-white/60">Chưa có ai trên bảng.</li>}
                {rows.map((r, i) => (
                  <li key={r.id} className="flex items-baseline gap-2 text-[13px]">
                    <span className="w-5 shrink-0 font-semibold text-[#ffb3d4]">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{r.player_name}</span>
                    <span className="shrink-0 tabular-nums text-white/70">{formatMomoResult(r.correct, r.total, r.ms)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {(phase === "question" || phase === "reveal") && (
          <div className="grid grid-cols-2 gap-2 border-t-4 border-[#1a0a10] bg-[#3a1024] p-3">
            {choices.map((choice, i) => (
              <ChoiceButton
                key={choice.id}
                choice={choice}
                style={CHOICE_STYLE[i]}
                disabled={phase !== "question"}
                picked={picked === choice.id}
                correct={phase === "reveal" && choice.id === question.answer}
                wrong={phase === "reveal" && picked === choice.id && choice.id !== question.answer}
                onPick={() => finishAnswer(choice.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChoiceButton({
  choice,
  style,
  disabled,
  picked,
  correct,
  wrong,
  onPick,
}: {
  choice: MomoChoice;
  style: (typeof CHOICE_STYLE)[number];
  disabled: boolean;
  picked: boolean;
  correct: boolean;
  wrong: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      className={`vv-focus flex min-h-16 items-center gap-2 rounded-2xl px-3 py-2 text-left text-[13px] leading-snug font-semibold text-white disabled:cursor-default ${
        correct ? "ring-2 ring-white" : ""
      } ${wrong ? "opacity-55" : ""} ${picked && !wrong && !correct ? "ring-2 ring-white/80" : ""}`}
      style={{ background: style.color }}
    >
      <Shape kind={style.shape} />
      <span>{choice.text}</span>
    </button>
  );
}

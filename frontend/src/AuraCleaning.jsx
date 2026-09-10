import React, { useEffect, useRef, useState } from "react";
import { X, Sparkles, Play, Pause, Square, Flame } from "lucide-react";
import { CHANTS } from "./chants";

const STREAK_KEY = "ramayana_helpbot_aura_streak";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function loadStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
    if (!raw) return { lastDate: null, streak: 0 };
    // A streak only still "counts" as live if the last session was today or yesterday.
    if (raw.lastDate !== todayStr() && raw.lastDate !== yesterdayStr()) {
      return { lastDate: raw.lastDate, streak: 0 };
    }
    return raw;
  } catch {
    return { lastDate: null, streak: 0 };
  }
}

function recordSessionCompleted() {
  const current = loadStreak();
  const today = todayStr();
  if (current.lastDate === today) return current; // already logged today
  const next = { lastDate: today, streak: current.lastDate === yesterdayStr() ? current.streak + 1 : 1 };
  localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
}

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * "Daily Aura Cleaning" — an uninterrupted, looping playback session through
 * the CHANTS playlist for a chosen 10/15 minute duration, meant for a quiet
 * daily listening practice. The streak counter is real (localStorage-backed,
 * counts consecutive calendar days a session was completed) — there is no
 * background/OS-level daily reminder here, since that needs push/service-
 * worker infrastructure this app doesn't have; the honest mechanism for
 * "daily" is simply that returning and finishing a session each day keeps
 * the streak alive.
 */
export default function AuraCleaning({ onClose }) {
  const [durationMin, setDurationMin] = useState(10);
  const [running, setRunning] = useState(false);
  const [remainingSec, setRemainingSec] = useState(durationMin * 60);
  const [chantIdx, setChantIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(() => loadStreak());

  const audioRef = useRef(null);
  const tickRef = useRef(null);
  const repeatLeftRef = useRef(CHANTS[0].repeat);
  const fadeRef = useRef(null);

  // A quick fade-in on every (re)start, in place of an abrupt attack —
  // meaningfully smoother for a meditative listening session, especially
  // across the frequent in-place repeats of the short mantras.
  const fadeIn = () => {
    const el = audioRef.current;
    if (!el) return;
    cancelAnimationFrame(fadeRef.current);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 350);
      el.volume = t;
      if (t < 1) fadeRef.current = requestAnimationFrame(step);
    };
    el.volume = 0;
    fadeRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(tickRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running]);

  useEffect(() => {
    if (running && remainingSec === 0) {
      audioRef.current?.pause();
      setRunning(false);
      setCompleted(true);
      setStreak(recordSessionCompleted());
    }
  }, [remainingSec, running]);

  useEffect(() => {
    if (running) {
      audioRef.current?.play().catch(() => {});
      fadeIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantIdx, running]);

  const start = () => {
    setCompleted(false);
    setRemainingSec(durationMin * 60);
    setChantIdx(0);
    repeatLeftRef.current = CHANTS[0].repeat;
    setRunning(true);
    requestAnimationFrame(() => {
      audioRef.current?.play().catch(() => {});
      fadeIn();
    });
  };

  const stop = () => {
    setRunning(false);
    audioRef.current?.pause();
    cancelAnimationFrame(fadeRef.current);
  };

  const onTrackEnded = () => {
    repeatLeftRef.current -= 1;
    if (repeatLeftRef.current > 0) {
      // Same mantra again, in place — a short japa-style repetition rather
      // than jumping straight to a different chant.
      const el = audioRef.current;
      if (el) {
        el.currentTime = 0;
        el.play().catch(() => {});
        fadeIn();
      }
      return;
    }
    setChantIdx((i) => {
      const next = (i + 1) % CHANTS.length;
      repeatLeftRef.current = CHANTS[next].repeat;
      return next;
    });
  };

  const chant = CHANTS[chantIdx];
  const totalSec = durationMin * 60;
  const pctDone = running || completed ? Math.round(((totalSec - remainingSec) / totalSec) * 100) : 0;

  return (
    <div className="shlokaOverlay" onClick={onClose}>
      <div className="shlokaPanel auraPanel" onClick={(e) => e.stopPropagation()}>
        <div className="shlokaHeader">
          <div className="shlokaHeaderTitle">
            <span className="shlokaHeaderIcon">
              <Sparkles size={17} />
            </span>
            <div>
              <h2>Daily Aura Cleaning</h2>
              <p>An uninterrupted stretch of Sanskrit chanting for a quiet home — or a quiet mind.</p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="auraBody">
          <div className="auraStreak">
            <Flame size={15} />
            <span>
              {streak.streak > 0
                ? `${streak.streak}-day streak — come back today to keep it going`
                : "Start your streak — finish one session today"}
            </span>
          </div>

          {!running && !completed && (
            <>
              <p className="auraLabel">Choose a length</p>
              <div className="auraDurationRow">
                {[10, 15].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={"auraDurationBtn" + (m === durationMin ? " active" : "")}
                    onClick={() => setDurationMin(m)}
                  >
                    {m} min
                  </button>
                ))}
              </div>
              <button className="btnPrimary auraStartBtn" onClick={start} type="button">
                <Play size={15} />
                Begin session
              </button>
            </>
          )}

          {running && (
            <div className="auraActive">
              <div className="auraRing" style={{ "--pct": `${pctDone}%` }}>
                <span>{fmt(remainingSec)}</span>
              </div>
              <p className="auraNowPlaying">{chant.title}</p>
              <p className="auraDevanagari">{chant.devanagari}</p>
              <div className="auraControls">
                <button className="audioPlayBtn" onClick={stop} type="button" title="Stop">
                  <Square size={14} />
                </button>
              </div>
            </div>
          )}

          {completed && (
            <div className="auraDone">
              <Sparkles size={26} />
              <p>Session complete. जय सीताराम — Jai Siya Ram.</p>
              <button className="btnPrimary auraStartBtn" onClick={start} type="button">
                <Play size={15} />
                Start another session
              </button>
            </div>
          )}

          <audio ref={audioRef} src={chant.src} onEnded={onTrackEnded} />
        </div>
      </div>
    </div>
  );
}

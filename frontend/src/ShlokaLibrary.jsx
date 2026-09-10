import React, { useRef, useState } from "react";
import { X, MessageCircleQuestion, BookMarked, Play, Pause, Download, Headphones } from "lucide-react";
import { PERSONAS, shlokasFor } from "./shlokas";
import { CHANTS } from "./chants";

export default function ShlokaLibrary({ onClose, onAsk }) {
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const shlokas = shlokasFor(persona);
  const activePersona = PERSONAS.find((p) => p.id === persona);

  const [chantId, setChantId] = useState(CHANTS[0].id);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const chant = CHANTS.find((c) => c.id === chantId);

  const pickChant = (id) => {
    setChantId(id);
    setPlaying(false);
    // swap the <audio> source, then let the user press play again
    requestAnimationFrame(() => audioRef.current?.load());
  };

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
    } else {
      el.play().catch(() => {});
    }
  };

  const ask = (s) => {
    onAsk(
      `Tell me about this shloka and its meaning — "${s.transliteration}" (${s.source}). ` +
        `What does it teach, and how might it apply to daily life?`
    );
    onClose();
  };

  return (
    <div className="shlokaOverlay" onClick={onClose}>
      <div className="shlokaPanel" onClick={(e) => e.stopPropagation()}>
        <div className="shlokaHeader">
          <div className="shlokaHeaderTitle">
            <span className="shlokaHeaderIcon">
              <BookMarked size={17} />
            </span>
            <div>
              <h2>Sanskrit Shloka Library</h2>
              <p>Verses from the Valmiki Ramayana, with translation and life application.</p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="audioModeBar">
          <div className="audioModeHead">
            <Headphones size={14} />
            <span>Audio mode — devotional Sanskrit chants, not verse-matched recordings</span>
          </div>
          <div className="audioModeRow">
            <button className="audioPlayBtn" onClick={togglePlay} type="button" title={playing ? "Pause" : "Play"}>
              {playing ? <Pause size={15} /> : <Play size={15} />}
            </button>
            <div className="audioModeMeta">
              <b>{chant.title}</b>
              <span>{chant.blurb}</span>
            </div>
            <a className="audioDownloadBtn" href={chant.src} download title={`Download ${chant.title}`}>
              <Download size={14} />
            </a>
          </div>
          <div className="audioChantTabs">
            {CHANTS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={"audioChantTab" + (c.id === chantId ? " active" : "")}
                onClick={() => pickChant(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>
          <audio
            ref={audioRef}
            src={chant.src}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
          <p className="audioModeAttribution">
            {chant.license} — {chant.attribution}
          </p>
        </div>

        <div className="shlokaTabs">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              className={"shlokaTab" + (p.id === persona ? " active" : "")}
              onClick={() => setPersona(p.id)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
        {activePersona && <p className="shlokaPersonaBlurb">{activePersona.blurb}</p>}

        <div className="shlokaList">
          {shlokas.map((s) => (
            <article key={s.id} className="shlokaCard">
              <p className="shlokaDevanagari">{s.devanagari}</p>
              <p className="shlokaTransliteration">{s.transliteration}</p>
              <p className="shlokaTranslation">{s.translation}</p>
              <div className="shlokaSourceRow">
                <span className="shlokaSource">{s.source}</span>
              </div>
              <p className="shlokaExplanation">{s.explanation}</p>
              <button className="shlokaAskBtn" onClick={() => ask(s)} type="button">
                <MessageCircleQuestion size={14} />
                Ask about this
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { X, MessageCircleQuestion, BookMarked } from "lucide-react";
import { PERSONAS, shlokasFor } from "./shlokas";

export default function ShlokaLibrary({ onClose, onAsk }) {
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const shlokas = shlokasFor(persona);
  const activePersona = PERSONAS.find((p) => p.id === persona);

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

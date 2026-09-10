import React, { useState } from "react";
import { X, Sparkles, Users, Swords, ScrollText, BookOpen } from "lucide-react";
import { PROMPT_CATEGORIES, promptsFor } from "./promptData";

const CATEGORY_ICONS = {
  characters: <Users size={14} />,
  events: <Swords size={14} />,
  teachings: <ScrollText size={14} />,
  puranas: <BookOpen size={14} />,
};

export default function PromptLibrary({ onClose, onAsk }) {
  const [category, setCategory] = useState(PROMPT_CATEGORIES[0].id);
  const prompts = promptsFor(category);

  const ask = (p) => {
    onAsk(p.prompt);
    onClose();
  };

  return (
    <div className="shlokaOverlay" onClick={onClose}>
      <div className="shlokaPanel promptPanel" onClick={(e) => e.stopPropagation()}>
        <div className="shlokaHeader">
          <div className="shlokaHeaderTitle">
            <span className="shlokaHeaderIcon">
              <Sparkles size={17} />
            </span>
            <div>
              <h2>Prompt Library</h2>
              <p>A fuller set of questions to explore the Ramayana and its connected Puranas.</p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="shlokaTabs">
          {PROMPT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={"shlokaTab" + (c.id === category ? " active" : "")}
              onClick={() => setCategory(c.id)}
              type="button"
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="promptGridList">
          {prompts.map((p) => (
            <button key={p.id} className="promptCard" onClick={() => ask(p)} type="button">
              <span className="promptCardIcon">{CATEGORY_ICONS[p.category]}</span>
              <span className="promptCardText">
                <span className="suggestLead">{p.lead}</span> <span className="suggestRest">{p.rest}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

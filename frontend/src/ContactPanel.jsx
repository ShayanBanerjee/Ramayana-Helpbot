import React from "react";
import { X, Mail, Github, HeartHandshake, ShieldQuestion } from "lucide-react";
import Logo from "./Logo";

const CONTACT_EMAIL = "shayanbanerjee96@gmail.com";
const REPO_URL = "https://github.com/ShayanBanerjee/Ramayana-Helpbot";

export default function ContactPanel({ onClose }) {
  return (
    <div className="shlokaOverlay" onClick={onClose}>
      <div className="shlokaPanel contactPanel" onClick={(e) => e.stopPropagation()}>
        <div className="shlokaHeader">
          <div className="shlokaHeaderTitle">
            <span className="shlokaHeaderIcon">
              <HeartHandshake size={17} />
            </span>
            <div>
              <h2>Contact &amp; About</h2>
              <p>Questions, corrections to a citation, or feedback on the assistant — reach out below.</p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="contactBody">
          <div className="contactIntro">
            <div className="emblem contactEmblem">
              <Logo size={22} />
            </div>
            <p>
              Ramayana HelpBot is a Retrieval-Augmented Generation assistant grounded in the Valmiki
              Ramayana and the Hindu scriptures connected to it. Every answer is traced back to the
              indexed text it came from — nothing is invented.
            </p>
          </div>

          <a className="contactRow" href={`mailto:${CONTACT_EMAIL}`}>
            <span className="contactRowIcon">
              <Mail size={16} />
            </span>
            <span className="contactRowText">
              <b>Email</b>
              <span>{CONTACT_EMAIL}</span>
            </span>
          </a>

          <a className="contactRow" href={REPO_URL} target="_blank" rel="noreferrer">
            <span className="contactRowIcon">
              <Github size={16} />
            </span>
            <span className="contactRowText">
              <b>Source code</b>
              <span>github.com/ShayanBanerjee/Ramayana-Helpbot</span>
            </span>
          </a>

          <div className="contactRow contactRowStatic">
            <span className="contactRowIcon">
              <ShieldQuestion size={16} />
            </span>
            <span className="contactRowText">
              <b>A note on scope</b>
              <span>
                This assistant answers from its indexed texts only, and declines topics outside them.
                It is a study companion, not a substitute for guidance from a qualified scholar or guru.
              </span>
            </span>
          </div>

          <p className="epigraph contactEpigraph">जय सीताराम — Jai Siya Ram</p>
        </div>
      </div>
    </div>
  );
}

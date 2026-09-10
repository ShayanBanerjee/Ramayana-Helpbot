import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  Paperclip,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ScrollText,
  Users,
  Swords,
  Feather,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  BookMarked,
  Sparkles,
  Mail,
  Map as MapIcon,
} from "lucide-react";
import api from "./api";
import AuthScreen from "./AuthScreen";
import ShlokaLibrary from "./ShlokaLibrary";
import PromptLibrary from "./PromptLibrary";
import ContactPanel from "./ContactPanel";
import SacredMap from "./SacredMap";
import Logo from "./Logo";

const THEME_KEY = "ramayana_helpbot_theme";
const VEIL_KEY = "ramayana_helpbot_veil";

function nowTs(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString();
}

function relevanceTier(score) {
  if (typeof score !== "number") return "mid";
  if (score >= 0.55) return "high";
  if (score >= 0.3) return "mid";
  return "low";
}

// Friendly display names for known indexed texts — falls back to a cleaned
// up version of the raw filename for anything not in this list (uploaded
// PDFs, future additions), so a technical .pdf filename never has to be
// the primary thing the user reads in a citation.
const SOURCE_DISPLAY_NAMES = {
  "valmiki_ramayana_griffith.pdf": "Valmiki Ramayana (Griffith)",
  "bhagavad_gita_telang.pdf": "Bhagavad Gita (Telang)",
  "vishnu_purana_wilson.pdf": "Vishnu Purana (Wilson)",
  "vishnu_purana_dutt.pdf": "Vishnu Purana (Dutt)",
  "ramcharitmanas_growse.pdf": "Ramcharitmanas (Growse)",
  "markandeya_purana_dutt.pdf": "Markandeya Purana (Dutt)",
  "upanishads_max_muller_vol1.pdf": "The Upanishads, Vol. 1 (Müller)",
  "devi_bhagavata_purana.pdf": "Devi Bhagavata Purana (Vijnanananda)",
  "garuda_puranam_dutt.pdf": "Garuda Purana (Dutt)",
  "agni_puranam_dutt.pdf": "Agni Purana (Dutt)",
  "srimad_bhagavatam_dutt.pdf": "Srimad Bhagavatam (Dutt)",
};

function displaySourceName(fileName) {
  if (!fileName) return "unknown";
  if (SOURCE_DISPLAY_NAMES[fileName]) return SOURCE_DISPLAY_NAMES[fileName];
  return fileName.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ");
}

/**
 * Simulated "word of generation" reveal for freshly-arrived assistant
 * answers. The backend returns the complete answer in one response (no
 * token streaming), so this fakes a readable, progressive reveal on the
 * client by growing a visible-character count word-by-word on an interval,
 * re-rendering the growing substring through ReactMarkdown each tick — a
 * standard trick for a "streaming" feel without a streaming API. Messages
 * loaded from chat history are rendered with animate=false (full text,
 * no interval). The effect must stay idempotent (schedule fresh, always
 * clear on cleanup) rather than guard itself with a "did this already
 * start" ref — React 18 StrictMode's dev-mode mount→cleanup→mount replay
 * would otherwise clear the first interval and then have the guard block
 * the second mount from ever scheduling a replacement, leaving the text
 * stuck at zero characters forever.
 */
function AnimatedMarkdown({ text, animate }) {
  const [visibleChars, setVisibleChars] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) return;
    setVisibleChars(0);
    const tokens = text.split(/(\s+)/);
    let i = 0;
    let charCount = 0;
    const interval = setInterval(() => {
      if (i >= tokens.length) {
        clearInterval(interval);
        return;
      }
      charCount += tokens[i].length;
      setVisibleChars(charCount);
      i++;
    }, 28);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, animate]);

  return <ReactMarkdown>{animate ? text.slice(0, visibleChars) : text}</ReactMarkdown>;
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || name[0].toUpperCase();
}

/**
 * A short, necessary set of starting points — devotional in subject,
 * framed around what the text says and why it still matters.
 * Each chip is a bold "lead" phrase plus a muted continuation, ChatGPT-style.
 */
const PROMPT_CARDS = [
  {
    icon: <Users size={15} />,
    lead: "Who is Hanuman",
    rest: "and what does his devotion teach us?",
    prompt: "Who is Hanuman, and what does his devotion to Rama teach us?",
  },
  {
    icon: <ScrollText size={15} />,
    lead: "Rama's exile",
    rest: "— what does it teach about duty over comfort?",
    prompt: "What are the events leading to Rama's exile, and what does it teach about duty over comfort?",
  },
  {
    icon: <Feather size={15} />,
    lead: "Summarize the Balakanda",
    rest: "in a few key events",
    prompt: "Summarize the Balakanda in a few key events.",
  },
  {
    icon: <Swords size={15} />,
    lead: "Dharma in the Ramayana",
    rest: "— how is it defined through the story?",
    prompt: "How does the Ramayana define dharma and duty through its story?",
  },
];

export default function App() {
  const [user, setUser] = useState(undefined); // undefined=loading, null=anonymous/guest, object=authed
  const [chat, setChat] = useState([]);
  const [guestInfo, setGuestInfo] = useState(null); // {remaining, limit} while anonymous, else null
  const [authGate, setAuthGate] = useState(null); // null | "forced" | "voluntary"
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // {type: "ok"|"bad", text: string}
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shlokasOpen, setShlokasOpen] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "system");
  const [veilOpacity, setVeilOpacity] = useState(() => {
    const stored = parseFloat(localStorage.getItem(VEIL_KEY));
    return Number.isFinite(stored) ? stored : 0.55;
  });
  const chatRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    api
      .me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user === undefined) return; // still resolving /auth/me
    api
      .history()
      .then((res) => {
        setChat(res.data.messages || []);
        setGuestInfo(res.data.guest || null);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(VEIL_KEY, String(veilOpacity));
  }, [veilOpacity]);

  const toggleTheme = () => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const effectiveCurrent = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
    setTheme(effectiveCurrent === "dark" ? "light" : "dark");
  };

  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  const addMsg = (role, content, sources = null, opts = {}) => {
    setChat((prev) => [
      ...prev,
      { role, content, sources, ts: new Date().toISOString(), animate: !!opts.animate },
    ]);
  };

  const clearChat = async () => {
    setStatus(null);
    try {
      await api.clearChat();
      setChat([]);
    } catch {
      setStatus({ type: "bad", text: "Could not clear chat history. Try again." });
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setChat([]);
      setStatus(null);
    }
  };

  const handleAuthed = (authedUser) => {
    setAuthGate(null);
    setUser(authedUser); // triggers the [user] effect, which re-fetches history — now the claimed guest messages
  };

  const send = async (q) => {
    const text = (q ?? question).trim();
    if (!text || busy) return;

    setStatus(null);
    setBusy(true);
    addMsg("user", text);
    setQuestion("");

    try {
      const res = await api.chat(text);
      addMsg("assistant", res.data.answer, res.data.sources || [], { animate: true });
      if (res.data.guest) setGuestInfo(res.data.guest);
    } catch (e) {
      if (e?.response?.status === 403 && e.response.data?.error === "guest_limit_reached") {
        setChat((prev) => prev.slice(0, -1)); // drop the optimistic question — the backend never saved it
        setGuestInfo(e.response.data.guest || { remaining: 0, limit: 5 });
        setAuthGate("forced");
        setQuestion(text); // hand the unanswered question back so it isn't lost
        return;
      }
      setStatus({ type: "bad", text: "Chat failed. Confirm the backend is running and PDFs are indexed." });
      addMsg(
        "assistant",
        "I could not reach the backend or the index is not ready. Please try again shortly."
      );
    } finally {
      setBusy(false);
    }
  };

  const uploadPdfs = async (files) => {
    if (!files || files.length === 0) return;

    setStatus(null);
    setBusy(true);
    setSidebarOpen(false);

    try {
      const res = await api.ingest(files);
      setStatus({
        type: "ok",
        text: `Indexed ${res.data.chunks_indexed} chunks from uploaded PDFs.`,
      });
      addMsg(
        "assistant",
        `Indexing complete.\n\nYou can now ask questions about the uploaded PDFs. Try: **"Summarize Balakanda"** or **"Who is Hanuman?"**`
      );
    } catch (e) {
      setStatus({ type: "bad", text: "Ingestion failed. Check backend logs and PDF quality." });
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined) {
    return (
      <>
        <div className="bgArt" />
        <div className="bgVeil" style={{ opacity: veilOpacity }} />
        <div className="loadingSplash">
          <div className="emblem">
            <Logo size={28} />
          </div>
        </div>
      </>
    );
  }

  if (authGate) {
    return (
      <AuthScreen
        onAuthed={handleAuthed}
        gateReason={authGate}
        onCancel={authGate === "voluntary" ? () => setAuthGate(null) : undefined}
        guestLimit={guestInfo?.limit ?? 5}
      />
    );
  }

  const hiddenFileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="application/pdf"
      multiple
      style={{ display: "none" }}
      onChange={(e) => {
        uploadPdfs(e.target.files);
        e.target.value = "";
      }}
    />
  );

  const renderComposer = (variant) => (
    <div className={"composer" + (variant === "landing" ? " landing" : "")}>
      <div className="composerInner">
        <button
          className="attachBtn"
          onClick={() => (user ? fileInputRef.current?.click() : setAuthGate("voluntary"))}
          disabled={busy}
          title={user ? "Attach PDFs" : "Sign in to upload PDFs"}
          type="button"
        >
          <Paperclip size={17} />
        </button>
        <input
          className="input"
          placeholder={busy ? "Working..." : "Ask about characters, events, themes, teachings..."}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={busy}
        />
        <button className="sendBtn" onClick={() => send()} disabled={busy} title="Send" type="button">
          <Send size={17} />
        </button>
      </div>
    </div>
  );

  const isLanding = chat.length === 0;

  return (
    <>
      <div className="bgArt" />
      <div className="bgVeil" style={{ opacity: veilOpacity }} />
      {hiddenFileInput}

      <div className="app">
        {sidebarOpen && <div className="sidebarBackdrop" onClick={() => setSidebarOpen(false)} />}
        <aside className={"sidebar" + (sidebarOpen ? " open" : "")}>
          <div className="brand">
            <div className="brandTitle">
              <span className="brandIcon">
                <Logo size={15} />
              </span>
              Ramayana HelpBot
              <button className="sidebarCloseBtn" onClick={() => setSidebarOpen(false)} title="Close">
                <X size={15} />
              </button>
            </div>
          </div>

          <nav className="sidebarNav">
            {user ? (
              <div className="userRow">
                <div className="userAvatar">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials(user.name)}
                </div>
                <div className="userMeta">
                  <div className="userName">{user.name}</div>
                  <div className="userEmail">{user.email}</div>
                </div>
                <button className="logoutBtn" onClick={logout} title="Log out">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="guestRow">
                <span className="guestPill" data-testid="guestCounterSidebar">
                  <b>{guestInfo?.remaining ?? 5}</b> of {guestInfo?.limit ?? 5} free questions left
                </span>
                <button className="navItem primary" onClick={() => setAuthGate("voluntary")}>
                  <UserIcon size={16} />
                  Log in / Sign up
                </button>
                <p className="guestRowLabel">Sign in anytime to save this conversation to an account.</p>
              </div>
            )}

            {user && (
              <button className="navItem" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                <Upload size={16} />
                Upload PDFs
              </button>
            )}
            <button className="navItem" onClick={() => setPromptsOpen(true)}>
              <Sparkles size={16} />
              Prompt Library
            </button>
            <button className="navItem" onClick={() => setShlokasOpen(true)}>
              <BookMarked size={16} />
              Sanskrit Shlokas
            </button>
            <button className="navItem" onClick={() => setMapOpen(true)}>
              <MapIcon size={16} />
              Sacred Geography
            </button>
            <button className="navItem" onClick={() => setContactOpen(true)}>
              <Mail size={16} />
              Contact
            </button>
            <p className="navHint">
              Answers are grounded in your indexed Valmiki Ramayana PDFs, with source and page citations.
            </p>
          </nav>

          <div className="sidebarFooter">
            <div className="sliderBlock">
              <div className="sliderLabel">
                <span>Background intensity</span>
                <span>{Math.round(veilOpacity * 100)}%</span>
              </div>
              <input
                className="opacitySlider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={veilOpacity}
                onChange={(e) => setVeilOpacity(parseFloat(e.target.value))}
              />
            </div>
            <button className="themeToggle" onClick={toggleTheme}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              {isDark ? "Light mode" : "Dark mode"}
            </button>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbarLeft">
              <button className="menuBtn" onClick={() => setSidebarOpen(true)} title="Menu">
                <Menu size={17} />
              </button>
              <div className="mobileBrand">
                <span className="brandIcon" style={{ width: 24, height: 24, borderRadius: 7 }}>
                  <Logo size={13} />
                </span>
                Ramayana HelpBot
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!user && (
                <span className="guestPill" data-testid="guestCounterTopbar">
                  <b>{guestInfo?.remaining ?? 5}</b>/{guestInfo?.limit ?? 5} free
                </span>
              )}
              {status?.type === "ok" && (
                <div className="statusOk">
                  <CheckCircle2 size={14} /> {status.text}
                </div>
              )}
              {status?.type === "bad" && (
                <div className="statusBad">
                  <AlertTriangle size={14} /> {status.text}
                </div>
              )}
              {chat.length > 0 && (
                <button className="clearChatBtn" onClick={clearChat} disabled={busy} title="Clear chat">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          <div className={"chat" + (isLanding ? " isLanding" : "")} ref={chatRef}>
            {isLanding ? (
              <div className="landingWrap">
                <div className="emblem">
                  <Logo size={28} />
                </div>
                <h1 className="landingTitle">Namaste, {user?.name?.split(" ")[0] || "traveller"}</h1>
                <p className="landingSubtitle">
                  A quiet space to reflect on the life of Rama — his trials, his companions, and the dharma
                  he upheld. Every answer stays grounded in the text, with citations back to its source.
                </p>

                {renderComposer("landing")}

                <div className="suggestGrid">
                  {PROMPT_CARDS.map((p) => (
                    <button
                      key={p.lead}
                      className="suggestChip"
                      onClick={() => send(p.prompt)}
                      disabled={busy}
                      type="button"
                    >
                      <span className="suggestIcon">{p.icon}</span>
                      <span className="suggestText">
                        <span className="suggestLead">{p.lead}</span>{" "}
                        <span className="suggestRest">{p.rest}</span>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="epigraphDivider" />
                <p className="epigraph">धर्मो रक्षति रक्षितः — "Dharma protects those who protect it."</p>
              </div>
            ) : (
              <div className="chatColumn">
                {chat.map((m, idx) => (
                  <div key={idx} className={"row " + (m.role === "user" ? "user" : "assistant")}>
                    <div className={"avatar " + (m.role === "user" ? "user" : "assistant")}>
                      {m.role === "user" ? <UserIcon size={15} /> : <Logo size={16} />}
                    </div>
                    <div className={"bubble " + (m.role === "user" ? "user" : "assistant")}>
                      <div className="meta">
                        <span>{m.role === "user" ? (user?.name || "You") : "Ramayana HelpBot"}</span>
                        <span>{nowTs(m.ts)}</span>
                      </div>

                      <div className="msgBody">
                        {m.role === "assistant" ? (
                          <AnimatedMarkdown text={m.content} animate={m.animate} />
                        ) : (
                          <div>{m.content}</div>
                        )}
                      </div>

                      {m.role === "assistant" && Array.isArray(m.sources) && m.sources.length > 0 && (
                        <div className="sources">
                          <b>Referenced in the text</b>
                          <ul className="sourceList">
                            {m.sources.map((s, i) => {
                              const tier = relevanceTier(s.relevance);
                              return (
                                <li key={i} className="sourceItem">
                                  <span className="sourceFile">{displaySourceName(s.source_file)}</span>
                                  <span>— page {String(s.page ?? "unknown")}</span>
                                  {typeof s.relevance === "number" && (
                                    <span className={"relevancePill " + tier}>
                                      {Math.round(s.relevance * 100)}% match
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {busy && (
                  <div className="row assistant">
                    <div className="avatar assistant">
                      <Logo size={16} />
                    </div>
                    <div className="bubble assistant">
                      <div className="typing">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isLanding && renderComposer("bar")}
        </main>
      </div>

      {shlokasOpen && (
        <ShlokaLibrary onClose={() => setShlokasOpen(false)} onAsk={(text) => send(text)} />
      )}
      {promptsOpen && (
        <PromptLibrary onClose={() => setPromptsOpen(false)} onAsk={(text) => send(text)} />
      )}
      {contactOpen && <ContactPanel onClose={() => setContactOpen(false)} />}
      {mapOpen && <SacredMap onClose={() => setMapOpen(false)} onAsk={(text) => send(text)} />}
    </>
  );
}

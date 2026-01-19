import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  BookOpen,
  Upload,
  Send,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ScrollText,
  Users,
  Swords,
  Feather,
} from "lucide-react";

const CHAT_KEY = "ramayana_helpbot_chat_v2";

function nowTs() {
  return new Date().toLocaleString();
}

/**
 * Better "prompt bubbles":
 * - Title + short description
 * - Icon per category
 * - One click ask
 */
const PROMPT_CARDS = [
  {
    icon: <Feather size={18} />,
    title: "Summary of a Kanda",
    subtitle: "Generate an 8-bullet summary of a selected section.",
    prompt: "Summarize the Balakanda in 8 bullet points with key events.",
  },
  {
    icon: <Users size={18} />,
    title: "Character understanding",
    subtitle: "Ask about a character’s virtues, actions, and role.",
    prompt: "Who is Hanuman and what are his major contributions in the Ramayana?",
  },
  {
    icon: <Swords size={18} />,
    title: "Events and reasoning",
    subtitle: "Explain key decisions and turning points with evidence.",
    prompt: "Explain the events leading to Rama’s exile and the motivations of involved characters.",
  },
  {
    icon: <ScrollText size={18} />,
    title: "Teachings & values",
    subtitle: "Extract practical lessons applicable today.",
    prompt: "What are 7 key lessons from the Ramayana that apply to modern life?",
  },
];

export default function App() {
  const [chat, setChat] = useState(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // {type: "ok"|"bad", text: string}
  const chatRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, JSON.stringify(chat));
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  const addMsg = (role, content, sources = null) => {
    setChat((prev) => [...prev, { role, content, sources, ts: nowTs() }]);
  };

  const clearChat = () => {
    localStorage.removeItem(CHAT_KEY);
    setChat([]);
    setStatus(null);
  };

  const send = async (q) => {
    const text = (q ?? question).trim();
    if (!text || busy) return;

    setStatus(null);
    setBusy(true);
    addMsg("user", text);
    setQuestion("");

    try {
      const res = await axios.post("/api/chat", { question: text });
      addMsg("assistant", res.data.answer, res.data.sources || []);
      setStatus({ type: "ok", text: "Answer generated with grounding and citations." });
    } catch (e) {
      setStatus({ type: "bad", text: "Chat failed. Confirm backend is running and PDFs are indexed." });
      addMsg(
        "assistant",
        "I could not reach the backend or the index is not ready. Please start the backend and ingest PDFs first, then retry."
      );
    } finally {
      setBusy(false);
    }
  };

  const uploadPdfs = async (files) => {
    if (!files || files.length === 0) return;

    setStatus(null);
    setBusy(true);

    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);

      const res = await axios.post("/api/ingest", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

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

  return (
    <>
      {/* Background layers */}
      <div className="bg" />
      <div className="bgOverlay" />
      <div className="vignette" />

      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brandTitle">
              <BookOpen size={18} />
              Ramayana HelpBot
              <span className="brandBadge">RAG • Chroma</span>
            </div>
            <p className="brandDesc">
              Ask questions grounded in your <b>Valmiki Ramayana PDFs</b>. The system retrieves relevant passages
              from Chroma DB and responds with evidence and citations.
            </p>
          </div>

          <div className="sidecontent">
            <div className="card">
              <div className="cardHeader">
                <Upload size={16} />
                <h3>Index your PDFs</h3>
              </div>
              <p className="smallHint">
                Upload one or more PDFs. The backend will chunk, embed, and store them in local Chroma for semantic retrieval.
              </p>

              <label className="btn">
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => uploadPdfs(e.target.files)}
                  disabled={busy}
                />
                Upload PDFs
              </label>

              <div className="hr" />

              <p className="smallHint">
                Recommended: Use text-selectable PDFs for best results. (Scanned PDFs need OCR.)
              </p>
            </div>

            <div className="card">
              <div className="cardHeader">
                <Sparkles size={16} />
                <h3>Guided prompts</h3>
              </div>
              <p className="smallHint">
                Click a prompt to ask instantly. These are tuned for Ramayana exploration and grounded answers.
              </p>

              <div className="promptGrid">
                {PROMPT_CARDS.map((p) => (
                  <div key={p.title} className="promptPill" onClick={() => send(p.prompt)} role="button" tabIndex={0}>
                    <div style={{ color: "var(--accent)" }}>{p.icon}</div>
                    <div>
                      <p className="promptTitle">{p.title}</p>
                      <p className="promptSubtitle">{p.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <Trash2 size={16} />
                <h3>Session</h3>
              </div>
              <button className="btn" onClick={clearChat} disabled={busy}>
                Clear chat
              </button>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <div className="topTitle">
                <Sparkles size={18} />
                Chat
              </div>
              <div className="topSub">Grounded answers with citations from your indexed Ramayana PDFs.</div>
            </div>

            <div>
              {status?.type === "ok" && (
                <div className="statusOk">
                  <CheckCircle2 size={16} /> {status.text}
                </div>
              )}
              {status?.type === "bad" && (
                <div className="statusBad">
                  <AlertTriangle size={16} /> {status.text}
                </div>
              )}
            </div>
          </div>

          <div className="chat" ref={chatRef}>
            {chat.length === 0 && (
              <div className="bubble assistant">
                <div className="meta">
                  <span>System</span>
                  <span>{nowTs()}</span>
                </div>
                <div className="msgBody">
                  Upload your Ramayana PDFs from the left panel, then ask questions. I will retrieve relevant passages and
                  respond with evidence and citations.
                </div>
              </div>
            )}

            {chat.map((m, idx) => (
              <div
                key={idx}
                className={
                  "bubble " +
                  (m.role === "user" ? "user" : "assistant")
                }
              >
                <div className="meta">
                  <span>{m.role === "user" ? "You" : "Ramayana HelpBot"}</span>
                  <span>{m.ts}</span>
                </div>

                <div className="msgBody">
                  {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : <div>{m.content}</div>}
                </div>

                {m.role === "assistant" && Array.isArray(m.sources) && m.sources.length > 0 && (
                  <div className="sources">
                    <b>Retrieved sources</b>
                    <ul>
                      {m.sources.map((s, i) => (
                        <li key={i}>
                          {s.source_file ?? "unknown"} — page {String(s.page ?? "unknown")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="composer">
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

            <button className="sendBtn" onClick={() => send()} disabled={busy} title="Send">
              <Send size={18} />
            </button>
          </div>
        </main>
      </div>
    </>
  );
}

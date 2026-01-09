import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { BookOpen, Upload, Send, Trash2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";

const CHAT_KEY = "ramayana_helpbot_chat";

const PROMPTS = [
  "Who is Rama and what are his key virtues?",
  "Summarize the story arc of the Balakanda in 8 bullets.",
  "What is the significance of Sita's agni pariksha?",
  "Explain Hanuman's role and major contributions.",
  "List key characters and their relationships.",
  "Give key lessons from Ramayana applicable today."
];

function nowTs() {
  return new Date().toLocaleString();
}

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
  const [status, setStatus] = useState(null); // {type, text}
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
      setStatus({ type: "ok", text: "Answer generated with RAG grounding." });
    } catch {
      setStatus({ type: "bad", text: "Chat failed. Ensure backend is running and PDFs are indexed." });
      addMsg("assistant", "I could not reach the backend. Please confirm the server is running and the PDFs are ingested into Chroma.");
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
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStatus({ type: "ok", text: `Indexed ${res.data.chunks_indexed} chunks from uploaded PDFs.` });
    } catch {
      setStatus({ type: "bad", text: "Ingestion failed. Verify PDF files and backend logs." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <h1><BookOpen size={18}/> Ramayana HelpBot</h1>
          <p>RAG assistant over your Valmiki Ramayana PDFs using local Chroma DB. Upload PDFs, ingest, then chat with citations.</p>
        </div>

        <div className="sidecontent">
          <div className="card">
            <h3><Upload size={16}/> Index your PDFs</h3>
            <p className="hint">Upload one or more Ramayana PDFs. The backend chunks and embeds them, then stores vectors in local Chroma.</p>
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
            <div className="hint">Tip: for large PDFs, ingestion may take a minute.</div>
          </div>

          <div className="card">
            <h3><Sparkles size={16}/> Suggested prompts</h3>
            <p className="hint">Click a prompt to ask it instantly.</p>
            {PROMPTS.map((p) => (
              <span key={p} className="chip" onClick={() => send(p)}>{p}</span>
            ))}
          </div>

          <div className="card">
            <h3><Trash2 size={16}/> Session</h3>
            <button className="btn" onClick={clearChat} disabled={busy}>Clear chat</button>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div>
            <div className="title"><Sparkles size={18}/> Chat</div>
            <div className="subtitle">Grounded answers with evidence from your PDFs.</div>
          </div>
          <div>
            {status?.type === "ok" && (
              <div style={{display:"flex",gap:8,alignItems:"center", color:"var(--good)", fontSize:12}}>
                <CheckCircle2 size={16}/> {status.text}
              </div>
            )}
            {status?.type === "bad" && (
              <div style={{display:"flex",gap:8,alignItems:"center", color:"var(--bad)", fontSize:12}}>
                <AlertTriangle size={16}/> {status.text}
              </div>
            )}
          </div>
        </div>

        <div className="chat" ref={chatRef}>
          {chat.length === 0 && (
            <div className="bubble">
              <div className="meta"><span>System</span><span>{nowTs()}</span></div>
              <div>Upload your Ramayana PDFs (left panel), then ask questions. The assistant will retrieve relevant chunks and respond with citations.</div>
            </div>
          )}

          {chat.map((m, idx) => (
            <div key={idx} className={"bubble " + (m.role === "user" ? "user" : "")}>
              <div className="meta">
                <span>{m.role === "user" ? "You" : "Ramayana HelpBot"}</span>
                <span>{m.ts}</span>
              </div>

              {m.role === "assistant"
                ? <ReactMarkdown>{m.content}</ReactMarkdown>
                : <div>{m.content}</div>
              }

              {m.role === "assistant" && Array.isArray(m.sources) && m.sources.length > 0 && (
                <div className="sources">
                  <b>Retrieved sources</b>
                  <ul>
                    {m.sources.map((s, i) => (
                      <li key={i}>{s.source_file ?? "unknown"} — page {String(s.page ?? "unknown")}</li>
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
            placeholder={busy ? "Working..." : "Ask about Ramayana (characters, events, themes, teachings)..."}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            disabled={busy}
          />
          <button className="send" onClick={() => send()} disabled={busy} title="Send">
            <Send size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}

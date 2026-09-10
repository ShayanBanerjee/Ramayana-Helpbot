import React, { useEffect, useState } from "react";
import { X, LayoutDashboard, Users, MessageSquare, Zap, TrendingUp, UserCheck } from "lucide-react";
import api from "./api";

const AD_LEVELS = [
  { level: 0, label: "No ads", blurb: "Nothing rendered anywhere." },
  { level: 1, label: "Some ads", blurb: "One passive banner, in the sidebar only." },
  { level: 2, label: "Aggressive", blurb: "A banner in the sidebar and on the landing page — still never a popup." },
];

function StatTile({ icon, label, value }) {
  return (
    <div className="adminTile">
      <span className="adminTileIcon">{icon}</span>
      <div>
        <div className="adminTileValue">{value}</div>
        <div className="adminTileLabel">{label}</div>
      </div>
    </div>
  );
}

function BarRow({ title, series }) {
  const entries = Object.entries(series || {});
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="adminChart">
      <b>{title}</b>
      <div className="adminBars">
        {entries.map(([day, v]) => (
          <div key={day} className="adminBar" title={`${day}: ${v}`}>
            <div className="adminBarFill" style={{ height: `${Math.max(4, (v / max) * 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Visible only via the sidebar nav item App.jsx gates on `user?.is_admin`
 * (itself sourced from the backend's ADMIN_EMAILS allowlist — see
 * src/config.py) — but every route this calls is independently
 * admin-gated server-side too (src/admin.py's @admin_required), so a
 * non-admin poking the API directly still gets a 403, not just a hidden button.
 */
export default function AdminPanel({ onClose, adLevel, onAdLevelChange }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [savingLevel, setSavingLevel] = useState(false);

  useEffect(() => {
    api
      .adminStats()
      .then((res) => setStats(res.data))
      .catch(() => setError("Could not load stats. Confirm this account is listed in ADMIN_EMAILS on the server."));
  }, []);

  const chooseLevel = async (level) => {
    if (level === adLevel || savingLevel) return;
    setSavingLevel(true);
    setError(null);
    try {
      await api.setAdLevel(level);
      onAdLevelChange(level);
    } catch {
      setError("Could not update the ad level. Try again.");
    } finally {
      setSavingLevel(false);
    }
  };

  return (
    <div className="shlokaOverlay" onClick={onClose}>
      <div className="shlokaPanel adminPanel" onClick={(e) => e.stopPropagation()}>
        <div className="shlokaHeader">
          <div className="shlokaHeaderTitle">
            <span className="shlokaHeaderIcon">
              <LayoutDashboard size={17} />
            </span>
            <div>
              <h2>Admin Dashboard</h2>
              <p>App usage, tokens, and the ad-display level — visible only to admins.</p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="adminBody">
          {error && <p className="authError">{error}</p>}
          {!stats && !error && <p className="adminLoading">Loading statistics…</p>}

          {stats && (
            <>
              <div className="adminTiles">
                <StatTile icon={<Users size={16} />} label="Users" value={stats.users_total} />
                <StatTile
                  icon={<UserCheck size={16} />}
                  label="Guest → signup"
                  value={`${Math.round(stats.guest_conversion_rate * 100)}%`}
                />
                <StatTile icon={<MessageSquare size={16} />} label="Messages today" value={stats.messages_today} />
                <StatTile icon={<MessageSquare size={16} />} label="Messages (30d)" value={stats.messages_30d} />
                <StatTile icon={<Zap size={16} />} label="Tokens (30d)" value={stats.tokens_30d.toLocaleString()} />
                <StatTile icon={<TrendingUp size={16} />} label="Tokens total" value={stats.tokens_total.toLocaleString()} />
              </div>

              <div className="adminChartsRow">
                <BarRow title="Signups — last 30 days" series={stats.signups_by_day} />
                <BarRow title="Messages — last 30 days" series={stats.messages_by_day} />
              </div>

              <div className="adminSection">
                <b>Intent breakdown</b>
                <div className="adminIntentRow">
                  {Object.entries(stats.intent_breakdown).map(([intent, count]) => (
                    <span key={intent} className="adminIntentPill">
                      {intent} <b>{count}</b>
                    </span>
                  ))}
                  {Object.keys(stats.intent_breakdown).length === 0 && (
                    <span className="adminEmptyNote">No assistant replies yet.</span>
                  )}
                </div>
              </div>

              {stats.top_questions.length > 0 && (
                <div className="adminSection">
                  <b>Most-asked questions</b>
                  <ul className="adminTopQuestions">
                    {stats.top_questions.map((q, i) => (
                      <li key={i}>
                        <span>{q.question}</span>
                        <b>{q.count}×</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="adminSection">
                <b>Advertisement level</b>
                <p className="adminAdHint">
                  All three levels are passive banners only — never a popup, interstitial, or anything that
                  blocks the chat composer.
                </p>
                <div className="adminAdLevels">
                  {AD_LEVELS.map((l) => (
                    <button
                      key={l.level}
                      type="button"
                      className={"adminAdLevelBtn" + (adLevel === l.level ? " active" : "")}
                      onClick={() => chooseLevel(l.level)}
                      disabled={savingLevel}
                    >
                      <span>{l.label}</span>
                      <small>{l.blurb}</small>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

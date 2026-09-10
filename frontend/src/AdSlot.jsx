import React from "react";
import { Megaphone } from "lucide-react";

const SLOT_COPY = {
  sidebar: "Sponsorships help keep AyodhyaAI free for everyone.",
  landing: "This space is reserved for a sponsor message.",
};

/**
 * A clearly-labeled placeholder ad unit — no real ad network is wired up
 * (see AdminPanel.jsx's ad-level section for why), so this deliberately
 * doesn't try to look like a real ad; it's infrastructure a real network's
 * script tag can slot into later. `level` (0/1/2, from the admin-set
 * ad-level — see api.getAdLevel/setAdLevel) controls density:
 * 0 = nothing anywhere, 1 = the sidebar slot only, 2 = every slot. Never
 * rendered inside the message list or near the composer at any level, so
 * even the "aggressive" tier stays a passive banner, never something that
 * blocks reading or sending a message.
 */
export default function AdSlot({ slot, level }) {
  if (!level) return null;
  if (level === 1 && slot !== "sidebar") return null;

  return (
    <div className="adSlot" data-slot={slot}>
      <Megaphone size={13} />
      <div className="adSlotText">
        <b>Advertisement</b>
        <span>{SLOT_COPY[slot] || "This space is reserved for a sponsor message."}</span>
      </div>
    </div>
  );
}

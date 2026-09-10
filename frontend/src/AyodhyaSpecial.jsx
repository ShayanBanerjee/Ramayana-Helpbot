import React from "react";
import { X, Landmark, Sparkles, Plane, TrainFront, MapPin, CalendarDays } from "lucide-react";
import { AYODHYA_OVERVIEW, AYODHYA_PLACES, AYODHYA_PRACTICAL } from "./ayodhyaData";

const MODE_ICON = {
  "By air": <Plane size={14} />,
  "By rail": <TrainFront size={14} />,
  "By road": <MapPin size={14} />,
};

export default function AyodhyaSpecial({ onClose, onAsk }) {
  const ask = (place) => {
    onAsk(`Tell me about ${place.name} in Ayodhya and its role in the Ramayana.`);
    onClose();
  };

  return (
    <div className="shlokaOverlay" onClick={onClose}>
      <div className="shlokaPanel ayodhyaPanel" onClick={(e) => e.stopPropagation()}>
        <div className="shlokaHeader">
          <div className="shlokaHeaderTitle">
            <span className="shlokaHeaderIcon">
              <Landmark size={17} />
            </span>
            <div>
              <h2>Ayodhya Special</h2>
              <p>Rama's city today — what to see there, and why each place matters.</p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="ayodhyaBody">
          <p className="ayodhyaOverview">{AYODHYA_OVERVIEW}</p>

          <div className="ayodhyaPlaces">
            {AYODHYA_PLACES.map((p) => (
              <div key={p.id} className="ayodhyaPlace">
                <div className="ayodhyaPlaceHead">
                  <h3>{p.name}</h3>
                  <span className="ayodhyaPlaceTag">{p.tag}</span>
                </div>
                <p className="ayodhyaPlaceSummary">{p.summary}</p>
                <p className="ayodhyaPlaceImportance">
                  <b>Why it matters —</b> {p.importance}
                </p>
                <p className="ayodhyaPlaceTip">{p.tip}</p>
                <button className="ayodhyaAskBtn" onClick={() => ask(p)} type="button">
                  <Sparkles size={13} />
                  Ask about {p.name}
                </button>
              </div>
            ))}
          </div>

          <div className="ayodhyaPractical">
            <h3>Getting there &amp; when to go</h3>
            <div className="ayodhyaGettingThere">
              {AYODHYA_PRACTICAL.gettingThere.map((g) => (
                <div key={g.mode} className="ayodhyaTravelRow">
                  <span className="ayodhyaTravelIcon">{MODE_ICON[g.mode]}</span>
                  <span>
                    <b>{g.mode}</b> — {g.detail}
                  </span>
                </div>
              ))}
            </div>
            <div className="ayodhyaTravelRow">
              <span className="ayodhyaTravelIcon">
                <CalendarDays size={14} />
              </span>
              <span>
                <b>Best time to visit</b> — {AYODHYA_PRACTICAL.bestTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

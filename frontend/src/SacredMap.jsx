import React, { useState } from "react";
import { X, MapPinned, MapPin, Sparkles, Footprints } from "lucide-react";
import { SACRED_PLACES, MAIN_ROUTE_IDS } from "./sacredGeography";

const byId = Object.fromEntries(SACRED_PLACES.map((p) => [p.id, p]));
const ROUTE_PLACES = MAIN_ROUTE_IDS.map((id) => byId[id]);

/**
 * A simple, hand-drawn silhouette of the subcontinent + Sri Lanka — not a
 * geographic projection, just enough shape for the markers to read as
 * sitting "on a map" rather than floating on an abstract gradient. Drawn
 * in the same 0-100 coordinate space as each place's x/y, so no separate
 * projection math is needed to keep markers roughly on the landmass.
 */
function Landmass() {
  return (
    <>
      <path
        className="mapLandmass"
        d="M18,6 C30,3 52,2 68,6 C76,9 78,15 74,20 C64,26 55,32 48,42
           C43,52 40,60 37,68 C35,75 36,80 34,84 C31,80 27,73 23,66
           C17,56 12,46 11,35 C10,24 12,14 18,6 Z"
      />
      <ellipse className="mapLandmass mapIsland" cx="47.5" cy="93.5" rx="6.5" ry="6" />
    </>
  );
}

export default function SacredMap({ onClose, onAsk }) {
  const [activeId, setActiveId] = useState(null);
  const active = SACRED_PLACES.find((p) => p.id === activeId) || null;

  const ask = (place) => {
    onAsk(`Tell me about ${place.name} (${place.modern}) and its role in the Ramayana.`);
    onClose();
  };

  return (
    <div className="shlokaOverlay" onClick={onClose}>
      <div className="shlokaPanel mapPanel" onClick={(e) => e.stopPropagation()}>
        <div className="shlokaHeader">
          <div className="shlokaHeaderTitle">
            <span className="shlokaHeaderIcon">
              <MapPinned size={17} />
            </span>
            <div>
              <h2>Sacred Geography</h2>
              <p>
                A simple map of the Ramayana's world, Ayodhya to Lanka — distances are straight-line estimates
                from each place's modern coordinates. Click a marker to explore.
              </p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mapBody">
          <div className="mapCanvasWrap">
            <div className="mapCanvas">
              <svg className="mapRoute" viewBox="0 0 100 100" preserveAspectRatio="none">
                <Landmass />
                <polyline
                  points={ROUTE_PLACES.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  className="mapRouteLine"
                />
                {ROUTE_PLACES.slice(1).map((p, i) => {
                  const prev = ROUTE_PLACES[i];
                  const mx = (prev.x + p.x) / 2 + 8;
                  const my = (prev.y + p.y) / 2;
                  const label = `${p.distanceFromPrevKm} km`;
                  return (
                    <g key={p.id}>
                      <rect
                        x={mx - label.length * 0.95}
                        y={my - 2.1}
                        width={label.length * 1.9}
                        height="3.6"
                        rx="1.8"
                        className="mapDistancePill"
                      />
                      <text x={mx} y={my + 0.9} className="mapDistanceLabel" textAnchor="middle">
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {SACRED_PLACES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={
                    "mapMarker" +
                    (p.id === activeId ? " active" : "") +
                    (p.special === "hanuman" ? " special" : "")
                  }
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  onClick={() => setActiveId(p.id)}
                  title={p.name}
                >
                  {p.special === "hanuman" && (
                    <span className="mapHanuman" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4.4" fill="#e8b563" />
                        <circle cx="8.3" cy="6.2" r="1.5" fill="#e8b563" />
                        <circle cx="15.7" cy="6.2" r="1.5" fill="#e8b563" />
                        <path d="M8.5 9.3c1 1.2 6 1.2 7 0" stroke="#5b2e12" strokeWidth="0.9" strokeLinecap="round" fill="none" />
                        <path
                          d="M12 12.4c3 0 6.2 1.6 7.4 5.2"
                          stroke="#e8b563"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <span>Hanuman ji</span>
                    </span>
                  )}
                  <span className="mapMarkerDot">
                    <MapPin size={13} />
                  </span>
                  <span className="mapMarkerLabel">{p.name}</span>
                </button>
              ))}
            </div>
            <p className="mapCanvasNote">
              A simple, illustrative map — not a precise geographic projection. Distances are straight-line
              (beeline) estimates between each place's modern coordinates.
            </p>
          </div>

          <div className="mapDetail">
            {active ? (
              <>
                {active.image && (
                  <div className="mapDetailImageWrap">
                    <img className="mapDetailImage" src={active.image} alt={active.imageCaption || active.name} />
                    {active.imageCaption && <p className="mapDetailImageCaption">{active.imageCaption}</p>}
                  </div>
                )}
                <div className="mapDetailEra">{active.era}</div>
                <h3>{active.name}</h3>
                <p className="mapDetailModern">{active.modern}</p>

                {active.distanceFromPrevKm > 0 && (
                  <div className="mapDetailStat">
                    <Footprints size={14} />
                    <span>
                      <b>{active.distanceFromPrevKm} km</b> beeline from the previous stop — roughly{" "}
                      <b>{active.footDays} days</b> on foot at a traditional ~25 km/day pace
                    </span>
                  </div>
                )}

                <p className="mapDetailSummary">{active.summary}</p>
                <div className="mapDetailFolklore">
                  <b>Local tradition &amp; folklore</b>
                  <p>{active.folklore}</p>
                </div>
                <button className="btnPrimary mapAskBtn" onClick={() => ask(active)} type="button">
                  <Sparkles size={14} />
                  Ask about {active.name}
                </button>
              </>
            ) : (
              <div className="mapDetailEmpty">
                <MapPinned size={26} />
                <p>Click any marker on the map to read about that place in the story, and the local tradition tied to it.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

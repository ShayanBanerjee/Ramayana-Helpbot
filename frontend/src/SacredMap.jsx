import React, { useRef, useState } from "react";
import { X, MapPinned, MapPin, Sparkles, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { SACRED_PLACES } from "./sacredGeography";

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * Pinch/wheel/drag zoom over the map image, implemented with a plain CSS
 * transform rather than a library — the only interaction this view needs is
 * "zoom toward a point, then pan," which is a small enough amount of math to
 * keep inline. `pan` is in viewport pixels and always clamped so the image
 * can't be dragged past its own edge (see `clampPan`), computed against the
 * *unscaled* viewport size since the transform's origin is the top-left of
 * an inner layer that exactly fills the viewport at zoom 1.
 */
export default function SacredMap({ onClose, onAsk }) {
  const [activeId, setActiveId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);
  const dragState = useRef(null);
  const pinchState = useRef(null);

  const active = SACRED_PLACES.find((p) => p.id === activeId) || null;

  const ask = (place) => {
    onAsk(`Tell me about ${place.name} (${place.modern}) and its role in the Ramayana.`);
    onClose();
  };

  const clampPan = (x, y, z) => {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const { width, height } = el.getBoundingClientRect();
    const minX = width - width * z;
    const minY = height - height * z;
    return { x: clamp(x, minX, 0), y: clamp(y, minY, 0) };
  };

  const zoomTo = (nextZoom, anchor) => {
    const el = wrapRef.current;
    if (!el) return;
    const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const rect = el.getBoundingClientRect();
    const ax = anchor ? anchor.x - rect.left : rect.width / 2;
    const ay = anchor ? anchor.y - rect.top : rect.height / 2;
    const contentX = (ax - pan.x) / zoom;
    const contentY = (ay - pan.y) / zoom;
    setZoom(z);
    setPan(clampPan(ax - contentX * z, ay - contentY * z, z));
  };

  const onWheel = (e) => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0018);
    zoomTo(zoom * factor, { x: e.clientX, y: e.clientY });
  };

  const onMouseDown = (e) => {
    if (zoom <= 1) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: false };
  };
  const onMouseMove = (e) => {
    const d = dragState.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    setPan(clampPan(d.panX + dx, d.panY + dy, zoom));
  };
  const endDrag = () => {
    dragState.current = null;
  };

  const touchDist = (touches) => {
    const [a, b] = touches;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };
  const touchMid = (touches) => {
    const [a, b] = touches;
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchState.current = { dist: touchDist(e.touches), zoom };
      dragState.current = null;
    } else if (e.touches.length === 1 && zoom > 1) {
      const t = e.touches[0];
      dragState.current = { startX: t.clientX, startY: t.clientY, panX: pan.x, panY: pan.y, moved: false };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 2 && pinchState.current) {
      e.preventDefault();
      const ratio = touchDist(e.touches) / pinchState.current.dist;
      zoomTo(pinchState.current.zoom * ratio, touchMid(e.touches));
    } else if (e.touches.length === 1 && dragState.current) {
      e.preventDefault();
      const t = e.touches[0];
      const d = dragState.current;
      const dx = t.clientX - d.startX;
      const dy = t.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
      setPan(clampPan(d.panX + dx, d.panY + dy, zoom));
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length < 2) pinchState.current = null;
    if (e.touches.length === 0) dragState.current = null;
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
                The Ramayana's world, Ayodhya to Lanka, on an 18th-century map of Hindoostan. Scroll, pinch, or
                use the controls to zoom — click a marker to explore.
              </p>
            </div>
          </div>
          <button className="shlokaCloseBtn" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mapBody">
          <div className="mapCanvasWrap">
            <div
              className="mapZoomWrap"
              ref={wrapRef}
              onWheel={onWheel}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onDoubleClick={(e) => zoomTo(zoom >= MAX_ZOOM - 0.01 ? 1 : zoom * 2, { x: e.clientX, y: e.clientY })}
              style={{ cursor: zoom > 1 ? "grab" : "default" }}
            >
              <div
                className="mapZoomInner"
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              >
                <img
                  className="mapImage"
                  src="/sacred-map.jpg"
                  alt="Hindoostan, an 18th-century map of the Indian subcontinent by James Rennell (1782)"
                  draggable={false}
                />

                {SACRED_PLACES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={"mapMarker" + (p.id === activeId ? " active" : "") + (p.special === "hanuman" ? " special" : "")}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    onClick={() => {
                      if (dragState.current?.moved) return;
                      setActiveId(p.id);
                    }}
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

              <div className="mapZoomControls" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => zoomTo(zoom * 1.5)} title="Zoom in">
                  <ZoomIn size={15} />
                </button>
                <button type="button" onClick={() => zoomTo(zoom / 1.5)} title="Zoom out">
                  <ZoomOut size={15} />
                </button>
                <button type="button" onClick={resetView} title="Reset view">
                  <Maximize2 size={14} />
                </button>
              </div>
            </div>
            <p className="mapCanvasNote">Hindoostan, by James Rennell, 1782 — public domain, Wikimedia Commons.</p>
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

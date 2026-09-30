"use client";

import { useState } from "react";
import { ANATOMICAL_ZONES } from "@/lib/dermatologyEngine";

export default function AnatomicalBodyMap({ selectedZoneId, onSelectZone }) {
  const [view, setView] = useState("front"); // 'front' | 'back'

  const frontZones = [
    { id: "face", label: "Face & Cheeks", x: 50, y: 12 },
    { id: "neck", label: "Neck", x: 50, y: 19 },
    { id: "chest", label: "Chest", x: 50, y: 28 },
    { id: "abdomen", label: "Abdomen", x: 50, y: 40 },
    { id: "elbow_flexural", label: "Elbow Crease (Flexural)", x: 26, y: 38 },
    { id: "forearm", label: "Forearm", x: 21, y: 48 },
    { id: "hands", label: "Hands / Palms", x: 16, y: 58 },
    { id: "knee_extensor", label: "Knee (Extensor)", x: 42, y: 72 },
    { id: "legs", label: "Shin / Lower Leg", x: 43, y: 84 },
    { id: "feet", label: "Feet / Toes", x: 43, y: 95 },
  ];

  const backZones = [
    { id: "scalp", label: "Scalp (Occipital)", x: 50, y: 11 },
    { id: "back_upper", label: "Upper Back", x: 50, y: 28 },
    { id: "back_lower", label: "Lower Back / Lumbar", x: 50, y: 42 },
    { id: "elbow_extensor", label: "Elbow (Extensor)", x: 25, y: 38 },
    { id: "forearm", label: "Forearm (Dorsal)", x: 20, y: 48 },
    { id: "hands", label: "Dorsal Hands", x: 15, y: 58 },
    { id: "knee_flexural", label: "Behind Knees (Popliteal)", x: 42, y: 72 },
    { id: "legs", label: "Calves", x: 43, y: 84 },
    { id: "feet", label: "Soles / Heels", x: 43, y: 95 },
  ];

  const currentHotspots = view === "front" ? frontZones : backZones;
  const activeZone = ANATOMICAL_ZONES.find((z) => z.id === selectedZoneId) || ANATOMICAL_ZONES[9];

  return (
    <div className="body-map-card">
      <div className="body-map-head">
        <div className="bm-title-group">
          <span className="diag-pill" style={{ background: "rgba(56, 189, 248, 0.15)", color: "#7dd3fc" }}>
            <i className="fa-solid fa-child" /> Anatomical Localization
          </span>
          <span className="bm-subtitle">Pinpoint lesion site (affects differential probability)</span>
        </div>
        <div className="bm-view-toggle">
          <button
            type="button"
            className={`bm-toggle-btn ${view === "front" ? "active" : ""}`}
            onClick={() => setView("front")}
          >
            Anterior (Front)
          </button>
          <button
            type="button"
            className={`bm-toggle-btn ${view === "back" ? "active" : ""}`}
            onClick={() => setView("back")}
          >
            Posterior (Back)
          </button>
        </div>
      </div>

      <div className="body-map-content">
        {/* Silhouette Visual with Interactive Hotspots */}
        <div className="silhouette-wrapper">
          <svg
            viewBox="0 0 200 400"
            className="silhouette-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Minimalist Medical Body Silhouette */}
            <path
              d="M 100 25 C 112 25 120 36 120 50 C 120 62 112 70 100 70 C 88 70 80 62 80 50 C 80 36 88 25 100 25 Z
                 M 92 73 C 80 78 68 85 64 100 C 60 115 54 150 48 185 C 45 200 38 215 32 235 C 28 245 25 252 28 255 C 32 258 38 252 44 240 C 50 220 56 185 60 160 L 62 205 C 64 240 68 280 72 315 L 72 375 C 72 385 66 390 68 393 C 71 395 80 395 86 385 C 92 370 94 330 96 280 L 100 230 L 104 280 C 106 330 108 370 114 385 C 120 395 129 395 132 393 C 134 390 128 385 128 375 L 128 315 C 132 280 136 240 138 205 L 140 160 C 144 185 150 220 156 240 C 162 252 168 258 172 255 C 175 252 172 245 168 235 C 162 215 155 200 152 185 C 146 150 140 115 136 100 C 132 85 120 78 108 73 Z"
              className="body-path"
            />
          </svg>

          {/* Hotspot Markers */}
          {currentHotspots.map((spot) => {
            const isSelected = selectedZoneId === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                className={`hotspot-dot ${isSelected ? "selected" : ""}`}
                style={{ top: `${spot.y}%`, left: `${spot.x}%` }}
                onClick={() => onSelectZone(spot.id)}
                title={spot.label}
              >
                <span className="dot-ripple" />
                <span className="dot-core" />
              </button>
            );
          })}
        </div>

        {/* Selected Zone Info Box & Quick Zone Chips */}
        <div className="body-zone-details">
          <div className="active-zone-banner">
            <div className="az-top">
              <span className="az-tag">Selected Site</span>
              <span className="az-region">{activeZone.region}</span>
            </div>
            <strong className="az-name">{activeZone.label}</strong>
            <p className="az-category">
              Pattern:{" "}
              {activeZone.category === "flexural"
                ? "Flexural surface (Classic Eczema fold)"
                : activeZone.category === "extensor"
                ? "Extensor surface (Classic Psoriasis distribution)"
                : activeZone.category === "seborrheic" || activeZone.category === "seborrheic_sun"
                ? "Sebum-rich zone (Seborrheic dermatitis predisposition)"
                : activeZone.category === "contact_occupational" || activeZone.category === "contact_sun"
                ? "High environmental contact surface"
                : "General dermatological region"}
            </p>
          </div>

          <span className="quick-select-label">Or choose common site:</span>
          <div className="zone-chips-grid">
            {ANATOMICAL_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={`zone-chip ${selectedZoneId === zone.id ? "active" : ""}`}
                onClick={() => onSelectZone(zone.id)}
              >
                {zone.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  PRODUCT_PRESETS,
  scanIngredientsForAllergens,
} from "@/lib/dermatologyEngine";

export default function IngredientScanner({ onAllergensDetected, detectedAllergens = [] }) {
  const [inputText, setInputText] = useState("");
  const [activePreset, setActivePreset] = useState(null);

  const handleScan = (text) => {
    setInputText(text);
    const matches = scanIngredientsForAllergens(text);
    if (onAllergensDetected) {
      onAllergensDetected(matches);
    }
  };

  const handleSelectPreset = (preset) => {
    setActivePreset(preset.label);
    handleScan(preset.ingredients);
  };

  return (
    <div className="allergen-scanner-card">
      <div className="asc-head">
        <div className="diag-title-wrap">
          <span className="diag-pill" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fcd34d" }}>
            <i className="fa-solid fa-flask-vial" /> Contact Allergen &amp; Trigger Scanner
          </span>
          <h4 className="asc-title">Household &amp; Skincare Product Screener</h4>
        </div>
        <span className="asc-tagline">
          Cross-references with NACDG / T.R.U.E. Test contact allergen registry
        </span>
      </div>

      {/* Quick Preset Buttons */}
      <div className="preset-group">
        <span className="preset-label">Quick test suspected product:</span>
        <div className="preset-chips">
          {PRODUCT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`preset-btn ${activePreset === p.label ? "active" : ""}`}
              onClick={() => handleSelectPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input or Paste Area */}
      <div className="asc-input-wrap">
        <textarea
          className="asc-textarea"
          rows={3}
          placeholder="Or paste ingredients from your soap, lotion, sunscreen, or detergent bottle..."
          value={inputText}
          onChange={(e) => {
            setActivePreset(null);
            handleScan(e.target.value);
          }}
        />
        <div className="asc-meta">
          <span>{detectedAllergens.length} Suspected Trigger(s) Found</span>
          {inputText && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => {
                setInputText("");
                setActivePreset(null);
                if (onAllergensDetected) onAllergensDetected([]);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Detected Triggers Cards */}
      {detectedAllergens.length > 0 ? (
        <div className="detected-triggers-list">
          <span className="triggers-header">
            <i className="fa-solid fa-triangle-exclamation" /> Identified Sensitizing Triggers:
          </span>
          <div className="triggers-grid">
            {detectedAllergens.map((item, i) => (
              <div key={i} className="trigger-card" style={{ borderLeftColor: item.hazardColor }}>
                <div className="tc-top">
                  <strong className="tc-name">{item.name}</strong>
                  <span className="tc-hazard" style={{ color: item.hazardColor }}>
                    {item.hazardLevel}
                  </span>
                </div>
                <div className="tc-matches">
                  Matched terms: <code>{item.matchedTokens.join(", ")}</code>
                </div>
                <p className="tc-advice">
                  <strong>Clinical recommendation:</strong> {item.advice}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-triggers-note">
          <i className="fa-solid fa-circle-check" />
          <span>No common high-risk contact sensitizers detected in current text.</span>
        </div>
      )}
    </div>
  );
}

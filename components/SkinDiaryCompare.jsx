"use client";

import { useRef, useState } from "react";
import { computeTemporalComparison } from "@/lib/clinicalVision";

export default function SkinDiaryCompare({ initialCurrentImage }) {
  const [baselineImg, setBaselineImg] = useState(null);
  const [currentImg, setCurrentImg] = useState(initialCurrentImage || null);
  const [sliderPos, setSliderPos] = useState(50);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [viewMode, setViewMode] = useState("slider"); // 'slider' | 'heatmap'

  const baselineInputRef = useRef(null);
  const currentInputRef = useRef(null);

  const handleBaselineUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setBaselineImg(reader.result);
      setComparisonResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCurrentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentImg(reader.result);
      setComparisonResult(null);
    };
    reader.readAsDataURL(file);
  };

  const runComparison = async () => {
    if (!baselineImg || !currentImg) return;
    setIsComparing(true);

    try {
      const loadImg = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const [imgB, imgC] = await Promise.all([loadImg(baselineImg), loadImg(currentImg)]);

      const cB = document.createElement("canvas");
      const cC = document.createElement("canvas");
      const w = 480;
      const h = Math.round(w * (imgB.height / imgB.width));
      cB.width = w;
      cB.height = h;
      cC.width = w;
      cC.height = h;

      const ctxB = cB.getContext("2d");
      const ctxC = cC.getContext("2d");
      ctxB.drawImage(imgB, 0, 0, w, h);
      ctxC.drawImage(imgC, 0, 0, w, h);

      const res = computeTemporalComparison(cB, cC);
      setComparisonResult(res);
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="diary-section anim" style={{ "--d": "0.15s" }}>
      <div className="diary-head">
        <div className="diag-title-wrap">
          <span className="diag-pill" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#86efac" }}>
            <i className="fa-solid fa-clock-rotate-left" /> Spatio-Temporal Tracking
          </span>
          <h3 className="diag-title">Skin Diary: Lesion Evolution &amp; Growth Delta</h3>
        </div>
        <p className="diary-desc">
          Compare a prior baseline photo with your current skin check. The computer vision alignment detects
          surface expansion, pigment shifts, and active inflammation healing.
        </p>
      </div>

      {/* Upload Pair Row */}
      <div className="diary-inputs-row">
        {/* Baseline (Past) */}
        <div
          className={`diary-dropzone ${baselineImg ? "has-img" : ""}`}
          onClick={() => baselineInputRef.current?.click()}
        >
          {baselineImg ? (
            <div className="diary-preview-wrap">
              <img src={baselineImg} alt="Baseline past photo" />
              <span className="diary-badge past">Baseline (Day 1)</span>
              <button
                type="button"
                className="diary-change-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  baselineInputRef.current?.click();
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="diary-placeholder">
              <i className="fa-solid fa-calendar-plus" />
              <strong>Upload Prior Photo (Day 1)</strong>
              <span>Tap to pick a past photo of this spot</span>
            </div>
          )}
          <input
            type="file"
            ref={baselineInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleBaselineUpload}
          />
        </div>

        {/* Action Button */}
        <div className="diary-center-action">
          <button
            type="button"
            className="compare-trigger-btn"
            disabled={!baselineImg || !currentImg || isComparing}
            onClick={runComparison}
          >
            {isComparing ? (
              <>
                <span className="spin" /> Aligning…
              </>
            ) : (
              <>
                <i className="fa-solid fa-code-compare" /> Compute Delta
              </>
            )}
          </button>
        </div>

        {/* Current (Today) */}
        <div
          className={`diary-dropzone ${currentImg ? "has-img" : ""}`}
          onClick={() => currentInputRef.current?.click()}
        >
          {currentImg ? (
            <div className="diary-preview-wrap">
              <img src={currentImg} alt="Current check photo" />
              <span className="diary-badge now">Current (Today)</span>
              <button
                type="button"
                className="diary-change-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  currentInputRef.current?.click();
                }}
              >
                Change
              </button>
            </div>
          ) : (
            <div className="diary-placeholder">
              <i className="fa-solid fa-camera" />
              <strong>Upload Today&apos;s Photo</strong>
              <span>Pick current checkup photo</span>
            </div>
          )}
          <input
            type="file"
            ref={currentInputRef}
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleCurrentUpload}
          />
        </div>
      </div>

      {/* Comparison Results */}
      {comparisonResult && (
        <div className="diary-result-panel">
          {/* Mode Switcher */}
          <div className="diary-view-tabs">
            <button
              type="button"
              className={`view-tab ${viewMode === "slider" ? "active" : ""}`}
              onClick={() => setViewMode("slider")}
            >
              <i className="fa-solid fa-arrows-left-right" /> Interactive Split Slider
            </button>
            <button
              type="button"
              className={`view-tab ${viewMode === "heatmap" ? "active" : ""}`}
              onClick={() => setViewMode("heatmap")}
            >
              <i className="fa-solid fa-bullseye" /> Differential Delta Heatmap
            </button>
          </div>

          <div className="diary-display-grid">
            {/* Main Interactive Viewer */}
            <div className="slider-container">
              {viewMode === "slider" ? (
                <div
                  className="split-viewer"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                    setSliderPos(pos);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
                    setSliderPos(pos);
                  }}
                >
                  {/* Current Photo (Background) */}
                  <img src={currentImg} alt="Current" className="split-img" />

                  {/* Baseline Photo (Clipped Overlay) */}
                  <div
                    className="split-overlay"
                    style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                  >
                    <img src={baselineImg} alt="Baseline" className="split-img" />
                  </div>

                  {/* Divider Line */}
                  <div className="split-divider" style={{ left: `${sliderPos}%` }}>
                    <div className="split-handle">
                      <i className="fa-solid fa-arrows-left-right" />
                    </div>
                  </div>

                  <span className="split-label left">Day 1 (Past)</span>
                  <span className="split-label right">Today (Current)</span>
                </div>
              ) : (
                <div className="heatmap-viewer">
                  <img
                    src={comparisonResult.diffHeatmapUrl}
                    alt="Differential Delta Heatmap"
                    className="heatmap-img"
                  />
                  <div className="heatmap-key">
                    <span className="key-item green">
                      <span className="dot" /> Resolved / Healed Tissue
                    </span>
                    <span className="key-item red">
                      <span className="dot" /> Expanded / Darkened Lesion
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Breakdown Card */}
            <div className="diary-metrics-card">
              <span className="diag-pill" style={{ background: "rgba(124, 108, 255, 0.15)", color: "#c4bcff" }}>
                <i className="fa-solid fa-chart-line" /> Temporal Delta Breakdown
              </span>

              <div
                className="progression-banner"
                style={{
                  borderColor: comparisonResult.deltaSummary.netColor,
                  background: `${comparisonResult.deltaSummary.netColor}14`,
                }}
              >
                <i
                  className="fa-solid fa-circle-check"
                  style={{ color: comparisonResult.deltaSummary.netColor }}
                />
                <div>
                  <strong>{comparisonResult.deltaSummary.netProgression}</strong>
                  <p>Based on pixel-level CIE L*a*b* differential variance.</p>
                </div>
              </div>

              <div className="delta-stat-row">
                <div className="delta-stat">
                  <span className="delta-label">Tissue Healing Index</span>
                  <span className="delta-val green">+{comparisonResult.deltaSummary.healedPercent}%</span>
                </div>
                <div className="delta-stat">
                  <span className="delta-label">New Expansion Index</span>
                  <span className="delta-val red">+{comparisonResult.deltaSummary.expandedPercent}%</span>
                </div>
              </div>

              <div className="diary-advice">
                <i className="fa-solid fa-lightbulb" />
                <span>
                  Tip: Share both photos with your dermatologist. Sudden changes in border or color variegation
                  within 30 days are critical indicators for in-person dermoscopy.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

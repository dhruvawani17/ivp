"use client";

import { useState } from "react";

export default function DiagnosticVisualizer({
  analysisData,
  videoData,
  onOpenReport,
}) {
  const [activeLayer, setActiveLayer] = useState("contour");
  const [hoverPixel, setHoverPixel] = useState(null);

  if (!analysisData) return null;

  const { fitzpatrick, metrics, layers, thresholdUsed } = analysisData;
  const { asymmetry, border, color, diameter, tdsScore, riskTier, riskColor } =
    metrics;

  const layerOptions = [
    { id: "raw", label: "Raw Photo", icon: "fa-camera", desc: "Original captured image" },
    { id: "contour", label: "Lesion Boundary", icon: "fa-draw-polygon", desc: "Computer vision segmentation mask" },
    { id: "erythema", label: "Erythema Heatmap", icon: "fa-fire-flame-curved", desc: "CIE L*a*b* inflammation index" },
    { id: "melanin", label: "Melanin Density", icon: "fa-palette", desc: "Pigment concentration map" },
    { id: "texture", label: "Surface Texture", icon: "fa-braille", desc: "Sobel edge roughness & scaling" },
  ];

  return (
    <div className="diag-suite anim" style={{ "--d": "0.1s" }}>
      {/* Header Badge */}
      <div className="diag-head">
        <div className="diag-title-wrap">
          <span className="diag-pill">
            <i className="fa-solid fa-microscope" /> Computer Vision Engine
          </span>
          <h3 className="diag-title">Quantitative Lesion &amp; Image Analysis</h3>
        </div>
        {onOpenReport && (
          <button
            type="button"
            className="report-btn"
            onClick={onOpenReport}
            title="Generate Clinical Referral Document"
          >
            <i className="fa-solid fa-file-medical" /> Clinical SOAP Report
          </button>
        )}
      </div>

      {/* Main Grid: Visualizer on Left, ABCDE Scorecard on Right */}
      <div className="diag-grid">
        {/* Left: Interactive Multi-Layer Canvas */}
        <div className="diag-viewport-card">
          {/* Layer Selector Tabs */}
          <div className="layer-tabs" role="tablist">
            {layerOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={activeLayer === opt.id}
                className={`layer-tab ${activeLayer === opt.id ? "active" : ""}`}
                onClick={() => setActiveLayer(opt.id)}
              >
                <i className={`fa-solid ${opt.icon}`} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>


          {/* Canvas Display Area */}
          <div
            className="canvas-container"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
              setHoverPixel({ x, y });
            }}
            onMouseLeave={() => setHoverPixel(null)}
          >
            <img
              src={layers[activeLayer] || layers.raw}
              alt={activeLayer}
              className="viewport-img"
            />

            {/* Current Layer HUD Badge */}
            <div className="viewport-hud">
              <span className="hud-badge">
                <i
                  className={`fa-solid ${
                    layerOptions.find((l) => l.id === activeLayer)?.icon || "fa-eye"
                  }`}
                />{" "}
                {layerOptions.find((l) => l.id === activeLayer)?.label}
              </span>
              <span className="hud-desc">
                {layerOptions.find((l) => l.id === activeLayer)?.desc}
              </span>
            </div>

            {/* Hover Inspector Coordinate Overlay */}
            {hoverPixel && (
              <div className="pixel-inspector">
                <span>Coord: {hoverPixel.x}%, {hoverPixel.y}%</span>
                <span>Active Filter: {activeLayer}</span>
              </div>
            )}
          </div>

          {/* Color Scale Legend for Heatmap */}
          {activeLayer === "erythema" && (
            <div className="heatmap-legend">
              <span className="legend-label">Normal Skin</span>
              <div className="thermal-bar" />
              <span className="legend-label hot">Severe Erythema / Inflammation</span>
            </div>
          )}

          {activeLayer === "melanin" && (
            <div className="heatmap-legend">
              <span className="legend-label">Light Pigment</span>
              <div className="melanin-bar" />
              <span className="legend-label hot">Deep Pigmentation / Melanin</span>
            </div>
          )}
        </div>

        {/* Right: Quantitative ABCDE Scorecard & Fitzpatrick */}
        <div className="diag-metrics-col">
          {/* Fitzpatrick Phototype Tone-Fairness Banner */}
          <div className="fitz-card">
            <div className="fitz-top">
              <div className="fitz-badge">
                <i className="fa-solid fa-sun" /> {fitzpatrick.type} ({fitzpatrick.name})
              </div>
              <span className="ita-tag"><i className="fa-solid fa-wand-magic-sparkles" /> Auto-Calibrated</span>
            </div>
            <p className="fitz-desc">{fitzpatrick.description}</p>
            <div className="fitz-clinical-note">
              <strong>Clinical Tone Adjustment:</strong> {fitzpatrick.erythemaTone}
            </div>
          </div>

          {/* Composite Total Dermoscopy Score */}
          <div className="tds-card" style={{ borderColor: riskColor }}>
            <div className="tds-header">
              <div>
                <span className="metric-tag">Total Dermoscopy Index (TDS)</span>
                <div className="tds-value-row">
                  <span className="tds-number">{tdsScore}</span>
                  <span className="tds-range">/ 8.90</span>
                </div>
              </div>
              <div className="tds-status" style={{ color: riskColor, background: `${riskColor}18` }}>
                <i className="fa-solid fa-shield-halved" />
                <span>{riskTier}</span>
              </div>
            </div>
          </div>

          {/* ABCDE 4-Grid Cards */}
          <div className="abcde-grid">
            {/* A: Asymmetry */}
            <div className="abcde-item">
              <div className="abcde-letter">A</div>
              <div className="abcde-body">
                <div className="abcde-label-row">
                  <strong>Asymmetry Index</strong>
                  <span className="abcde-score">{asymmetry.score}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${asymmetry.score}%`,
                      background: asymmetry.score > 40 ? "#ef4444" : "#4fd1c5",
                    }}
                  />
                </div>
                <span className="abcde-rating">{asymmetry.rating}</span>
              </div>
            </div>

            {/* B: Border Irregularity */}
            <div className="abcde-item">
              <div className="abcde-letter">B</div>
              <div className="abcde-body">
                <div className="abcde-label-row">
                  <strong>Border Compactness</strong>
                  <span className="abcde-score">{border.score}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${border.score}%`,
                      background: border.score > 45 ? "#ef4444" : "#7c6cff",
                    }}
                  />
                </div>
                <span className="abcde-rating">
                  Compactness: {border.compactness} · {border.rating}
                </span>
              </div>
            </div>

            {/* C: Color Variegation */}
            <div className="abcde-item">
              <div className="abcde-letter">C</div>
              <div className="abcde-body">
                <div className="abcde-label-row">
                  <strong>Color Variegation</strong>
                  <span className="abcde-score">{color.distinctCount} Clust.</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(color.distinctCount / 6) * 100}%`,
                      background: color.distinctCount > 3 ? "#ef4444" : "#38bdf8",
                    }}
                  />
                </div>
                <span className="abcde-rating">{color.rating}</span>
              </div>
            </div>

            {/* D: Diameter */}
            <div className="abcde-item">
              <div className="abcde-letter">D</div>
              <div className="abcde-body">
                <div className="abcde-label-row">
                  <strong>Estimated Diameter</strong>
                  <span className="abcde-score">{diameter.estimatedMm} mm</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (diameter.estimatedMm / 8) * 100)}%`,
                      background: diameter.exceeds6mm ? "#ef4444" : "#22c55e",
                    }}
                  />
                </div>
                <span className="abcde-rating">
                  {diameter.exceeds6mm ? "⚠️ Exceeds 6mm standard rule" : "Within normal limits"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video IVP Multi-Frame Filmstrip & Glare-Removal Card (If video was uploaded) */}
      {videoData && (
        <div className="video-ivp-panel">
          <div className="video-ivp-head">
            <div className="ivp-badge">
              <i className="fa-solid fa-film" /> Multi-Frame Video Processing (IVP)
            </div>
            <span className="ivp-sub">
              {videoData.framesAnalyzed} Keyframes Analyzed · {videoData.stabilityIndex}
            </span>
          </div>

          <div className="video-ivp-grid">
            {/* Keyframe Filmstrip */}
            <div className="filmstrip-wrap">
              <span className="strip-title">Extracted Sharp Keyframes (Laplacian Filter)</span>
              <div className="filmstrip">
                {videoData.keyframeFrames.map((kf, i) => (
                  <div key={i} className="keyframe-card">
                    <img src={kf.url} alt={`Frame at ${kf.time}s`} />
                    <div className="kf-meta">
                      <span>{kf.time}s</span>
                      <span>Sharpness: {kf.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Glare Removal Side-by-Side */}
            <div className="glare-compare">
              <div className="glare-item">
                <span className="glare-tag">Original Video Frame</span>
                <img src={videoData.bestKeyframeUrl} alt="Original with glare" />
                <span className="glare-stat">Flash &amp; Specular Glare Present</span>
              </div>
              <div className="glare-item result">
                <span className="glare-tag highlight">
                  <i className="fa-solid fa-sparkles" /> Synthetic Glare-Free Composite
                </span>
                <img src={videoData.glareFreeCompositeUrl} alt="Glare-free composite" />
                <span className="glare-stat success">
                  ✓ Inpainted via Temporal Blending ({videoData.glareReductionPercent}% reflection eliminated)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

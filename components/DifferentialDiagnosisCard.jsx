"use client";

export default function DifferentialDiagnosisCard({ ddxList = [] }) {
  if (!ddxList || ddxList.length === 0) return null;

  return (
    <div className="ddx-card anim" style={{ "--d": "0.15s" }}>
      <div className="ddx-head">
        <div className="diag-title-wrap">
          <span className="diag-pill" style={{ background: "rgba(168, 85, 247, 0.16)", color: "#d8b4fe" }}>
            <i className="fa-solid fa-list-check" /> Clinical Differential Engine
          </span>
          <h3 className="diag-title">Differential Diagnosis (DDx) &amp; Contraindications</h3>
        </div>
        <span className="ddx-tagline">
          Ranked by Multimodal Fusion (Symptoms + Location + CV ABCDE + Allergens)
        </span>
      </div>

      {/* Top Conditions Probability Bars */}
      <div className="ddx-list">
        {ddxList.map((item, index) => {
          const isTop = index === 0;
          return (
            <div
              key={item.id}
              className={`ddx-item ${isTop ? "is-primary" : ""}`}
            >
              <div className="ddx-item-header">
                <div className="ddx-name-group">
                  <span className="ddx-rank">#{index + 1}</span>
                  <strong>{item.name}</strong>
                  <span className="ddx-icd">{item.icd10}</span>
                </div>
                <div className="ddx-prob-group">
                  <span className="ddx-percent">{item.probability}% Probability</span>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="ddx-bar-track">
                <div
                  className="ddx-bar-fill"
                  style={{
                    width: `${item.probability}%`,
                    background:
                      index === 0
                        ? "linear-gradient(90deg, #7c6cff, #4fd1c5)"
                        : index === 1
                        ? "linear-gradient(90deg, #38bdf8, #818cf8)"
                        : "rgba(255, 255, 255, 0.25)",
                  }}
                />
              </div>

              <p className="ddx-presentation">
                <strong>Visual Hallmark:</strong> {item.typicalPresentation}
              </p>

              {/* Contraindications Warning Box (CRITICAL CLINICAL SAFETY FEATURE) */}
              {item.contraindications && item.contraindications.length > 0 && (
                <div className="ddx-contra-box">
                  <div className="contra-title">
                    <i className="fa-solid fa-ban" /> Critical Treatment Contraindications:
                  </div>
                  <ul className="contra-list">
                    {item.contraindications.map((c, ci) => (
                      <li key={ci}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

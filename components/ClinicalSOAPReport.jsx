"use client";

export default function ClinicalSOAPReport({
  isOpen,
  onClose,
  patientData,
  analysisData,
  videoData,
  guidanceText,
  bodyZone,
  ddxList = [],
  detectedAllergens = [],
}) {
  if (!isOpen || !analysisData) return null;

  const { fitzpatrick, metrics, layers } = analysisData;
  const { asymmetry, border, color, diameter, tdsScore, riskTier } = metrics;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="soap-modal-overlay" onClick={onClose}>
      <div className="soap-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Controls Bar (hidden during print) */}
        <div className="soap-modal-bar no-print">
          <div className="bar-info">
            <i className="fa-solid fa-file-waveform" />
            <span>Clinical SBAR / SOAP Consultation Summary</span>
          </div>
          <div className="bar-actions">
            <button type="button" className="soap-print-btn" onClick={handlePrint}>
              <i className="fa-solid fa-print" /> Print / Save as PDF
            </button>
            <button type="button" className="soap-close-btn" onClick={onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        {/* Printable Medical Document Paper */}
        <div className="soap-doc" id="printable-soap">
          {/* Clinic Header */}
          <div className="soap-header">
            <div className="soap-brand">
              <div className="soap-cross">✚</div>
              <div>
                <h2>AI Skin Specialist · Clinical Tele-Dermatology Triage</h2>
                <p>Computer Vision &amp; Multimodal Dermoscopic Assessment Record</p>
              </div>
            </div>
            <div className="soap-meta-right">
              <div><strong>Date:</strong> {currentDate}</div>
              <div><strong>Case ID:</strong> SKIN-{Date.now().toString().slice(-6)}</div>
              <div><strong>Triage Status:</strong> <span className="soap-tag">{riskTier}</span></div>
            </div>
          </div>

          <div className="soap-divider" />

          {/* Section S: Subjective */}
          <div className="soap-section">
            <div className="soap-sec-title">
              <span className="sec-letter">S</span>
              <h3>SUBJECTIVE (Patient Narrative &amp; Clinical History)</h3>
            </div>
            <div className="soap-sec-content">
              <p><strong>Chief Complaint &amp; Patient Description:</strong></p>
              <blockquote className="soap-quote">
                &ldquo;{patientData?.transcript || patientData?.text || "No voice transcript recorded."}&rdquo;
              </blockquote>
              <div className="soap-grid-2">
                <div><strong>Anatomical Site:</strong> {bodyZone?.label || "Forearm (Extensor surface)"}</div>
                <div><strong>Input Modality:</strong> {patientData?.inputMode === "voice" ? "Spoken Voice Audio (Transcribed via Whisper Large v3)" : "Direct Clinical Text Entry"}</div>
                <div><strong>Video Attached:</strong> {videoData ? `Yes (${videoData.framesAnalyzed} temporal keyframes processed)` : "No (Static dermoscopy photo only)"}</div>
                <div><strong>Contact Allergens Identified:</strong> {detectedAllergens.length > 0 ? detectedAllergens.map(a => a.name).join(", ") : "None reported / detected"}</div>
              </div>
            </div>
          </div>

          {/* Section O: Objective */}
          <div className="soap-section">
            <div className="soap-sec-title">
              <span className="sec-letter">O</span>
              <h3>OBJECTIVE (Computer Vision &amp; Dermoscopic Quantitative Metrics)</h3>
            </div>
            <div className="soap-sec-content">
              {/* Diagnostic Visuals Strip */}
              <div className="soap-images-row">
                <div className="soap-img-box">
                  <img src={layers.raw} alt="Raw macroscopic capture" />
                  <span>Macroscopic Raw</span>
                </div>
                <div className="soap-img-box">
                  <img src={layers.contour} alt="Lesion Segmentation Contour" />
                  <span>Boundary Contour</span>
                </div>
                <div className="soap-img-box">
                  <img src={layers.erythema} alt="CIE-Lab Erythema Heatmap" />
                  <span>Erythema (a*) Heatmap</span>
                </div>
                <div className="soap-img-box">
                  <img src={layers.melanin} alt="Melanin Concentration" />
                  <span>Melanin Density</span>
                </div>
              </div>

              {/* Quantitative Scorecard Table */}
              <table className="soap-table">
                <thead>
                  <tr>
                    <th>Clinical Parameter</th>
                    <th>Measured Quantitative Value</th>
                    <th>Reference Standard</th>
                    <th>Clinical Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Fitzpatrick Phototype</strong></td>
                    <td>{fitzpatrick.type} ({fitzpatrick.name})</td>
                    <td>ITA: {fitzpatrick.ita}°</td>
                    <td>{fitzpatrick.erythemaTone}</td>
                  </tr>
                  <tr>
                    <td><strong>A - Asymmetry Index</strong></td>
                    <td>{asymmetry.score}%</td>
                    <td>&lt; 20% Symmetric</td>
                    <td>{asymmetry.rating}</td>
                  </tr>
                  <tr>
                    <td><strong>B - Border Compactness</strong></td>
                    <td>Ratio: {border.compactness} (Score: {border.score}%)</td>
                    <td>Isoperimetric Q &gt; 0.6</td>
                    <td>{border.rating}</td>
                  </tr>
                  <tr>
                    <td><strong>C - Color Variegation</strong></td>
                    <td>{color.distinctCount} Distinct Clusters</td>
                    <td>&le; 2 Uniform</td>
                    <td>{color.rating}</td>
                  </tr>
                  <tr>
                    <td><strong>D - Maximum Feret Diameter</strong></td>
                    <td>{diameter.estimatedMm} mm ({diameter.pixels} px)</td>
                    <td>&lt; 6.0 mm benign threshold</td>
                    <td>{diameter.rating}</td>
                  </tr>
                  <tr className="soap-total-row">
                    <td><strong>Total Dermoscopy Score (TDS)</strong></td>
                    <td><strong>{tdsScore} / 8.90</strong></td>
                    <td>&lt; 4.75 Benign, &gt; 5.45 Suspicious</td>
                    <td><strong>{riskTier}</strong></td>
                  </tr>
                </tbody>
              </table>

              {videoData && (
                <div className="soap-video-note">
                  <strong>IVP Video Processing Note:</strong> Analyzed {videoData.framesAnalyzed} sequential video frames. Specular glare reflection was reduced by {videoData.glareReductionPercent}% using multi-frame temporal inpainting. Motion stability index: {videoData.stabilityIndex}.
                </div>
              )}
            </div>
          </div>

          {/* Section A: Assessment */}
          <div className="soap-section">
            <div className="soap-sec-title">
              <span className="sec-letter">A</span>
              <h3>ASSESSMENT (Differential Diagnosis &amp; AI Triage Guidance)</h3>
            </div>
            <div className="soap-sec-content">
              {/* DDx Ranked Table */}
              {ddxList.length > 0 && (
                <div className="soap-ddx-table-wrap">
                  <strong>Multimodal Differential Diagnosis (DDx):</strong>
                  <table className="soap-table" style={{ marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Condition Name</th>
                        <th>ICD-10</th>
                        <th>Probability</th>
                        <th>Key Visual Hallmark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ddxList.map((cond, idx) => (
                        <tr key={cond.id}>
                          <td>#{idx + 1}</td>
                          <td><strong>{cond.name}</strong></td>
                          <td>{cond.icd10}</td>
                          <td><strong>{cond.probability}%</strong></td>
                          <td>{cond.typicalPresentation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="soap-assessment-box" style={{ marginTop: 12 }}>
                {guidanceText || "Assessment pending analysis completion."}
              </div>
              <div className="soap-triage-tier">
                <strong>Recommended Urgency:</strong>{" "}
                {metrics.tdsScore > 5.45
                  ? "URGENT CLINICAL EVALUATION: Prompt in-person dermoscopy or biopsy recommended within 7–14 days."
                  : metrics.tdsScore > 4.75
                  ? "MONITOR & CONSULT: Schedule routine dermatologist evaluation. Document any rapid expansion."
                  : "ROUTINE CARE / AMBULATORY: Low suspicion of malignant morphology. Follow standard gentle skincare."}
              </div>
            </div>
          </div>

          {/* Section P: Plan */}
          <div className="soap-section">
            <div className="soap-sec-title">
              <span className="sec-letter">P</span>
              <h3>PLAN &amp; CLINICIAN CONSULTATION PREPARATION</h3>
            </div>
            <div className="soap-sec-content">
              <ul className="soap-plan-list">
                <li>
                  <strong>Questions to Ask Your Dermatologist:</strong>
                  <ul>
                    <li>Does this spot require dermoscopic magnification or a shave/punch biopsy?</li>
                    <li>Could this presentation be an allergic contact reaction or flare of eczema/psoriasis?</li>
                    <li>What is the recommended follow-up interval for monitoring this specific lesion?</li>
                  </ul>
                </li>
                <li>
                  <strong>Red-Flag Warning Signs (Seek Immediate Medical Care):</strong> Rapid asymmetric enlargement, spontaneous bleeding, ulceration without trauma, sudden severe pain or spreading warmth.
                </li>
                <li>
                  <strong>Photoprotection &amp; Care:</strong> Apply broad-spectrum SPF 30+ mineral sunscreen. Avoid picking, scratching, or applying harsh steroid creams without physician prescription.
                </li>
              </ul>
            </div>
          </div>

          {/* Disclaimer Footer */}
          <div className="soap-footer">
            <p>
              <strong>LEGAL &amp; MEDICAL DISCLAIMER:</strong> This report is generated by an algorithmic image processing and multimodal artificial intelligence tool for educational and informational triage purposes only. It does not constitute a definitive medical diagnosis or medical advice. Diagnosis must be confirmed by a licensed clinician or board-certified dermatologist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

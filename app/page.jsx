import Hero from "@/components/Hero";
import Consult from "@/components/Consult";

const STEPS = [
  {
    n: "01",
    title: "Clinical Voice Description",
    body: "Speak or type your symptoms. Audio is transcribed and contextualized alongside visual and demographic data.",
  },
  {
    n: "02",
    title: "Computer Vision & Glare Removal",
    body: "Upload photos or video clips. Our multi-frame algorithm eliminates specular glare reflections and segments lesion boundaries.",
  },
  {
    n: "03",
    title: "Quantitative ABCDE & Heatmaps",
    body: "Inspect multi-layer CIE L*a*b* erythema heatmaps, melanin density, and objective mathematical ABCDE melanoma scores.",
  },
  {
    n: "04",
    title: "Temporal Skin Diary & SOAP Export",
    body: "Track 30-day lesion evolution with delta difference heatmaps and generate printable clinical SOAP referral documents.",
  },
];

export default function Home() {
  return (
    <>
      <div className="bg" aria-hidden="true">
        <video className="bg-video" autoPlay muted loop playsInline>
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4"
            type="video/mp4"
          />
        </video>
        <div className="bg-veil" />
        <div className="bg-orb o1" />
        <div className="bg-orb o2" />
      </div>

      <div className="page">
        <Hero />

        <section className="section" id="how">
          <div className="section-head anim" style={{ "--d": "0.05s" }}>
            <span className="eyebrow">
              <i className="fa-solid fa-bolt" /> How it works
            </span>
            <h2 className="section-title">Three steps. One pass.</h2>
            <p className="section-sub">
              Voice + vision + speech out — a single pipeline built for clear,
              calm skin guidance when you need a second look.
            </p>
          </div>

          <div className="steps">
            {STEPS.map((s, i) => (
              <article
                key={s.n}
                className="step anim"
                style={{ "--d": `${0.1 + i * 0.1}s` }}
              >
                <div className="step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        <Consult />

        <footer className="footer" id="footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="fb-logo">
                <img src="/logo.webp" alt="" width="32" height="32" />
              </span>
              <div>
                AI Skin Specialist
                <div className="footer-meta" style={{ fontWeight: 400, marginTop: 4 }}>
                  For informational purposes only. AI guidance is not a medical
                  diagnosis. Consult a licensed dermatologist for urgent symptoms.
                </div>
              </div>
            </div>
            <div className="footer-links">
              <a href="#home">Home</a>
              <a href="#how">Product</a>
              <a href="#consult">Consult</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function Stats() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 720) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="header">
        <a className="logo" href="#home" aria-label="AI Skin Specialist home">
          <img src="/logo.webp" alt="" width="52" height="52" />
        </a>

        <nav className="nav-pill" aria-label="Primary">
          <a className="nav-link active" href="#home">
            Home
          </a>
          <a className="nav-link" href="#how">
            Product
          </a>
          <a className="nav-link" href="#consult">
            Consult
          </a>
          <a className="nav-link" href="#footer">
            Contact
          </a>
        </nav>

        <a className="sign-in" href="#consult">
          Get Started
        </a>

        <button
          ref={burgerRef}
          className="burger"
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </header>

      <div
        ref={overlayRef}
        className="menu-overlay"
        hidden={!open}
        onClick={(e) => {
          if (e.target === overlayRef.current) close();
        }}
      >
        <div className="menu-sheet" id="mobile-menu" role="dialog" aria-label="Menu">
          <a className="menu-link active" href="#home" style={{ "--d": "0.06s" }} onClick={close}>
            Home
          </a>
          <a className="menu-link" href="#how" style={{ "--d": "0.12s" }} onClick={close}>
            Product
          </a>
          <a className="menu-link" href="#consult" style={{ "--d": "0.18s" }} onClick={close}>
            Consult
          </a>
          <a className="menu-link" href="#footer" style={{ "--d": "0.24s" }} onClick={close}>
            Contact
          </a>
          <a
            className="menu-link menu-sign-in"
            href="#consult"
            style={{ "--d": "0.3s" }}
            onClick={close}
          >
            Get Started
          </a>
        </div>
      </div>

      <main className="hero" id="home">
        <h1 className="headline anim">
          <span className="headline-line line1">Intelligence</span>
          <span className="headline-line line2">for Skin Health</span>
        </h1>

        <p className="subhead anim" style={{ "--d": "0.28s" }}>
          Describe your concern by voice, upload a skin image or video, and get
          AI-powered doctor-style guidance with audio — in one consultation.
        </p>

        <div className="hero-actions">
          <a className="cta" href="#consult" style={{ "--d": "0.4s" }}>
            Get Started
            <i className="fa-solid fa-arrow-right" />
          </a>
          <a className="cta-ghost" href="#how" style={{ "--d": "0.5s" }}>
            How it works
          </a>
        </div>
      </main>
    </>
  );
}

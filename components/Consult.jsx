"use client";

import { useCallback, useEffect, useRef, useState } from "react";

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function shrinkImage(file, max = 1024) {
  const dataUrl = await fileToDataUrl(file);
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function Consult() {
  const [inputMode, setInputMode] = useState("text");
  const [plainText, setPlainText] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [audioName, setAudioName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoName, setVideoName] = useState("");
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ kind: "", text: "" });
  const [result, setResult] = useState(null);
  const [audioError, setAudioError] = useState(false);
  const [dragKind, setDragKind] = useState("");
  const [thread, setThread] = useState([]);
  const [followText, setFollowText] = useState("");
  const [followMode, setFollowMode] = useState("text");
  const [followAudio, setFollowAudio] = useState(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followRec, setFollowRec] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState(null);
  const threadEndRef = useRef(null);
  const followRecRef = useRef(null);
  const followRecTimer = useRef(null);

  const recTimer = useRef(null);
  const recStart = useRef(0);

  const setStatusLine = (kind, text) => setStatus({ kind, text });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const localChunks = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(localChunks, { type: mr.mimeType || "audio/webm" });
        const ext = (mr.mimeType || "").includes("mp4")
          ? "m4a"
          : (mr.mimeType || "").includes("ogg")
            ? "ogg"
            : "webm";
        const file = new File([blob], `consultation.${ext}`, {
          type: blob.type || "audio/webm",
        });
        setAudioFile(file);
        setAudioName(`Recorded · ${file.name}`);
        setAudioError(false);
        setStatusLine("ok", "Recording ready");
        setChunks(localChunks);
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
      recStart.current = Date.now();
      setStatusLine("", "Recording… speak clearly");
      recTimer.current = setTimeout(() => {
        if (mr.state !== "inactive") mr.stop();
      }, 60000);
    } catch (err) {
      setStatusLine("err", "Microphone unavailable — upload an audio file instead");
      setAudioError(true);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    setRecording(false);
    if (recTimer.current) clearTimeout(recTimer.current);
    const secs = Math.max(1, Math.round((Date.now() - recStart.current) / 1000));
    setStatusLine("", `Recorded ${secs}s`);
  }, [mediaRecorder]);

  useEffect(() => {
    return () => {
      if (recTimer.current) clearTimeout(recTimer.current);
      if (followRecTimer.current) clearTimeout(followRecTimer.current);
    };
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [thread, followBusy]);

  const onImage = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatusLine("err", "Please choose an image file");
      return;
    }
    try {
      const shrunk = await shrinkImage(file);
      setImageFile(file);
      setImagePreview(shrunk);
      setStatusLine("ok", "Skin image ready");
    } catch {
      setStatusLine("err", "Could not read that image");
    }
  };

  const onVideo = (file) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setStatusLine("err", "Please choose a video file");
      return;
    }
    setVideoFile(file);
    setVideoName(file.name);
    setStatusLine("ok", "Video attached");
  };

  const onAudioUpload = (file) => {
    if (!file) return;
    if (file.type && !file.type.startsWith("audio/")) {
      setStatusLine("err", "Please drop an audio file here");
      return;
    }
    setAudioFile(file);
    setAudioName(file.name);
    setAudioError(false);
    setStatusLine("ok", "Audio ready");
  };

  const routeDroppedFile = async (file) => {
    if (!file) return;
    const type = file.type || "";
    if (type.startsWith("image/")) {
      await onImage(file);
    } else if (type.startsWith("video/")) {
      onVideo(file);
    } else if (type.startsWith("audio/")) {
      onAudioUpload(file);
    } else if (/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) {
      await onImage(file);
    } else if (/\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name)) {
      onVideo(file);
    } else if (/\.(mp3|wav|m4a|ogg|webm|aac|flac)$/i.test(file.name)) {
      onAudioUpload(file);
    } else {
      setStatusLine("err", "Drop an image, video, or audio file");
    }
  };

  const zoneDragProps = (kind) => ({
    onDragEnter: (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragKind(kind);
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      setDragKind(kind);
    },
    onDragLeave: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.currentTarget.contains(e.relatedTarget)) {
        setDragKind((k) => (k === kind ? "" : k));
      }
    },
    onDrop: async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragKind("");
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      if (kind === "image") {
        await onImage(files[0]);
      } else if (kind === "video") {
        onVideo(files[0]);
      } else if (kind === "audio") {
        onAudioUpload(files[0]);
      } else {
        for (const f of files) {
          await routeDroppedFile(f);
        }
      }
    },
  });

  const buildHistory = () =>
    thread.map((m) => ({ role: m.role, content: m.content }));

  const sendConsult = async ({ useText, textVal, audio, audioNameVal, isFollowUp }) => {
    const payload = {
      inputMode: useText ? "text" : "voice",
      text: useText ? textVal : null,
      image: imagePreview || null,
      hasVideo: !!videoFile,
      history: isFollowUp ? buildHistory() : [],
      followUp: !!isFollowUp,
    };

    if (!useText && audio) {
      payload.audio = typeof audio === "string" ? audio : await fileToDataUrl(audio);
      payload.audioName = audioNameVal || (audio?.name || "followup.webm");
    }

    const res = await fetch("/api/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  };

  const analyze = async () => {
    const useText = inputMode === "text";
    const trimmed = plainText.trim();

    if (useText && !trimmed) {
      setStatusLine("err", "Please describe your skin concern in the text box");
      return;
    }
    if (!useText && !audioFile) {
      setStatusLine("err", "Record or upload your voice description first");
      return;
    }
    if (!imageFile && !videoFile) {
      setStatusLine("err", "Upload a skin image (or video) before analysis");
      return;
    }

    setBusy(true);
    setResult(null);
    setThread([]);
    setActiveAudioId(null);
    setStatusLine(
      "",
      useText
        ? "Analyzing and generating audio…"
        : "Transcribing, analyzing, and generating audio…"
    );

    try {
      const data = await sendConsult({
        useText,
        textVal: trimmed,
        audio: useText ? null : audioFile,
        audioNameVal: useText ? null : audioFile.name,
        isFollowUp: false,
      });

      setResult(data);
      setThread([
        {
          id: `u-${Date.now()}`,
          role: "user",
          content: data.transcript,
          kind: useText ? "text" : "voice",
        },
        {
          id: `a-${Date.now() + 1}`,
          role: "assistant",
          content: data.guidance,
          audio: data.audio || null,
        },
      ]);
      setStatusLine("ok", "Consultation complete — ask a follow-up below");
    } catch (err) {
      setStatusLine("err", err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const sendFollowUp = async () => {
    if (followBusy) return;
    const useText = followMode === "text";
    const trimmed = followText.trim();

    if (useText && !trimmed) {
      setStatusLine("err", "Type a follow-up question first");
      return;
    }
    if (!useText && !followAudio) {
      setStatusLine("err", "Record a voice follow-up first");
      return;
    }

    setFollowBusy(true);
    setStatusLine("", useText ? "Thinking…" : "Transcribing and thinking…");

    try {
      const data = await sendConsult({
        useText,
        textVal: trimmed,
        audio: useText ? null : followAudio,
        audioNameVal: useText ? null : followAudio.name,
        isFollowUp: true,
      });

      setThread((prev) => [
        ...prev,
        {
          id: `u-${Date.now()}`,
          role: "user",
          content: data.transcript,
          kind: useText ? "text" : "voice",
        },
        {
          id: `a-${Date.now() + 1}`,
          role: "assistant",
          content: data.guidance,
          audio: data.audio || null,
        },
      ]);
      setFollowText("");
      setFollowAudio(null);
      setStatusLine("ok", "Reply ready");
    } catch (err) {
      setStatusLine("err", err.message || "Follow-up failed");
    } finally {
      setFollowBusy(false);
    }
  };

  const startFollowRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const localChunks = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(localChunks, { type: mr.mimeType || "audio/webm" });
        const ext = (mr.mimeType || "").includes("mp4")
          ? "m4a"
          : (mr.mimeType || "").includes("ogg")
            ? "ogg"
            : "webm";
        const file = new File([blob], `followup.${ext}`, {
          type: blob.type || "audio/webm",
        });
        setFollowAudio(file);
        setStatusLine("ok", "Voice follow-up ready — press Send");
      };
      mr.start();
      followRecRef.current = mr;
      setFollowRec(true);
      setStatusLine("", "Recording follow-up…");
      followRecTimer.current = setTimeout(() => {
        if (mr.state !== "inactive") mr.stop();
      }, 60000);
    } catch {
      setStatusLine("err", "Microphone unavailable");
      setFollowRec(false);
    }
  };

  const stopFollowRec = () => {
    const mr = followRecRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setFollowRec(false);
    if (followRecTimer.current) clearTimeout(followRecTimer.current);
  };

  const hasInput = inputMode === "text" ? plainText.trim().length > 0 : !!audioFile;
  const canSubmit = hasInput && (imageFile || videoFile);
  const canFollow =
    !followBusy &&
    (followMode === "text"
      ? followText.trim().length > 0
      : !!followAudio && !followRec);

  return (
    <section className="section" id="consult">
      <div className="section-head anim" style={{ "--d": "0.05s" }}>
        <span className="eyebrow">
          <i className="fa-solid fa-stethoscope" /> Live consultation
        </span>
        <h2 className="section-title">Start your skin check</h2>
        <p className="section-sub">
          Type your concern or describe it by voice, add a clear photo (and
          optional clip), then analyze — guidance and spoken response in one pass.
        </p>
      </div>

      <div className="consult anim" style={{ "--d": "0.15s" }}>
        <div
          className={`consult-grid ${dragKind ? "is-dragging" : ""}`}
          {...zoneDragProps("panel")}
        >
          {/* Input panel */}
          <div className="panel">
            <div className="panel-title">
              <span className="i">
                <i className="fa-solid fa-pen-to-square" />
              </span>
              Patient input
            </div>

            <div className="mode-toggle" role="tablist" aria-label="Input method">
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === "text"}
                className={`mode-btn ${inputMode === "text" ? "active" : ""}`}
                onClick={() => {
                  setInputMode("text");
                  setStatusLine("", "");
                }}
              >
                <i className="fa-solid fa-keyboard" /> Text
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={inputMode === "voice"}
                className={`mode-btn ${inputMode === "voice" ? "active" : ""}`}
                onClick={() => {
                  setInputMode("voice");
                  setStatusLine("", "");
                }}
              >
                <i className="fa-solid fa-microphone" /> Voice
              </button>
            </div>

            {inputMode === "text" ? (
              <>
                <span className="field-label">Describe your concern</span>
                <textarea
                  className="concern-textarea"
                  rows={5}
                  placeholder="e.g. Itchy red patch on my left forearm for about three weeks. It occasionally itches and seems to be spreading slowly…"
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  maxLength={2000}
                />
                <div className="text-meta">
                  <span>{plainText.trim().length}/2000</span>
                  <span>Plain text · no diagnosis required</span>
                </div>
              </>
            ) : (
              <>
                <span className="field-label">Voice description</span>
                <div
                  className={`dropzone ${audioFile ? "has-file" : ""} ${
                    audioError ? "has-file" : ""
                  } ${dragKind === "audio" ? "dragover" : ""}`}
                  {...zoneDragProps("audio")}
                >
                  <span className="dz-icon">
                    <i className="fa-solid fa-microphone" />
                  </span>
                  <span className="dz-main">
                    {audioName || "Drop audio here or click to upload"}
                  </span>
                  <span className="dz-sub">
                    MP3, WAV, M4A, WebM · or record below
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => onAudioUpload(e.target.files?.[0])}
                    aria-label="Upload voice description"
                  />
                </div>

                <div className="rec-row">
                  {!recording ? (
                    <button type="button" className="rec-btn" onClick={startRecording}>
                      <i
                        className="fa-solid fa-circle"
                        style={{ color: "#ef4444", fontSize: 10 }}
                      />
                      Record
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rec-btn recording"
                      onClick={stopRecording}
                    >
                      <span className="rec-dot" />
                      Stop
                    </button>
                  )}
                  {recording && (
                    <span className="wave" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                  )}
                  {audioFile && !recording && (
                    <audio
                      controls
                      src={URL.createObjectURL(audioFile)}
                      style={{ height: 36, maxWidth: 200 }}
                    />
                  )}
                </div>
              </>
            )}

            <div className="media-row">
              <div>
                <span className="field-label">Skin image</span>
                <label
                  className={`dropzone ${imageFile ? "has-file" : ""} ${
                    dragKind === "image" ? "dragover" : ""
                  }`}
                  {...zoneDragProps("image")}
                  style={{ minHeight: 130 }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Skin preview" className="image-preview" />
                  ) : (
                    <>
                      <span className="dz-icon">
                        <i className="fa-solid fa-camera" />
                      </span>
                      <span className="dz-main">Photo of the area</span>
                      <span className="dz-sub">JPG / PNG · drag &amp; drop</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onImage(e.target.files?.[0])}
                    aria-label="Upload skin image"
                  />
                </label>
              </div>

              <div>
                <span className="field-label">Video (optional)</span>
                <label
                  className={`dropzone ${videoFile ? "has-file" : ""} ${
                    dragKind === "video" ? "dragover" : ""
                  }`}
                  {...zoneDragProps("video")}
                  style={{ minHeight: 130 }}
                >
                  <span className="dz-icon">
                    <i className="fa-solid fa-video" />
                  </span>
                  <span className="dz-main">
                    {videoName || "Short clip of texture"}
                  </span>
                  <span className="dz-sub">MP4 / WebM · drag &amp; drop</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => onVideo(e.target.files?.[0])}
                    aria-label="Upload skin video"
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              className="analyze-btn"
              onClick={analyze}
              disabled={busy || !canSubmit}
            >
              {busy ? (
                <>
                  <span className="spin" /> Analyzing…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles" /> Analyze Concern
                </>
              )}
            </button>

            <p className={`status-line ${status.kind}`}>{status.text}</p>

            <div className="disclaimer">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>
                Informational only — not a medical diagnosis. Consult a licensed
                dermatologist for urgent or serious symptoms.
              </span>
            </div>
          </div>

          {/* Result panel */}
          <div className="panel">
            <div className="panel-title">
              <span className="i" style={{ background: "rgba(79,209,197,0.16)", color: "#99f6e4" }}>
                <i className="fa-solid fa-robot" />
              </span>
              Doctor response
            </div>

            {!result ? (
              <div className="empty-result">
                <div className="er-icon">
                  <i className="fa-regular fa-clock" />
                </div>
                <strong>Ready for analysis</strong>
                <p>
                  Your transcript, AI guidance, and voice response will appear
                  here after you run a consultation. You can then keep chatting
                  with follow-up questions.
                </p>
              </div>
            ) : (
              <>
                <div className="result-block">
                  <div className="result-label">
                    {result.inputMode === "voice" || !result.inputMode
                      ? "Your speech transcript"
                      : "Your description"}
                  </div>
                  <div className="result-box transcript">{result.transcript}</div>
                </div>

                <div className="thread" aria-live="polite">
                  {thread.map((m) =>
                    m.role === "user" ? (
                      <div key={m.id} className="msg user">
                        <div className="msg-meta">
                          <i
                            className={
                              m.kind === "voice"
                                ? "fa-solid fa-microphone"
                                : "fa-solid fa-user"
                            }
                          />
                          You
                        </div>
                        <div className="msg-bubble">{m.content}</div>
                      </div>
                    ) : (
                      <div key={m.id} className="msg assistant">
                        <div className="msg-meta">
                          <i className="fa-solid fa-robot" />
                          Doctor
                        </div>
                        <div className="msg-bubble">{m.content}</div>
                        {m.audio && (
                          <div
                            className={`audio-player compact ${
                              activeAudioId === m.id ? "is-playing" : ""
                            }`}
                          >
                            <div className="voice-wave" aria-hidden="true">
                              <span className="bar" />
                              <span className="bar" />
                              <span className="bar" />
                              <span className="bar" />
                              <span className="bar" />
                            </div>
                            <audio
                              controls
                              autoPlay={m.id === thread[thread.length - 1]?.id && m.role === "assistant"}
                              src={m.audio}
                              onPlay={() => setActiveAudioId(m.id)}
                              onPause={() =>
                                setActiveAudioId((id) => (id === m.id ? null : id))
                              }
                              onEnded={() =>
                                setActiveAudioId((id) => (id === m.id ? null : id))
                              }
                            />
                          </div>
                        )}
                      </div>
                    )
                  )}
                  <div ref={threadEndRef} />
                </div>

                <div className="followup">
                  <div className="result-label">Ask a follow-up</div>
                  <div className="mode-toggle follow-mode" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={followMode === "text"}
                      className={`mode-btn ${followMode === "text" ? "active" : ""}`}
                      onClick={() => {
                        setFollowMode("text");
                        setFollowAudio(null);
                      }}
                    >
                      <i className="fa-solid fa-keyboard" /> Text
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={followMode === "voice"}
                      className={`mode-btn ${followMode === "voice" ? "active" : ""}`}
                      onClick={() => setFollowMode("voice")}
                    >
                      <i className="fa-solid fa-microphone" /> Voice
                    </button>
                  </div>

                  {followMode === "text" ? (
                    <textarea
                      className="concern-textarea follow-textarea"
                      rows={3}
                      placeholder="e.g. How long until this clears up? Any lotion you recommend?"
                      value={followText}
                      onChange={(e) => setFollowText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (canFollow) sendFollowUp();
                        }
                      }}
                      maxLength={1500}
                      disabled={followBusy}
                    />
                  ) : (
                    <div className="follow-voice">
                      {!followRec ? (
                        <button
                          type="button"
                          className="rec-btn"
                          onClick={startFollowRec}
                          disabled={followBusy}
                        >
                          <i
                            className="fa-solid fa-circle"
                            style={{ color: "#ef4444", fontSize: 10 }}
                          />
                          Record follow-up
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rec-btn recording"
                          onClick={stopFollowRec}
                        >
                          <span className="rec-dot" />
                          Stop
                        </button>
                      )}
                      {followRec && (
                        <span className="wave" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                          <span />
                        </span>
                      )}
                      {followAudio && !followRec && (
                        <audio
                          controls
                          src={URL.createObjectURL(followAudio)}
                          style={{ height: 36, maxWidth: 200 }}
                        />
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    className="analyze-btn follow-send"
                    onClick={sendFollowUp}
                    disabled={!canFollow}
                  >
                    {followBusy ? (
                      <>
                        <span className="spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane" /> Send follow-up
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

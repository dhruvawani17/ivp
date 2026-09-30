import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const header = dataUrl.slice(5, comma); // after "data:"
  const payload = dataUrl.slice(comma + 1);
  const isBase64 = /;base64$/i.test(header) || /;base64$/i.test(header.split(";")[0]);
  // header can be "audio/webm;codecs=opus;base64"
  const base64Index = header.toLowerCase().lastIndexOf(";base64");
  const mime = (
    base64Index >= 0 ? header.slice(0, base64Index) : header
  ).split(";")[0].trim() || "application/octet-stream";

  if (base64Index >= 0 || /;base64/i.test(header)) {
    const cleaned = payload.replace(/\s/g, "");
    if (!cleaned) return null;
    try {
      return { mime, buffer: Buffer.from(cleaned, "base64") };
    } catch {
      return null;
    }
  }

  if (isBase64) return null;
  // non-base64 data URL (rare)
  try {
    return { mime, buffer: Buffer.from(decodeURIComponent(payload), "utf8") };
  } catch {
    return null;
  }
}

async function transcribeAudio({ audio, audioName, groqKey }) {
  const parsed = parseDataUrl(audio);
  if (!parsed) throw new Error("Invalid audio payload");

  const extFromMime = {
    "audio/webm": "webm",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/ogg": "ogg",
  };
  const ext = extFromMime[parsed.mime] || "webm";
  const filename = (audioName || `consult.${ext}`).replace(/[^\w.\-]+/g, "_");

  const form = new FormData();
  form.append(
    "file",
    new Blob([parsed.buffer], { type: parsed.mime }),
    filename
  );
  form.append("model", process.env.WHISPER_MODEL || "whisper-large-v3");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Transcription failed: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.text || "").trim();
}

async function analyzeImage({
  image,
  transcript,
  hasVideo,
  cvMetrics,
  videoInfo,
  bodyZone,
  ddxList,
  detectedAllergens,
  groqKey,
  history = [],
}) {
  const system =
    "You are an expert clinical dermatologist. Give high-precision medical guidance, not a final legal diagnosis. " +
    "Speak with the reassurance, clarity, and authority of a licensed skin specialist. " +
    "Limit your response to two or three sentences maximum. " +
    "You have access to quantitative computer vision measurements: Fitzpatrick phototype, ABCDE metrics, anatomical site, top differential diagnosis probabilities, and detected product allergens. " +
    "Integrate these quantitative findings and any critical contraindications into your guidance naturally where appropriate. " +
    "Do not use any special characters, symbols, asterisks, or markdown formatting in your response because it will be converted directly to audio. " +
    "Continue the conversation naturally when the patient asks follow-up questions.";

  const prior = (Array.isArray(history) ? history : [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-16)
    .map((m) => ({ role: m.role, content: m.content.trim() }));

  const cvSummary = cvMetrics
    ? [
        `Quantitative Dermoscopy Data:`,
        `- Fitzpatrick Skin Phototype: ${cvMetrics.fitzpatrick?.type || "Unknown"} (${cvMetrics.fitzpatrick?.name || ""}), ITA: ${cvMetrics.fitzpatrick?.ita || 0}°`,
        `- Asymmetry Score: ${cvMetrics.asymmetry?.score || 0}% (${cvMetrics.asymmetry?.rating || ""})`,
        `- Border Compactness: ${cvMetrics.border?.compactness || "N/A"} (${cvMetrics.border?.rating || ""})`,
        `- Color Variegation: ${cvMetrics.color?.distinctCount || 1} distinct pigment clusters (${cvMetrics.color?.rating || ""})`,
        `- Estimated Lesion Diameter: ${cvMetrics.diameter?.estimatedMm || "N/A"} mm (${cvMetrics.diameter?.rating || ""})`,
        `- Total Dermoscopy Score (TDS): ${cvMetrics.tdsScore || "N/A"} (${cvMetrics.riskTier || ""})`,
      ].join("\n")
    : "";

  const locationSummary = bodyZone
    ? `Anatomical Location: ${bodyZone.label || bodyZone.id} (${bodyZone.region || ""}).`
    : "";

  const allergenSummary =
    Array.isArray(detectedAllergens) && detectedAllergens.length > 0
      ? `Contact Allergens Detected in Patient Skincare/Household Items: ${detectedAllergens.map((a) => a.name).join(", ")}.`
      : "";

  const ddxSummary =
    Array.isArray(ddxList) && ddxList.length > 0
      ? `Differential Probabilities: ${ddxList.map((d) => `${d.name} (${d.probability}%)`).join(", ")}. Primary Warning: ${ddxList[0]?.contraindications?.[0] || ""}`
      : "";

  const videoSummary = videoInfo
    ? `Video temporal analysis: ${videoInfo.framesAnalyzed || 8} keyframes extracted with ${videoInfo.glareReductionPercent || 20}% specular glare reduction.`
    : hasVideo
    ? "Patient uploaded video with multi-angle temporal surface capture."
    : "";

  const followUp = prior.length > 0;
  const userText = followUp
    ? transcript
    : [
        "You are an expert clinical dermatologist. Speak with reassurance, clarity, and authority.",
        "Limit your entire response to two or three sentences maximum.",
        "Do not use any special characters, symbols, asterisks, or markdown formatting in your response because it will be converted directly to audio.",
        "",
        `Patient text: ${transcript || "(no speech transcription available)"}`,
        locationSummary,
        allergenSummary,
        cvSummary,
        ddxSummary,
        videoSummary,
      ]
        .filter(Boolean)
        .join("\n");

  const userContent = [{ type: "text", text: userText }];
  if (image) {
    userContent.push({ type: "image_url", image_url: { url: image } });
  }

  const messages = [
    { role: "system", content: system },
    ...prior,
    { role: "user", content: userContent },
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      max_completion_tokens: 1000,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Analysis failed: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}

async function textToSpeech({ text, deepgramKey }) {
  const model = process.env.DEEPGRAM_TTS_MODEL || "aura-2-thalia-en";
  const res = await fetch(
    `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(model)}&encoding=mp3`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${deepgramKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`TTS failed: ${err.slice(0, 300)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return `data:audio/mpeg;base64,${buf.toString("base64")}`;
}

export async function POST(request) {
  const groqKey = process.env.GROQ_API_KEY;
  const deepgramKey = process.env.DEEPGRAM_API_KEY;

  if (!groqKey) {
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY environment variable" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    audio,
    audioName,
    image,
    hasVideo,
    text,
    inputMode,
    history,
    followUp,
    cvMetrics,
    videoInfo,
    bodyZone,
    ddxList,
    detectedAllergens,
  } = body || {};
  const plainText = typeof text === "string" ? text.trim() : "";
  const isFollowUp = followUp === true || (Array.isArray(history) && history.length > 0);

  if (inputMode === "text" || (!audio && plainText)) {
    if (!plainText) {
      return NextResponse.json(
        { error: "Please describe your skin concern in the text box." },
        { status: 400 }
      );
    }
  } else if (!audio) {
    return NextResponse.json(
      { error: "Please record/upload audio or switch to text input." },
      { status: 400 }
    );
  }

  if (!image && !isFollowUp) {
    return NextResponse.json(
      { error: "Please upload a skin image before analysis." },
      { status: 400 }
    );
  }

  try {
    let transcript = plainText;
    if (!transcript) {
      transcript = await transcribeAudio({ audio, audioName, groqKey });
    }

    const guidance = await analyzeImage({
      image: image || null,
      transcript,
      hasVideo: !!hasVideo,
      cvMetrics: cvMetrics || null,
      videoInfo: videoInfo || null,
      bodyZone: bodyZone || null,
      ddxList: ddxList || null,
      detectedAllergens: detectedAllergens || null,
      groqKey,
      history: isFollowUp ? history : [],
    });

    let tts = null;
    if (deepgramKey && guidance) {
      try {
        tts = await textToSpeech({ text: guidance, deepgramKey });
      } catch {
        tts = null;
      }
    }

    return NextResponse.json({
      transcript: transcript || "(empty transcription)",
      guidance,
      audio: tts,
      inputMode: inputMode || (plainText ? "text" : "voice"),
      followUp: isFollowUp,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Consultation failed" },
      { status: 500 }
    );
  }
}

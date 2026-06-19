import { buildGeminiRequest, parseGeminiResponse } from "./gemini.js";
import { buildInatUrl, parseInatResponse } from "./inat.js";

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(body, status, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cheamă Gemini cu retry pe erori tranzitorii (429/500/503) și fallback pe alt model.
// Gemini 3 preview dă des 503 (overload); reîncercăm și apoi cădem pe un model stabil.
async function callGemini(payload, env) {
  const primary = env.GEMINI_MODEL || "gemini-2.5-flash";
  const fallback = env.GEMINI_FALLBACK_MODEL || "gemini-2.0-flash";
  const models = [...new Set([primary, fallback])];
  const gReq = buildGeminiRequest(payload.image, payload.mimeType);

  let lastStatus = 0;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gReq),
      });
      if (resp.ok) return parseGeminiResponse(await resp.json());

      lastStatus = resp.status;
      // 429/500/503 = tranzitoriu -> mai încercăm; altceva -> trecem la următorul model
      if (resp.status === 429 || resp.status === 500 || resp.status === 503) {
        await sleep(400 * (attempt + 1)); // 400ms, 800ms, 1200ms
        continue;
      }
      break; // 4xx "real" pe modelul curent -> încearcă fallback-ul
    }
  }
  throw new Error("Gemini indisponibil (" + lastStatus + ")");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }
    if (request.method !== "POST") {
      return json({ error: "Folosește POST" }, 405, env);
    }

    let payload;
    try {
      payload = await request.json(); // { image: base64, mimeType: "image/jpeg" }
    } catch {
      return json({ error: "JSON invalid" }, 400, env);
    }
    if (!payload.image || !payload.mimeType) {
      return json({ error: "Lipsește image/mimeType" }, 400, env);
    }

    // 1) Gemini (cu retry + fallback)
    let result;
    try {
      result = await callGemini(payload, env);
    } catch (e) {
      return json({ error: "Identificare eșuată: " + e.message }, 502, env);
    }

    // 2) iNaturalist (best-effort, nu blochează rezultatul)
    let photos = [];
    if (result.is_bug && result.scientific_name) {
      try {
        const iResp = await fetch(buildInatUrl(result.scientific_name), {
          headers: { "User-Agent": "bugid-pwa" },
        });
        if (iResp.ok) photos = parseInatResponse(await iResp.json());
      } catch { /* ignoră, mergem fără poze */ }
    }

    return json({ ...result, reference_photos: photos }, 200, env);
  },
};

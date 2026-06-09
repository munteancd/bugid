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

    // 1) Gemini
    let result;
    try {
      const geminiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
      const gReq = buildGeminiRequest(payload.image, payload.mimeType);
      const gResp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gReq),
      });
      if (!gResp.ok) {
        return json({ error: "Eroare Gemini", status: gResp.status }, 502, env);
      }
      result = parseGeminiResponse(await gResp.json());
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

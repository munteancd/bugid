import { describe, it, expect } from "vitest";
import { buildGeminiRequest, parseGeminiResponse } from "../worker/src/gemini.js";

describe("buildGeminiRequest", () => {
  it("pune imaginea base64 și promptul în structura Gemini", () => {
    const req = buildGeminiRequest("BASE64DATA", "image/jpeg");
    const parts = req.contents[0].parts;
    expect(parts.some(p => p.inline_data?.data === "BASE64DATA")).toBe(true);
    expect(parts.some(p => typeof p.text === "string" && p.text.length > 0)).toBe(true);
    expect(req.generationConfig.responseMimeType).toBe("application/json");
  });
});

describe("parseGeminiResponse", () => {
  it("extrage JSON-ul din răspunsul Gemini", () => {
    const apiResp = {
      candidates: [{ content: { parts: [{ text: '{"is_bug":true,"common_name_ro":"Albină"}' }] } }],
    };
    const out = parseGeminiResponse(apiResp);
    expect(out.is_bug).toBe(true);
    expect(out.common_name_ro).toBe("Albină");
  });

  it("aruncă eroare clară dacă nu există candidat", () => {
    expect(() => parseGeminiResponse({ candidates: [] })).toThrow(/raspuns gol/i);
  });
});

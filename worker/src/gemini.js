const PROMPT = `Ești un expert entomolog. Analizează imaginea și răspunde DOAR cu JSON valid
(fără markdown) cu această structură exactă:
{
  "is_bug": boolean,
  "confidence": "low"|"medium"|"high",
  "common_name_ro": string,
  "scientific_name": string,
  "safety": {
    "level": "green"|"yellow"|"red",
    "summary_ro": string,
    "venomous": boolean,
    "bites": boolean
  },
  "habitat_ro": string,
  "appearance_ro": string,
  "behavior_ro": string,
  "confusion_ro": string
}
Dacă imaginea NU conține o insectă/păianjen, pune is_bug=false și restul câmpurilor ca șiruri goale.
Dacă nu ești sigur, folosește confidence="low". Scrie toate textele în limba română.`;

export function buildGeminiRequest(base64, mimeType) {
  return {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  };
}

export function parseGeminiResponse(apiResp) {
  const text = apiResp?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: raspuns gol");
  return JSON.parse(text);
}

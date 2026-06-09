const SAFETY = {
  green:  { color: "#1f9d55", icon: "🟢", label: "Inofensiv" },
  yellow: { color: "#d9a400", icon: "🟡", label: "Atenție" },
  red:    { color: "#d64545", icon: "🔴", label: "Periculos" },
};

function panel(title, text) {
  if (!text) return "";
  return `<details class="panel"><summary>${title}</summary><p>${text}</p></details>`;
}

// Întoarce HTML pentru cardul de rezultat. `userPhoto` = dataURL poza utilizatorului.
export function renderResult(data, userPhoto) {
  if (!data.is_bug) {
    return `<div class="card warn">Asta nu pare o insectă sau un păianjen. Încearcă altă poză.</div>`;
  }
  if (data.confidence === "low") {
    return `<div class="card warn">Nu sunt sigur ce e. Încearcă o poză mai clară și mai apropiată.</div>`;
  }
  const s = SAFETY[data.safety?.level] || SAFETY.yellow;
  const refs = (data.reference_photos || [])
    .map(u => `<img class="ref" src="${u}" alt="referință" loading="lazy">`).join("");

  return `
  <div class="card">
    <div class="safety" style="background:${s.color}">
      ${s.icon} ${s.label} — ${data.safety?.summary_ro || ""}
    </div>
    <h2>${data.common_name_ro} <em>(${data.scientific_name})</em></h2>
    <p class="confidence">Încredere: ${data.confidence}</p>
    <div class="photos">
      <figure><img src="${userPhoto}" alt="poza ta"><figcaption>Poza ta</figcaption></figure>
      ${refs ? `<figure class="refs"><div>${refs}</div><figcaption>Referință</figcaption></figure>` : ""}
    </div>
    ${panel("🌍 Habitat & răspândire", data.habitat_ro)}
    ${panel("📏 Aspect", data.appearance_ro)}
    ${panel("🍽️ Comportament", data.behavior_ro)}
    ${panel("⚠️ Confuzii", data.confusion_ro)}
    <button id="save-btn">💾 Salvează în jurnal</button>
  </div>`;
}

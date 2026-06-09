import { identify } from "./api.js";
import { renderResult } from "./render.js";
import { saveObservation, listObservations, deleteObservation } from "./journal.js";

const fileInput = document.getElementById("file-input");
const captureBtn = document.getElementById("capture-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const journalList = document.getElementById("journal-list");

let lastPhoto = null;   // dataURL
let lastResult = null;

captureBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  lastPhoto = await blobToDataURL(file);
  statusEl.textContent = "Identific…";
  resultEl.innerHTML = "";
  try {
    lastResult = await identify(file);
    resultEl.innerHTML = renderResult(lastResult, lastPhoto);
    wireSaveButton();
    statusEl.textContent = "";
  } catch (e) {
    statusEl.textContent = "❌ " + e.message;
  }
});

function wireSaveButton() {
  const btn = document.getElementById("save-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const location = await getLocation();
    await saveObservation({
      common_name_ro: lastResult.common_name_ro,
      scientific_name: lastResult.scientific_name,
      safety_level: lastResult.safety?.level,
      photo: lastPhoto,
      location,
      date: new Date().toISOString(),
    });
    btn.textContent = "✓ Salvat";
    btn.disabled = true;
    renderJournal();
  });
}

function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.readAsDataURL(blob);
  });
}

async function renderJournal() {
  const items = await listObservations();
  journalList.innerHTML = items.map(o => `
    <div class="jitem">
      <img src="${o.photo}" alt="">
      <div>
        <strong>${o.common_name_ro || "?"}</strong><br>
        <small>${new Date(o.date).toLocaleDateString("ro-RO")}</small>
      </div>
      <button data-id="${o.id}" class="del">🗑</button>
    </div>`).join("") || "<p>Încă nimic salvat.</p>";
  journalList.querySelectorAll(".del").forEach(b =>
    b.addEventListener("click", async () => {
      await deleteObservation(Number(b.dataset.id));
      renderJournal();
    }));
}

renderJournal();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

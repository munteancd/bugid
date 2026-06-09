// Setează la URL-ul Worker-ului după deploy (Task 11). Local: http://localhost:8787
export const WORKER_URL = "http://localhost:8787";

// blob (din cameră) -> { image: base64, mimeType }
async function blobToBase64(blob) {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function identify(blob) {
  const image = await blobToBase64(blob);
  const resp = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, mimeType: blob.type || "image/jpeg" }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Eroare server (${resp.status})`);
  }
  return resp.json();
}

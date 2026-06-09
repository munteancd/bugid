export function buildInatUrl(scientificName) {
  const q = encodeURIComponent(scientificName);
  return `https://api.inaturalist.org/v1/taxa?q=${q}&per_page=1&rank=species`;
}

export function parseInatResponse(resp) {
  const taxon = resp?.results?.[0];
  if (!taxon) return [];
  const urls = [];
  if (taxon.default_photo?.medium_url) urls.push(taxon.default_photo.medium_url);
  for (const tp of taxon.taxon_photos ?? []) {
    const u = tp.photo?.medium_url;
    if (u && !urls.includes(u)) urls.push(u);
  }
  return urls.slice(0, 3);
}

import { describe, it, expect } from "vitest";
import { buildInatUrl, parseInatResponse } from "../worker/src/inat.js";

describe("buildInatUrl", () => {
  it("caută taxonul după nume științific și cere poze", () => {
    const url = buildInatUrl("Apis mellifera");
    expect(url).toContain("api.inaturalist.org");
    expect(url).toContain("Apis%20mellifera");
  });
});

describe("parseInatResponse", () => {
  it("întoarce până la 3 URL-uri de poze (medium)", () => {
    const resp = {
      results: [
        {
          default_photo: { medium_url: "https://x/1.jpg" },
          taxon_photos: [
            { photo: { medium_url: "https://x/2.jpg" } },
            { photo: { medium_url: "https://x/3.jpg" } },
            { photo: { medium_url: "https://x/4.jpg" } },
          ],
        },
      ],
    };
    const photos = parseInatResponse(resp);
    expect(photos.length).toBe(3);
    expect(photos[0]).toBe("https://x/1.jpg");
  });

  it("întoarce listă goală dacă nu există rezultate", () => {
    expect(parseInatResponse({ results: [] })).toEqual([]);
  });
});

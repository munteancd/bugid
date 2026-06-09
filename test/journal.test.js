import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { saveObservation, listObservations, deleteObservation } from "../journal.js";

describe("journal", () => {
  beforeEach(async () => {
    for (const o of await listObservations()) await deleteObservation(o.id);
  });

  it("salvează și citește o observație", async () => {
    const id = await saveObservation({
      common_name_ro: "Albină",
      scientific_name: "Apis mellifera",
      photo: "data:image/jpeg;base64,AAAA",
      location: { lat: 45.1, lon: 24.2 },
      date: "2026-06-09T10:00:00Z",
    });
    const all = await listObservations();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(id);
    expect(all[0].common_name_ro).toBe("Albină");
  });

  it("șterge o observație", async () => {
    const id = await saveObservation({ common_name_ro: "X", date: "2026-06-09" });
    await deleteObservation(id);
    expect(await listObservations()).toEqual([]);
  });
});

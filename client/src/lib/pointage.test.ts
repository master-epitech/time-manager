import { describe, expect, it } from "vitest";
import type { WorkSession } from "@/lib/api";
import { dureeSession, statutJour, totalMinutes } from "./pointage";

const base: WorkSession = {
  userId: "u",
  teamId: "t",
  workDate: "2026-11-13",
  entryAt: "2026-11-13T07:00:00.000Z",
  exitAt: "2026-11-13T11:00:00.000Z",
  minutes: 240,
  status: "COMPLETE",
  workMode: "BUREAU",
};
const maintenant = new Date("2026-11-13T12:00:00.000Z");

describe("pointage", () => {
  it("compte une session terminée, en cours, et exclut une incomplète", () => {
    expect(dureeSession(base, maintenant)).toBe(240);
    expect(dureeSession({ ...base, status: "OPEN", exitAt: null, minutes: 0 }, maintenant)).toBe(300);
    expect(dureeSession({ ...base, status: "INCOMPLETE", exitAt: null, minutes: 0 }, maintenant)).toBe(0);
  });

  it("additionne les sessions", () => {
    expect(totalMinutes([base, base], maintenant)).toBe(480);
  });

  it("donne le statut d'une journée", () => {
    expect(statutJour("2026-11-13", [base], "2026-11-14")).toBe("complet");
    expect(statutJour("2026-11-13", [{ ...base, status: "INCOMPLETE" }], "2026-11-14")).toBe("incomplet");
    expect(statutJour("2026-11-13", [{ ...base, status: "OPEN" }], "2026-11-13")).toBe("en-cours");
    expect(statutJour("2026-11-12", [], "2026-11-14")).toBe("vide");
    expect(statutJour("2026-11-14", [], "2026-11-14")).toBe("non-travaille"); // samedi
    expect(statutJour("2026-11-16", [], "2026-11-14")).toBe("a-venir");
  });
});

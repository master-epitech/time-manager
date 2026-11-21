import { describe, expect, it } from "vitest";
import { LEA, EQUIPES } from "@/mocks";
import { dateFr, equipesAutorisees, etatCompte } from "./comptes";

describe("comptes", () => {
  it("décrit l'état d'un compte", () => {
    expect(etatCompte(LEA)).toEqual({ texte: "Actif · Microsoft lié", ton: "actif" });
    expect(etatCompte({ ...LEA, isActive: false }).texte).toBe("Désactivé");
    expect(etatCompte({ ...LEA, invitationStatus: "PENDING" }).texte).toBe("Actif · invitation envoyée");
    expect(etatCompte({ ...LEA, authProvider: "PASSWORD", invitationStatus: "NONE" }).texte).toBe("Actif");
  });

  it("formate une date", () => {
    expect(dateFr("2026-09-30")).toBe("30/09/2026");
  });

  it("limite le manager à ses équipes", () => {
    const karim = "55555555-5555-5555-5555-555555555505";
    expect(equipesAutorisees(EQUIPES, karim, false).map((e) => e.code)).toEqual(["CS-N1"]);
    expect(equipesAutorisees(EQUIPES, karim, true)).toHaveLength(3);
  });
});

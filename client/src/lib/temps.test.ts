import { describe, expect, it } from "vitest";
import {
  ajouterJours,
  formatDuree,
  formatHeure,
  formatJourCourt,
  formatJourTableau,
  formatSemaine,
  jourIso,
  lundiDe,
  minutesEntre,
  numeroSemaine,
} from "./temps";

describe("temps", () => {
  it("formate une durée en heures:minutes", () => {
    expect(formatDuree(0)).toBe("00:00");
    expect(formatDuree(1695)).toBe("28:15");
    expect(formatDuree(-5)).toBe("00:00");
  });

  it("calcule le jour dans le fuseau de l'organisation", () => {
    // 23 h 30 UTC le 14/11 = 00 h 30 le 15/11 à Paris
    expect(jourIso(new Date("2026-11-14T23:30:00Z"))).toBe("2026-11-15");
  });

  it("trouve le lundi de la semaine", () => {
    expect(lundiDe("2026-11-14")).toBe("2026-11-09"); // samedi
    expect(lundiDe("2026-11-09")).toBe("2026-11-09"); // lundi
    expect(lundiDe("2026-11-15")).toBe("2026-11-09"); // dimanche
  });

  it("ajoute des jours en changeant de mois", () => {
    expect(ajouterJours("2026-11-30", 1)).toBe("2026-12-01");
  });

  it("affiche l'heure de Paris", () => {
    expect(formatHeure("2026-11-13T06:50:00.000Z")).toBe("07:50");
  });

  it("formate un jour court", () => {
    expect(formatJourCourt("2026-11-13")).toBe("Vendredi 13/11");
  });

  it("compte les minutes écoulées", () => {
    expect(minutesEntre("2026-11-14T08:00:00Z", new Date("2026-11-14T09:30:59Z"))).toBe(90);
  });

  it("donne le numéro de semaine ISO", () => {
    expect(numeroSemaine("2026-11-14")).toBe(46);
    expect(numeroSemaine("2026-01-01")).toBe(1); // jeudi
    expect(numeroSemaine("2027-01-01")).toBe(53); // vendredi : dernière semaine de 2026
  });

  it("décrit une semaine en clair", () => {
    expect(formatSemaine("2026-11-09")).toBe("du lundi 9 au dimanche 15 novembre 2026");
    expect(formatSemaine("2026-11-30")).toBe("du lundi 30 novembre au dimanche 6 décembre 2026");
  });

  it("formate un jour de tableau", () => {
    expect(formatJourTableau("2026-11-13")).toBe("Ven. 13/11");
  });
});

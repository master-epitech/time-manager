import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockClient as api, resetMockData } from "./mock-client";

const LEA = "lea.dubois@trinity-market.example";

beforeEach(async () => {
  resetMockData();
  await api.auth.login({ email: LEA, password: "demo" });
});

afterEach(() => api.auth.logout());

describe("connexion factice", () => {
  it("connecte Léa et renvoie son contexte", async () => {
    const me = await api.auth.me();
    expect(me.user.firstName).toBe("Léa");
    expect(me.activeProfile.code).toBe("EMPLOYEE");
  });

  it("refuse un compte inconnu", async () => {
    await expect(api.auth.login({ email: "inconnu@trinity-market.example", password: "x" })).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    });
  });

  it("répond 401 après la déconnexion", async () => {
    await api.auth.logout();
    await expect(api.auth.me()).rejects.toMatchObject({ status: 401 });
  });
});

describe("pointage factice (R13 : pas de double pointage)", () => {
  it("enchaîne une arrivée puis un départ", async () => {
    await expect(api.clock.punch("ENTREE")).resolves.toMatchObject({ type: "ENTREE", status: "VALIDE" });
    await expect(api.clock.punch("SORTIE")).resolves.toMatchObject({ type: "SORTIE" });
  });

  it("refuse deux arrivées de suite", async () => {
    await api.clock.punch("ENTREE");
    await expect(api.clock.punch("ENTREE")).rejects.toMatchObject({ code: "POINTAGE_ALREADY_OPEN" });
  });

  it("refuse un départ sans arrivée", async () => {
    await expect(api.clock.punch("SORTIE")).rejects.toMatchObject({ code: "POINTAGE_NO_OPEN_SESSION" });
  });
});

describe("sessions factices", () => {
  it("ne renvoie que les sessions de Léa sur la période demandée", async () => {
    const { data } = await api.clock.mySessions({ from: "2026-11-09", to: "2026-11-10" });
    expect(data).toHaveLength(4);
    expect(data.every((s) => s.workDate <= "2026-11-10")).toBe(true);
  });

  it("calcule la durée de chaque session à partir des heures", async () => {
    const { data } = await api.clock.mySessions({ from: "2026-11-09", to: "2026-11-09" });
    expect(data.map((s) => s.minutes)).toEqual([208, 215]);
  });
});

describe("gestion des comptes factice", () => {
  const connecter = (email: string) => api.auth.login({ email, password: "demo" });

  it("refuse la gestion des comptes à un employé", async () => {
    await expect(api.users.list()).rejects.toMatchObject({ status: 403 });
  });

  it("limite le manager aux comptes de son équipe", async () => {
    await connecter("karim.benali@trinity-market.example");
    const { data } = await api.users.list();
    expect(data.every((u) => u.teamId === "44444444-4444-4444-4444-444444444443")).toBe(true);
    expect(data.some((u) => u.lastName === "Fontaine")).toBe(false);
  });

  it("laisse les RH voir tous les comptes et rechercher sans accents", async () => {
    await connecter("claire.fontaine@trinity-market.example");
    expect((await api.users.list()).meta?.total).toBe(8);
    const { data } = await api.users.list({ q: "lea" });
    expect(data.map((u) => u.firstName)).toEqual(["Léa"]);
  });

  it("crée un compte avec un matricule unique et refuse les doublons", async () => {
    await connecter("karim.benali@trinity-market.example");
    const nouveau = {
      firstName: "Tom",
      lastName: "Leroy",
      email: "tom.leroy@trinity-market.example",
      profileCode: "EMPLOYEE" as const,
      teamId: "44444444-4444-4444-4444-444444444443",
    };
    const compte = await api.users.create(nouveau);
    expect(compte.matricule).toMatch(/^TM-\d{4}-00703$/);
    expect(compte.teamName).toBe("Service Client — Niveau 1");
    await expect(api.users.create(nouveau)).rejects.toMatchObject({ code: "EMAIL_ALREADY_USED" });
    await expect(api.users.create({ ...nouveau, email: "tom@gmail.com" })).rejects.toMatchObject({
      code: "EMAIL_DOMAIN_NOT_ALLOWED",
    });
  });

  it("désactive puis réactive un compte", async () => {
    await connecter("karim.benali@trinity-market.example");
    const omar = "55555555-5555-5555-5555-555555555509";
    await api.users.deactivate(omar);
    expect((await api.users.get(omar)).isActive).toBe(false);
    await api.users.activate(omar);
    expect((await api.users.get(omar)).isActive).toBe(true);
  });
});

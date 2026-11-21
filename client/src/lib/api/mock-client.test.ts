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

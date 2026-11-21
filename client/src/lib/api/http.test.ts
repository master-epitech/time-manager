import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import { buildUrl, request } from "./http";
import { clearToken, getToken, onSessionExpired, setToken } from "./session";

/** Remplace fetch par une fausse réponse et renvoie l'espion pour inspecter l'appel */
function fauxFetch(status: number, body?: unknown) {
  const spy = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", spy);
  return spy;
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearToken();
});

describe("buildUrl", () => {
  it("ajoute le préfixe et ignore les paramètres vides", () => {
    expect(buildUrl("/me/clock-sessions", { date_from: "2026-11-09", date_to: undefined, page: null })).toBe(
      "/api/v1/me/clock-sessions?date_from=2026-11-09",
    );
  });
});

describe("request", () => {
  it("envoie le jeton Bearer et le corps en JSON", async () => {
    setToken("abc");
    const spy = fauxFetch(201, { id: "1" });

    await expect(request("POST", "/me/clock-events", { body: { type: "ENTREE" } })).resolves.toEqual({ id: "1" });

    const [url, init] = spy.mock.calls[0];
    expect(url).toBe("/api/v1/me/clock-events");
    expect(init.headers.Authorization).toBe("Bearer abc");
    expect(init.body).toBe('{"type":"ENTREE"}');
  });

  it("n'envoie pas de jeton sur une route publique", async () => {
    setToken("abc");
    const spy = fauxFetch(200, {});
    await request("POST", "/auth/login", { auth: false });
    expect(spy.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("renvoie undefined pour une réponse 204", async () => {
    fauxFetch(204);
    await expect(request("POST", "/notifications/read-all")).resolves.toBeUndefined();
  });

  it("transforme une réponse d'erreur en ApiError", async () => {
    fauxFetch(409, { error: { code: "POINTAGE_NO_OPEN_SESSION", message: "x" } });
    await expect(request("POST", "/me/clock-events")).rejects.toMatchObject({
      status: 409,
      code: "POINTAGE_NO_OPEN_SESSION",
    });
  });

  it("efface le jeton et prévient l'application quand la session a expiré (401)", async () => {
    setToken("expire");
    const ecouteur = vi.fn();
    const desabonner = onSessionExpired(ecouteur);
    fauxFetch(401, { error: { code: "UNAUTHORIZED", message: "x" } });

    await expect(request("GET", "/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(ecouteur).toHaveBeenCalledOnce();
    desabonner();
  });

  it("signale une erreur réseau quand le serveur est injoignable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(request("GET", "/health")).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
});

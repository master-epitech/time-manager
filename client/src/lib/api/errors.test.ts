import { describe, expect, it } from "vitest";
import { ApiError, messageFor, toApiError } from "./errors";

describe("toApiError", () => {
  it("reprend le code et le requestId d'une réponse au format R46", () => {
    const err = toApiError(409, {
      error: { code: "POINTAGE_ALREADY_OPEN", message: "already open" },
      requestId: "req-1",
    });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe("POINTAGE_ALREADY_OPEN");
    expect(err.message).toBe("Vous avez déjà pointé votre arrivée.");
    expect(err.requestId).toBe("req-1");
  });

  it("déduit le code du statut HTTP quand le corps est illisible", () => {
    expect(toApiError(403, null).code).toBe("FORBIDDEN");
    expect(toApiError(500, "<html>").code).toBe("UNKNOWN_ERROR");
  });
});

describe("messageFor", () => {
  it("renvoie un message générique pour un code inconnu", () => {
    expect(messageFor("CODE_INCONNU")).toMatch(/erreur inattendue/);
  });
});

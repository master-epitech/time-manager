/*
 * Point d'entrée du client API (TM-62).
 * Les écrans importent uniquement `api` : ils ne savent pas s'ils parlent au vrai back
 * ou aux données factices.
 *
 *   import { api, ApiError } from "@/lib/api";
 *   const sessions = await api.clock.mySessions({ from: "2026-11-09", to: "2026-11-13" });
 */
import { httpClient, type ApiClient } from "./client";
import { USE_MOCK_API } from "./config";
import { mockClient } from "./mock-client";

export const api: ApiClient = USE_MOCK_API ? mockClient : httpClient;

export type { ApiClient, NewAbsence, NewCorrection, Periode } from "./client";
export { ApiError } from "./errors";
export { onSessionExpired } from "./session";
export type * from "./types";

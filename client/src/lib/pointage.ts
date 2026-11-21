import type { WorkSession } from "@/lib/api";
import { minutesEntre } from "./temps";

/**
 * Règles de calcul du temps travaillé, partagées par l'accueil et l'écran « Mes pointages ».
 * - Session terminée : sa durée enregistrée.
 * - Session en cours : temps écoulé depuis l'entrée.
 * - Session incomplète (sortie oubliée) : exclue des calculs jusqu'à sa régularisation (R15).
 */
export function dureeSession(session: WorkSession, maintenant: Date): number {
  if (session.status === "INCOMPLETE") return 0;
  if (session.status === "OPEN") return minutesEntre(session.entryAt, maintenant);
  return session.minutes;
}

/** Total des minutes travaillées sur un ensemble de sessions */
export function totalMinutes(sessions: WorkSession[], maintenant: Date): number {
  return sessions.reduce((total, s) => total + dureeSession(s, maintenant), 0);
}

export type StatutJour = "complet" | "en-cours" | "incomplet" | "vide" | "non-travaille" | "a-venir";

/** Statut d'une journée, pour le tableau des pointages */
export function statutJour(jour: string, sessions: WorkSession[], aujourdhui: string): StatutJour {
  if (sessions.some((s) => s.status === "INCOMPLETE")) return "incomplet";
  if (sessions.some((s) => s.status === "OPEN")) return "en-cours";
  if (sessions.length > 0) return "complet";
  if (jour > aujourdhui) return "a-venir";
  const jourSemaine = new Date(`${jour}T12:00:00Z`).getUTCDay();
  return jourSemaine === 0 || jourSemaine === 6 ? "non-travaille" : "vide";
}

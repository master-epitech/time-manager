/**
 * Dates et durées affichées dans l'application.
 * - Un « jour » métier est une chaîne ISO "YYYY-MM-DD" dans le fuseau de l'organisation.
 * - Les instants (entryAt, exitAt…) arrivent de l'API en UTC et sont affichés dans ce fuseau.
 */
export const FUSEAU_PAR_DEFAUT = "Europe/Paris";

/** Jour ISO ("2026-11-14") d'un instant, dans le fuseau donné */
export function jourIso(instant: Date, fuseau = FUSEAU_PAR_DEFAUT): string {
  // Le format en-CA donne directement AAAA-MM-JJ
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuseau, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    instant,
  );
}

/** Ajoute n jours à un jour ISO (midi UTC : pas de piège de changement d'heure) */
export function ajouterJours(jour: string, n: number): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lundi de la semaine d'un jour ISO */
export function lundiDe(jour: string): string {
  const jourSemaine = new Date(`${jour}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  return ajouterJours(jour, -((jourSemaine + 6) % 7));
}

/** Minutes écoulées entre un instant ISO et une date */
export function minutesEntre(debutIso: string, fin: Date): number {
  return Math.max(0, Math.floor((fin.getTime() - Date.parse(debutIso)) / 60_000));
}

/** Durée en heures:minutes, ex. 1695 → "28:15" */
export function formatDuree(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Heure d'un instant, ex. "08:30" */
export function formatHeure(instant: string | Date, fuseau = FUSEAU_PAR_DEFAUT): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau, hour: "2-digit", minute: "2-digit" }).format(
    new Date(instant),
  );
}

/** Date complète, ex. "Samedi 14 novembre 2026" */
export function formatDateLongue(instant: Date, fuseau = FUSEAU_PAR_DEFAUT): string {
  const texte = new Intl.DateTimeFormat("fr-FR", {
    timeZone: fuseau,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Jour court, ex. "2026-11-13" → "Vendredi 13/11" */
export function formatJourCourt(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  const nom = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", weekday: "long" }).format(d);
  return `${nom.charAt(0).toUpperCase()}${nom.slice(1)} ${jour.slice(8, 10)}/${jour.slice(5, 7)}`;
}

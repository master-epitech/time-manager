import type { IconName } from "@/components/ui/Icon/Icon";

/**
 * Les 5 domaines métier de l'application.
 * Chaque domaine a TOUJOURS la même couleur et la même icône, partout :
 * c'est le repère visuel de la charte Lilas Pro.
 */
export type Domain = "temps" | "conges" | "teletravail" | "anomalie" | "demande";

export const DOMAINS: Record<Domain, { label: string; icon: IconName }> = {
  temps: { label: "Temps et pointage", icon: "clock" },
  conges: { label: "Congés", icon: "sun" },
  teletravail: { label: "Télétravail", icon: "house" },
  anomalie: { label: "Anomalies", icon: "warning" },
  demande: { label: "Demandes et validation", icon: "doc" },
};

import type { ContractType, Team, User } from "@/lib/api";

export const LIBELLE_CONTRAT: Record<ContractType, string> = {
  CDI: "CDI",
  CDD: "CDD",
  INTERIM: "Intérim",
  STAGE: "Stage",
  PRESTATAIRE: "Prestataire",
  AUTRE: "Autre",
};

export type EtatCompte = { texte: string; ton: "actif" | "attention" | "inactif" };

/** État du compte affiché dans la liste : toujours un texte, la couleur ne fait que le renforcer */
export function etatCompte(u: User): EtatCompte {
  if (!u.isActive) return { texte: "Désactivé", ton: "inactif" };
  if (u.status === "SUSPENDU") return { texte: "Suspendu", ton: "attention" };
  if (u.status === "SORTI") return { texte: "Sorti", ton: "inactif" };
  if (u.invitationStatus === "PENDING") return { texte: "Actif · invitation envoyée", ton: "actif" };
  if (u.invitationStatus === "EXPIRED") return { texte: "Actif · invitation expirée", ton: "attention" };
  if (u.invitationStatus === "ACCEPTED" && u.authProvider !== "PASSWORD") return { texte: "Actif · Microsoft lié", ton: "actif" };
  return { texte: "Actif", ton: "actif" };
}

/** Date ISO en format français, ex. "2026-09-30" → "30/09/2026" */
export function dateFr(jour: string): string {
  return `${jour.slice(8, 10)}/${jour.slice(5, 7)}/${jour.slice(0, 4)}`;
}

/** Équipes dans lesquelles l'utilisateur connecté peut créer ou déplacer un compte */
export function equipesAutorisees(equipes: Team[], userId: string, gestionComplete: boolean): Team[] {
  return equipes.filter((e) => e.isActive && (gestionComplete || e.manager?.id === userId));
}

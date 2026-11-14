import type { IconName } from "@/components/ui/Icon/Icon";
import type { ProfileCode } from "@/lib/api/types";
import { TOUS_LES_PROFILS } from "@/lib/auth/roles";
import type { Domain } from "./domains";

export type CompteurNav = "aValider" | "anomalies";

export type LienNav = {
  href: string;
  label: string;
  icone: IconName;
  /** Domaine qui colore l'icône ; sans domaine, l'icône est grise (neutre) */
  domaine?: Domain;
  /** Compteur affiché en pastille à droite du lien */
  compteur?: CompteurNav;
};

export type SectionNav = {
  titre: string;
  /** Profils qui voient la section ET ont le droit d'ouvrir ses pages */
  profils: ProfileCode[];
  liens: LienNav[];
};

/**
 * Structure du menu de gauche, identique aux maquettes, et droits d'accès aux pages.
 * Une seule source : le menu ET la protection des pages (TM-65) en découlent.
 */
export const SECTIONS_NAV: SectionNav[] = [
  {
    titre: "Mon espace",
    profils: TOUS_LES_PROFILS,
    liens: [
      { href: "/accueil", label: "Accueil", icone: "grid" },
      { href: "/pointages", label: "Pointages", icone: "clock", domaine: "temps" },
      { href: "/planning", label: "Planning", icone: "calendar", domaine: "teletravail" },
      { href: "/demandes", label: "Demandes", icone: "doc", domaine: "demande" },
    ],
  },
  {
    titre: "Équipe",
    profils: ["MANAGER", "DIRECTOR"],
    liens: [
      { href: "/equipe/membres", label: "Membres", icone: "users" },
      { href: "/equipe/a-valider", label: "À valider", icone: "check-square", domaine: "demande", compteur: "aValider" },
      { href: "/equipe/anomalies", label: "Anomalies", icone: "warning", domaine: "anomalie", compteur: "anomalies" },
    ],
  },
  {
    titre: "Pilotage",
    profils: ["MANAGER", "DIRECTOR", "CEO", "HR"],
    liens: [{ href: "/pilotage/indicateurs", label: "Indicateurs", icone: "chart", domaine: "temps" }],
  },
  {
    titre: "Gestion",
    // Le manager crée les comptes de son équipe (SOCLE), les RH et l'admin gèrent tous les comptes
    profils: ["MANAGER", "HR", "SUPER_ADMIN"],
    liens: [
      { href: "/gestion/utilisateurs", label: "Utilisateurs", icone: "user" },
      { href: "/gestion/equipes", label: "Équipes", icone: "org" },
    ],
  },
];

/** Lien du bas du menu, visible par tous */
export const LIEN_COMPTE: LienNav = { href: "/mon-compte", label: "Mon compte", icone: "user-circle" };

/** Sections visibles pour un profil */
export function sectionsPour(profil: ProfileCode): SectionNav[] {
  return SECTIONS_NAV.filter((s) => s.profils.includes(profil));
}

/** Le profil a-t-il le droit d'ouvrir cette page ? Les pages hors menu (ex. Mon compte) sont ouvertes à tous. */
export function peutAcceder(profil: ProfileCode, pathname: string): boolean {
  const section = SECTIONS_NAV.find((s) =>
    s.liens.some((l) => pathname === l.href || pathname.startsWith(`${l.href}/`)),
  );
  return !section || section.profils.includes(profil);
}

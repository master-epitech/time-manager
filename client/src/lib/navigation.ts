import type { IconName } from "@/components/ui/Icon/Icon";
import type { Domain } from "./domains";
import type { Role } from "./session-factice";

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
  /** Rôles qui voient la section */
  roles: Role[];
  liens: LienNav[];
};

/** Structure du menu de gauche, identique aux maquettes. Une seule source pour toute l'app. */
export const SECTIONS_NAV: SectionNav[] = [
  {
    titre: "Mon espace",
    roles: ["employe", "manager"],
    liens: [
      { href: "/accueil", label: "Accueil", icone: "grid" },
      { href: "/pointages", label: "Pointages", icone: "clock", domaine: "temps" },
      { href: "/planning", label: "Planning", icone: "calendar", domaine: "teletravail" },
      { href: "/demandes", label: "Demandes", icone: "doc", domaine: "demande" },
    ],
  },
  {
    titre: "Équipe",
    roles: ["manager"],
    liens: [
      { href: "/equipe/membres", label: "Membres", icone: "users" },
      { href: "/equipe/a-valider", label: "À valider", icone: "check-square", domaine: "demande", compteur: "aValider" },
      { href: "/equipe/anomalies", label: "Anomalies", icone: "warning", domaine: "anomalie", compteur: "anomalies" },
    ],
  },
  {
    titre: "Pilotage",
    roles: ["manager"],
    liens: [{ href: "/pilotage/indicateurs", label: "Indicateurs", icone: "chart", domaine: "temps" }],
  },
  {
    titre: "Gestion",
    roles: ["manager"],
    liens: [
      { href: "/gestion/utilisateurs", label: "Utilisateurs", icone: "user" },
      { href: "/gestion/equipes", label: "Équipes", icone: "org" },
    ],
  },
];

/** Lien du bas du menu, visible par tous */
export const LIEN_COMPTE: LienNav = { href: "/mon-compte", label: "Mon compte", icone: "user-circle" };

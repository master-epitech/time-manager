import type { ProfileCode } from "@/lib/api/types";

/** Libellés affichés à l'écran pour les codes de profil (codes en anglais, R1) */
export const LIBELLE_PROFIL: Record<ProfileCode, string> = {
  EMPLOYEE: "Employé",
  MANAGER: "Manager",
  HR: "Ressources humaines",
  DIRECTOR: "Directeur",
  CEO: "Direction générale",
  SUPER_ADMIN: "Administrateur",
};

export const TOUS_LES_PROFILS: ProfileCode[] = ["EMPLOYEE", "MANAGER", "HR", "DIRECTOR", "CEO", "SUPER_ADMIN"];

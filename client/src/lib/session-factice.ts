/**
 * Données FACTICES en attendant la connexion réelle (TM-49 / TM-65).
 * À remplacer par la session renvoyée par l'API : ne pas utiliser ailleurs
 * que dans le layout de l'application.
 */
export type Role = "employe" | "manager";

export type UtilisateurConnecte = {
  prenom: string;
  nom: string;
  role: Role;
  equipe: string;
};

export const UTILISATEUR_FACTICE: UtilisateurConnecte = {
  prenom: "Paul",
  nom: "Martin",
  role: "manager", // passer à "employe" pour voir le menu d'un employé
  equipe: "Ventes Lyon",
};

/** Compteurs affichés en pastille dans le menu (demandes à valider, anomalies ouvertes). */
export const COMPTEURS_FACTICES = { aValider: 5, anomalies: 4 };

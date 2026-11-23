import type { Metadata } from "next";
import { GestionUtilisateurs } from "./GestionUtilisateurs";

export const metadata: Metadata = { title: "Utilisateurs · Time Manager" };

/** Gestion des comptes : liste (TM-66), création et modification (TM-67) — maquette 13 */
export default function UtilisateursPage() {
  return <GestionUtilisateurs />;
}

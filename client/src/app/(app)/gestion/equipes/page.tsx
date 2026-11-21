import type { Metadata } from "next";
import { GestionEquipes } from "./GestionEquipes";

export const metadata: Metadata = { title: "Équipes · Time Manager" };

/** Gestion des équipes : liste (TM-69), création, modification et membres (TM-70) — maquette 14 */
export default function EquipesPage() {
  return <GestionEquipes />;
}

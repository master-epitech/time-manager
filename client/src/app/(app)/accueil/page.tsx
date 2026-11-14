import type { Metadata } from "next";
import { AccueilEmploye } from "./AccueilEmploye";

export const metadata: Metadata = { title: "Accueil · Time Manager" };

/** Accueil de l'employé : pointage du jour, demandes, anomalies, soldes (TM-77, maquette 02) */
export default function AccueilPage() {
  return <AccueilEmploye />;
}

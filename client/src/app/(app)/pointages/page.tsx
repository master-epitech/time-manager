import type { Metadata } from "next";
import { MesPointages } from "./MesPointages";

export const metadata: Metadata = { title: "Mes pointages · Time Manager" };

/** Historique des pointages de l'employé, semaine par semaine (TM-76, maquette 10) */
export default function PointagesPage() {
  return <MesPointages />;
}

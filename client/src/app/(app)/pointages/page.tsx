import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Mes pointages · Time Manager" };

export default function PointagesPage() {
  return (
    <>
      <PageHeader titre="Mes pointages" sousTitre="Historique de vos entrées et sorties" />
      <EcranAVenir maquette="10 · Mes pointages" />
    </>
  );
}

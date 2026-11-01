import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Indicateurs · Time Manager" };

export default function IndicateursPage() {
  return (
    <>
      <PageHeader titre="Indicateurs" sousTitre="KPI de l'équipe, calculés par le serveur" />
      <EcranAVenir maquette="09 · Pilotage · Indicateurs" />
    </>
  );
}

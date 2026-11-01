import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Anomalies · Time Manager" };

export default function AnomaliesPage() {
  return (
    <>
      <PageHeader titre="Anomalies" sousTitre="Sessions incomplètes et absences à justifier" />
      <EcranAVenir maquette="08 · Équipe · Anomalies" />
    </>
  );
}

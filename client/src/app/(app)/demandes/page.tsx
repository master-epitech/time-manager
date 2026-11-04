import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Mes demandes · Time Manager" };

export default function DemandesPage() {
  return (
    <>
      <PageHeader titre="Mes demandes" sousTitre="Congés, télétravail, corrections et justifications" />
      <EcranAVenir maquette="12 · Mes demandes" />
    </>
  );
}

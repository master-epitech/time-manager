import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Équipes · Time Manager" };

export default function EquipesPage() {
  return (
    <>
      <PageHeader titre="Équipes" sousTitre="Composition des équipes et managers" />
      <EcranAVenir maquette="14 · Gestion · Équipes" />
    </>
  );
}

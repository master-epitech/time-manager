import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "À valider · Time Manager" };

export default function AValiderPage() {
  return (
    <>
      <PageHeader titre="À valider" sousTitre="Demandes de votre équipe en attente de décision" />
      <EcranAVenir maquette="06 · Équipe · À valider" />
    </>
  );
}

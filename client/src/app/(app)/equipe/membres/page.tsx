import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Membres de l'équipe · Time Manager" };

export default function MembresPage() {
  return (
    <>
      <PageHeader titre="Membres de l'équipe" sousTitre="Présence et heures de la semaine" />
      <EcranAVenir maquette="03 · Équipe · Membres" />
    </>
  );
}

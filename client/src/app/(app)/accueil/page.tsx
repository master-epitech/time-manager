import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Accueil · Time Manager" };

export default function AccueilPage() {
  return (
    <>
      <PageHeader titre="Accueil" sousTitre="Bonjour Paul · votre journée et vos soldes" />
      <EcranAVenir maquette="02 · Accueil employé" />
    </>
  );
}

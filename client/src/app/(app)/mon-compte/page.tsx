import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Mon compte · Time Manager" };

export default function MonComptePage() {
  return (
    <>
      <PageHeader titre="Mon compte" sousTitre="Informations personnelles, mot de passe et langue" />
      <EcranAVenir maquette="15 · Mon compte" />
    </>
  );
}

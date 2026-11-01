import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Utilisateurs · Time Manager" };

export default function UtilisateursPage() {
  return (
    <>
      <PageHeader titre="Utilisateurs" sousTitre="Créer, modifier et désactiver les comptes" />
      <EcranAVenir maquette="13 · Gestion · Utilisateurs" />
    </>
  );
}

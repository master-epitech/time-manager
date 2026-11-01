import type { Metadata } from "next";
import { EcranAVenir, PageHeader } from "@/components/layout";

export const metadata: Metadata = { title: "Mon planning · Time Manager" };

export default function PlanningPage() {
  return (
    <>
      <PageHeader titre="Mon planning" sousTitre="Bureau, télétravail et congés du mois" />
      <EcranAVenir maquette="11 · Mon planning" />
    </>
  );
}

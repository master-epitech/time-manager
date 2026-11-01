import { Card } from "@/components/ui";

/** Contenu provisoire des écrans pas encore développés. */
export function EcranAVenir({ maquette }: { maquette: string }) {
  return (
    <Card>
      <p>
        Écran à venir. Voir la maquette <strong>« {maquette} »</strong> dans <code>docs/maquettes/</code>.
      </p>
    </Card>
  );
}

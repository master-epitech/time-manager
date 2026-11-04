import type { Metadata } from "next";
import { Badge, Button, Card, Icon, Input } from "@/components/ui";
import { DOMAINS, type Domain } from "@/lib/domains";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Charte Lilas Pro · Time Manager" };

/* Nuancier : nom affiché → variable CSS de globals.css */
const COULEURS: Array<[string, string]> = [
  ["Lilas (marque)", "--lilas"],
  ["Encre", "--encre"],
  ["Gris", "--gris"],
  ["Fond", "--fond"],
  ["Bordure", "--bordure"],
  ["Congés", "--conges"],
  ["Télétravail", "--teletravail"],
  ["Anomalie", "--anomalie"],
  ["Demande", "--demande"],
];

/**
 * Page de démonstration des composants de base (TM-61).
 * Sert à relire la charte et à tester les composants isolément.
 */
export default function DesignPage() {
  return (
    <main className={styles.page}>
      <header>
        <p className={`mono ${styles.surtitre}`}>TIME MANAGER · TM-61</p>
        <h1>Charte Lilas Pro · composants de base</h1>
      </header>

      <Card titre="Couleurs">
        <ul className={styles.nuancier}>
          {COULEURS.map(([nom, variable]) => (
            <li key={variable}>
              <span className={styles.pastille} style={{ background: `var(${variable})` }} />
              <span>{nom}</span>
              <code className="mono">{variable}</code>
            </li>
          ))}
        </ul>
      </Card>

      <Card titre="Domaines · badges">
        <div className={styles.ligne}>
          {(Object.keys(DOMAINS) as Domain[]).map((d) => (
            <Badge key={d} domaine={d} />
          ))}
        </div>
        <div className={styles.ligne}>
          <Badge domaine="anomalie">Session incomplète</Badge>
          <Badge domaine="demande">En attente</Badge>
          <Badge domaine="conges">CP · 2 jours</Badge>
        </div>
      </Card>

      <Card titre="Boutons">
        <div className={styles.ligne}>
          <Button icone={<Icon name="clock" />}>Pointer mon arrivée</Button>
          <Button variant="secondaire">Corriger</Button>
          <Button variant="discret">Annuler</Button>
          <Button variant="danger">Supprimer</Button>
          <Button chargement>Enregistrement</Button>
          <Button disabled>Indisponible</Button>
        </div>
        <div className={styles.ligne}>
          <Button taille="s">Petit primaire</Button>
          <Button taille="s" variant="secondaire">
            Petit secondaire
          </Button>
        </div>
      </Card>

      <Card titre="Champs de saisie" actions={<Button taille="s">Action</Button>}>
        <div className={styles.grille}>
          <Input label="Adresse e-mail" type="email" placeholder="prenom.nom@trinity.fr" required />
          <Input label="Heure d'arrivée" type="time" aide="Format 24 h, ex. 08:32" />
          <Input label="Mot de passe" type="password" erreur="Mot de passe incorrect" defaultValue="secret" />
        </div>
      </Card>

      <Card titre="Heures et durées">
        <p>
          Aujourd&apos;hui : <span className="mono">08:32 – 12:00 · 14:00 – 17:05</span> · total{" "}
          <strong className="mono">06 h 33</strong>
        </p>
      </Card>
    </main>
  );
}

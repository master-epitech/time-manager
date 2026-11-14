"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Icon, Input } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { USE_MOCK_API } from "@/lib/api/config";
import styles from "./page.module.css";

/** Comptes proposés en mode factice pour tester sans back */
const COMPTES_DEMO = [
  { libelle: "Léa (employée)", email: "lea.dubois@trinity-market.example" },
  { libelle: "Karim (manager)", email: "karim.benali@trinity-market.example" },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function seConnecter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setChargement(true);
    try {
      await api.auth.login({ email: email.trim(), password: motDePasse });
      router.replace("/accueil");
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : "Une erreur inattendue est survenue.");
      setChargement(false);
    }
  }

  function connexionMicrosoft() {
    // TM-56 : redirection vers Microsoft (GET /auth/microsoft/config) quand le back sera prêt
    setErreur(null);
    setInfo("La connexion Microsoft sera disponible avec le back. Utilisez votre email et votre mot de passe.");
  }

  function remplirCompteDemo(adresse: string) {
    setEmail(adresse);
    setMotDePasse("demo");
    setErreur(null);
  }

  return (
    <div className={styles.formulaire}>
      <Button type="button" variant="secondaire" icone={<Icon name="user-circle" />} onClick={connexionMicrosoft}>
        Se connecter avec Microsoft
      </Button>

      <div className={styles.separateur} aria-hidden="true">
        <span>ou</span>
      </div>

      <form onSubmit={seConnecter} className={styles.formulaire} noValidate>
        <Input
          label="Adresse email"
          type="email"
          autoComplete="username"
          placeholder="prenom.nom@trinity-market.example"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        />
        <p className={styles.aide}>Mot de passe oublié ? Contactez votre manager.</p>

        {/* Icône + texte : l'erreur n'est jamais signalée par la seule couleur */}
        {erreur && (
          <p className={styles.erreur} role="alert">
            <Icon name="warning" size={16} />
            {erreur}
          </p>
        )}
        {info && (
          <p className={styles.info} role="status">
            <Icon name="info" size={16} />
            {info}
          </p>
        )}

        <Button type="submit" chargement={chargement} disabled={!email || !motDePasse}>
          Se connecter
        </Button>
      </form>

      {USE_MOCK_API && (
        <div className={styles.demo}>
          <p>Mode démonstration (données factices) :</p>
          <div className={styles.boutonsDemo}>
            {COMPTES_DEMO.map((c) => (
              <Button key={c.email} type="button" taille="s" variant="discret" onClick={() => remplirCompteDemo(c.email)}>
                {c.libelle}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

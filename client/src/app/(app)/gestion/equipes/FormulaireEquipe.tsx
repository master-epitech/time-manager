"use client";

import { useState, type FormEvent } from "react";
import { Button, Icon, Input, Select } from "@/components/ui";
import { api, ApiError, type Department, type Team } from "@/lib/api";
import styles from "./page.module.css";

type FormulaireEquipeProps = {
  /** Équipe à modifier ; absente = création */
  equipe?: Team;
  departements: Department[];
  onEnregistre: (equipe: Team, creee: boolean) => void;
  onFermer: () => void;
};

type Erreurs = Partial<Record<"name" | "code" | "departmentId" | "global", string>>;

/** Création ou renommage d'une équipe (TM-70). Le code et le département ne changent pas après création. */
export function FormulaireEquipe({ equipe, departements, onEnregistre, onFermer }: FormulaireEquipeProps) {
  const creation = !equipe;
  const [nom, setNom] = useState(equipe?.name ?? "");
  const [code, setCode] = useState(equipe?.code ?? "");
  const [departement, setDepartement] = useState(equipe?.departmentId ?? departements[0]?.id ?? "");
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoi, setEnvoi] = useState(false);

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const controles: Erreurs = {};
    if (!nom.trim()) controles.name = "Le nom est obligatoire.";
    if (creation && !/^[A-Za-z0-9-]{2,12}$/.test(code.trim())) {
      controles.code = "2 à 12 caractères : lettres, chiffres ou tirets.";
    }
    if (creation && !departement) controles.departmentId = "Choisissez un département.";
    setErreurs(controles);
    if (Object.keys(controles).length > 0) return;

    setEnvoi(true);
    try {
      const resultat = creation
        ? await api.teams.create({ departmentId: departement, code: code.trim().toUpperCase(), name: nom.trim() })
        : await api.teams.update(equipe.id, { name: nom.trim() });
      onEnregistre(resultat, creation);
    } catch (err) {
      if (err instanceof ApiError && err.code === "TEAM_CODE_ALREADY_USED") setErreurs({ code: err.message });
      else setErreurs({ global: err instanceof ApiError ? err.message : "L'enregistrement a échoué." });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section className={styles.detail} aria-labelledby="form-equipe-titre">
      <div className={styles.detailEntete}>
        <h2 id="form-equipe-titre" className={styles.detailTitre}>
          {creation ? "Créer une équipe" : `Modifier « ${equipe.name} »`}
        </h2>
        <Button variant="discret" taille="s" onClick={onFermer}>
          Fermer
        </Button>
      </div>
      <form className={styles.formulaire} onSubmit={enregistrer} noValidate>
        <Input label="Nom de l'équipe" required value={nom} onChange={(e) => setNom(e.target.value)} erreur={erreurs.name} />
        {creation && (
          <>
            <Input
              label="Code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ex. CS-N3"
              aide="Identifiant court, unique et définitif."
              erreur={erreurs.code}
            />
            <Select
              label="Département"
              required
              value={departement}
              onChange={(e) => setDepartement(e.target.value)}
              options={departements.map((d) => ({ value: d.id, label: d.name }))}
              erreur={erreurs.departmentId}
            />
          </>
        )}
        {erreurs.global && (
          <p className={styles.erreurGlobale} role="alert">
            <Icon name="warning" /> {erreurs.global}
          </p>
        )}
        <Button type="submit" chargement={envoi}>
          {creation ? "Créer l'équipe" : "Enregistrer"}
        </Button>
      </form>
    </section>
  );
}

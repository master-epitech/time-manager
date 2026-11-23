"use client";

import { useState, type FormEvent } from "react";
import { Button, Icon, Input, Select } from "@/components/ui";
import { api, ApiError, type ContractType, type ProfileCode, type Team, type User } from "@/lib/api";
import { LIBELLE_PROFIL } from "@/lib/auth/roles";
import { LIBELLE_CONTRAT } from "@/lib/comptes";
import styles from "./page.module.css";

type FormulaireCompteProps = {
  /** Compte à modifier ; absent = création */
  compte?: User;
  /** Équipes proposées (déjà filtrées selon les droits) */
  equipes: Team[];
  /** Profils que l'utilisateur connecté peut attribuer */
  profils: ProfileCode[];
  /** Domaine email de l'organisation, ex. trinity-market.example */
  domaine: string;
  onEnregistre: (compte: User, cree: boolean) => void;
  onFermer: () => void;
};

type Champs = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  teamId: string;
  profileCode: ProfileCode;
  contractType: ContractType;
  hireDate: string;
  connexion: "MICROSOFT" | "PASSWORD";
};

type Erreurs = Partial<Record<keyof Champs | "global", string>>;

/** Formulaire de création (TM-67) ou de modification d'un compte. */
export function FormulaireCompte({ compte, equipes, profils, domaine, onEnregistre, onFermer }: FormulaireCompteProps) {
  const creation = !compte;
  const [champs, setChamps] = useState<Champs>({
    firstName: compte?.firstName ?? "",
    lastName: compte?.lastName ?? "",
    email: compte?.email ?? "",
    phone: compte?.phone ?? "",
    jobTitle: compte?.jobTitle ?? "",
    teamId: compte?.teamId ?? equipes[0]?.id ?? "",
    profileCode: (compte?.profileCodes[0] as ProfileCode) ?? profils[0] ?? "EMPLOYEE",
    contractType: compte?.contractType ?? "CDI",
    hireDate: compte?.hireDate ?? new Date().toISOString().slice(0, 10),
    connexion: "MICROSOFT",
  });
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoi, setEnvoi] = useState(false);

  const maj = (champ: keyof Champs) => (e: { target: { value: string } }) =>
    setChamps((c) => ({ ...c, [champ]: e.target.value }));

  /** Contrôles faits avant l'appel : messages immédiats, le back revérifie tout */
  function verifier(): Erreurs {
    const e: Erreurs = {};
    if (!champs.firstName.trim()) e.firstName = "Le prénom est obligatoire.";
    if (!champs.lastName.trim()) e.lastName = "Le nom est obligatoire.";
    if (!champs.email.trim()) e.email = "L'email est obligatoire.";
    else if (!champs.email.trim().toLowerCase().endsWith(`@${domaine}`)) e.email = `L'email doit se terminer par @${domaine}.`;
    if (!champs.teamId) e.teamId = "Choisissez une équipe.";
    return e;
  }

  async function enregistrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const controles = verifier();
    setErreurs(controles);
    if (Object.keys(controles).length > 0) return;

    setEnvoi(true);
    try {
      const equipe = equipes.find((t) => t.id === champs.teamId);
      let resultat: User;
      if (creation) {
        resultat = await api.users.create({
          firstName: champs.firstName.trim(),
          lastName: champs.lastName.trim(),
          email: champs.email.trim().toLowerCase(),
          profileCode: champs.profileCode,
          teamId: champs.teamId,
          departmentId: equipe?.departmentId,
          jobTitle: champs.jobTitle.trim() || undefined,
          phone: champs.phone.trim() || undefined,
          contractType: champs.contractType,
          hireDate: champs.hireDate,
          authProvider: champs.connexion,
          sendMicrosoftInvitation: champs.connexion === "MICROSOFT",
        });
      } else {
        resultat = await api.users.update(compte.id, {
          firstName: champs.firstName.trim(),
          lastName: champs.lastName.trim(),
          email: champs.email.trim().toLowerCase(),
          phone: champs.phone.trim() || null,
          jobTitle: champs.jobTitle.trim() || null,
        });
        // Changement d'équipe : route dédiée, qui garde l'historique des affectations
        if (equipe && champs.teamId !== compte.teamId) {
          resultat = await api.users.assign(compte.id, {
            departmentId: equipe.departmentId,
            teamId: equipe.id,
            startDate: new Date().toISOString().slice(0, 10),
          });
        }
      }
      onEnregistre(resultat, creation);
    } catch (err) {
      setErreurs(erreursApi(err));
    } finally {
      setEnvoi(false);
    }
  }

  const titre = creation ? "Créer un compte" : `Modifier ${compte.firstName} ${compte.lastName}`;

  return (
    <section className={styles.panneau} aria-labelledby="formulaire-titre">
      <div className={styles.panneauEntete}>
        <h2 id="formulaire-titre" className={styles.panneauTitre}>
          {titre}
        </h2>
        <Button variant="discret" taille="s" onClick={onFermer}>
          Fermer
        </Button>
      </div>

      <form className={styles.formulaire} onSubmit={enregistrer} noValidate>
        <div className={styles.ligne}>
          <Input label="Prénom" required value={champs.firstName} onChange={maj("firstName")} erreur={erreurs.firstName} autoComplete="off" />
          <Input label="Nom" required value={champs.lastName} onChange={maj("lastName")} erreur={erreurs.lastName} autoComplete="off" />
        </div>
        <Input
          label="Email professionnel"
          type="email"
          required
          value={champs.email}
          onChange={maj("email")}
          placeholder={`prenom.nom@${domaine}`}
          erreur={erreurs.email}
          autoComplete="off"
        />
        <div className={styles.ligne}>
          <Select
            label="Équipe"
            required
            value={champs.teamId}
            onChange={maj("teamId")}
            options={equipes.map((t) => ({ value: t.id, label: t.name }))}
            erreur={erreurs.teamId}
          />
          <Select
            label="Profil"
            value={champs.profileCode}
            onChange={maj("profileCode")}
            options={profils.map((p) => ({ value: p, label: LIBELLE_PROFIL[p] }))}
            disabled={!creation}
            aide={creation ? undefined : "Changement de profil : à venir."}
          />
        </div>
        <div className={styles.ligne}>
          <Input label="Poste" value={champs.jobTitle} onChange={maj("jobTitle")} />
          <Input label="Téléphone" type="tel" value={champs.phone} onChange={maj("phone")} />
        </div>
        {creation && (
          <>
            <div className={styles.ligne}>
              <Select
                label="Contrat"
                value={champs.contractType}
                onChange={maj("contractType")}
                options={Object.entries(LIBELLE_CONTRAT).map(([value, label]) => ({ value, label }))}
              />
              <Input label="Date d'entrée" type="date" value={champs.hireDate} onChange={maj("hireDate")} />
            </div>
            <Select
              label="Connexion"
              value={champs.connexion}
              onChange={maj("connexion")}
              options={[
                { value: "MICROSOFT", label: "Compte Microsoft 365 (invitation par email)" },
                { value: "PASSWORD", label: "Mot de passe provisoire" },
              ]}
              aide={
                champs.connexion === "MICROSOFT"
                  ? "Une invitation Microsoft est envoyée à l'adresse saisie."
                  : "Un mot de passe provisoire est envoyé ; il devra être changé à la première connexion."
              }
            />
            <p className={styles.info}>Le matricule est généré automatiquement et ne change jamais.</p>
          </>
        )}

        {erreurs.global && (
          <p className={styles.erreurGlobale} role="alert">
            <Icon name="warning" /> {erreurs.global}
          </p>
        )}

        <Button type="submit" chargement={envoi}>
          {creation ? "Créer le compte" : "Enregistrer"}
        </Button>
      </form>
    </section>
  );
}

/** Place les erreurs de l'API sous les bons champs quand c'est possible */
function erreursApi(err: unknown): Erreurs {
  if (!(err instanceof ApiError)) return { global: "L'enregistrement a échoué. Réessayez." };
  if (err.code === "EMAIL_ALREADY_USED" || err.code === "EMAIL_DOMAIN_NOT_ALLOWED") return { email: err.message };
  if (err.code === "VALIDATION_ERROR" && Array.isArray(err.details)) {
    const parChamp: Erreurs = {};
    for (const d of err.details as { field?: string; message?: string }[]) {
      if (d.field && d.message) parChamp[d.field as keyof Champs] = d.message;
    }
    if (Object.keys(parChamp).length > 0) return parChamp;
  }
  return { global: err.message };
}

"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout";
import { Button, Card, Icon } from "@/components/ui";
import { api, ApiError, type Department, type ProfileCode, type Team } from "@/lib/api";
import { useSession } from "@/lib/auth/SessionProvider";
import { cn } from "@/lib/cn";
import { DetailEquipe } from "./DetailEquipe";
import { FormulaireEquipe } from "./FormulaireEquipe";
import styles from "./page.module.css";

const GESTION_COMPLETE: ProfileCode[] = ["HR", "SUPER_ADMIN"];

type Vue = { mode: "detail" } | { mode: "creation" } | { mode: "modification" };

export function GestionEquipes() {
  const { session } = useSession();
  const me = session.statut === "connecte" ? session.me : null;
  const gestionComplete = me ? GESTION_COMPLETE.includes(me.activeProfile.code) : false;

  const [equipes, setEquipes] = useState<Team[] | null>(null);
  const [departements, setDepartements] = useState<Department[]>([]);
  const [selection, setSelection] = useState<string | null>(null);
  const [vue, setVue] = useState<Vue>({ mode: "detail" });
  const [version, setVersion] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    Promise.all([api.teams.list(), api.departments.list()])
      .then(([t, d]) => {
        if (!actif) return;
        setEquipes(t.data);
        setDepartements(d.data);
        setErreur(null);
      })
      .catch((e) => actif && setErreur(e instanceof ApiError ? e.message : "Impossible de charger les équipes."));
    return () => {
      actif = false;
    };
  }, [version]);

  if (!me) return null;

  // Le manager ne voit que les équipes qu'il dirige ; les RH voient tout
  const visibles = (equipes ?? [])
    .filter((e) => gestionComplete || e.manager?.id === me.user.id)
    .sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name, "fr"));
  const choisie = visibles.find((e) => e.id === selection) ?? visibles[0];
  const departementDe = (e: Team) => departements.find((d) => d.id === e.departmentId);
  const nbActives = visibles.filter((e) => e.isActive).length;

  function recharger(texte: string) {
    setMessage(texte);
    setVersion((v) => v + 1);
  }

  return (
    <>
      <PageHeader
        titre="Équipes"
        sousTitre={
          gestionComplete
            ? `${nbActives} équipe${nbActives > 1 ? "s" : ""} active${nbActives > 1 ? "s" : ""} · ${departements.length} départements`
            : "Les équipes dont vous êtes responsable"
        }
        actions={
          gestionComplete && (
            <Button onClick={() => setVue({ mode: "creation" })} disabled={departements.length === 0}>
              + Créer une équipe
            </Button>
          )
        }
      />

      {message && (
        <p className={styles.message} role="status">
          <Icon name="check" /> {message}
        </p>
      )}

      {erreur ? (
        <Card>
          <p role="alert">{erreur}</p>
        </Card>
      ) : !equipes ? (
        <p role="status" className={styles.secondaire}>
          Chargement…
        </p>
      ) : (
        <div className={styles.grille}>
          <nav className={styles.liste} aria-label="Liste des équipes">
            {visibles.length === 0 && <p className={styles.secondaire}>Aucune équipe.</p>}
            {visibles.map((e) => {
              const active = vue.mode !== "creation" && e.id === choisie?.id;
              return (
                <button
                  key={e.id}
                  type="button"
                  className={cn(styles.carteEquipe, active && styles.carteActive, !e.isActive && styles.carteInactive)}
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    setSelection(e.id);
                    setVue({ mode: "detail" });
                    setMessage(null);
                  }}
                >
                  <span className={styles.nomEquipe}>
                    {e.name}
                    {!e.isActive && <span className={styles.etiquette}>Désactivée</span>}
                  </span>
                  <span className={styles.secondaire}>
                    {departementDe(e)?.name ?? "—"} · Responsable :{" "}
                    {e.manager ? `${e.manager.firstName} ${e.manager.lastName}` : "aucun"} ·{" "}
                    <span className={styles.mono}>{e.membersCount}</span> membre{e.membersCount > 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </nav>

          {vue.mode === "creation" ? (
            <FormulaireEquipe
              departements={departements.filter((d) => d.isActive)}
              onEnregistre={(equipe) => {
                setSelection(equipe.id);
                setVue({ mode: "detail" });
                recharger(`Équipe « ${equipe.name} » créée. Ajoutez maintenant ses membres et son responsable.`);
              }}
              onFermer={() => setVue({ mode: "detail" })}
            />
          ) : choisie && vue.mode === "modification" ? (
            <FormulaireEquipe
              key={choisie.id}
              equipe={choisie}
              departements={departements}
              onEnregistre={(equipe) => {
                setVue({ mode: "detail" });
                recharger(`Équipe « ${equipe.name} » enregistrée.`);
              }}
              onFermer={() => setVue({ mode: "detail" })}
            />
          ) : choisie ? (
            <DetailEquipe
              key={choisie.id}
              equipe={choisie}
              departement={departementDe(choisie)}
              destinations={(equipes ?? []).filter((e) => e.isActive && e.id !== choisie.id)}
              gestionComplete={gestionComplete}
              onModifier={() => setVue({ mode: "modification" })}
              onChange={recharger}
            />
          ) : null}
        </div>
      )}
    </>
  );
}

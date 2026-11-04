import { redirect } from "next/navigation";

/* La racine envoie vers l'accueil. TM-65 : vers /connexion si l'utilisateur n'est pas connecté. */
export default function Racine() {
  redirect("/accueil");
}

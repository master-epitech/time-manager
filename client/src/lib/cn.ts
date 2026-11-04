/**
 * Assemble des noms de classes CSS en ignorant les valeurs vides.
 * Exemple : cn("btn", isActive && "btn--actif") → "btn btn--actif"
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

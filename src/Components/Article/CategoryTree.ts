import { Categorie } from "./Interfaces";

/**
 * La liste des catégories laisse ranger une catégorie sous n'importe quelle
 * autre : l'arborescence n'a pas de profondeur maximale. Les écrans qui
 * choisissent une famille / sous-famille doivent donc proposer les mêmes
 * niveaux, avec la même indentation — c'est ce que construit ce module, pour
 * que le choix soit identique partout.
 */
export interface CategoryOption {
  id: number;
  label: string;
  depth: number;
}

type AnyCategorie = Categorie | Record<string, any>;

// « pas de parent » s'écrit null, 0 ou "" selon les données : une seule clé.
const key = (v: any) => (!v ? "" : String(v));

// Le préfixe qui dessine la profondeur, comme dans la liste des catégories.
const indent = (depth: number) => "— ".repeat(depth);

const byName = (a: any, b: any) => (a.nom || "").localeCompare(b.nom || "");

/**
 * Descend l'arborescence sous `parent` et pousse chaque catégorie rencontrée,
 * préfixée par sa profondeur. Une catégorie de `blocked` emmène sa branche.
 */
const walk = (
  categories: AnyCategorie[],
  parent: any,
  depth: number,
  blocked: Set<string>,
  out: CategoryOption[]
) => {
  categories
    .filter((c: any) => key(c.parent_id) === key(parent))
    .sort(byName)
    .forEach((c: any) => {
      if (blocked.has(key(c.id))) return;
      out.push({ id: c.id, label: `${indent(depth)}${c.nom}`, depth });
      walk(categories, c.id, depth + 1, blocked, out);
    });
};

/** `id` et toute sa descendance : une catégorie ne peut pas se contenir. */
const branchOf = (categories: AnyCategorie[], id: any): Set<string> => {
  const blocked = new Set<string>();
  if (id == null || id === "") return blocked;
  blocked.add(key(id));
  for (let grew = true; grew; ) {
    grew = false;
    categories.forEach((c: any) => {
      if (blocked.has(key(c.parent_id)) && !blocked.has(key(c.id))) {
        blocked.add(key(c.id));
        grew = true;
      }
    });
  }
  return blocked;
};

/**
 * Toute l'arborescence, indentée. `excludeId` retire une catégorie et ses
 * filles — ce dont a besoin le champ « Catégorie Parente » en modification.
 */
export const buildCategoryTreeOptions = (
  categories: AnyCategorie[],
  excludeId?: any
): CategoryOption[] => {
  const blocked = branchOf(categories, excludeId);
  const options: CategoryOption[] = [];
  walk(categories, null, 0, blocked, options);

  // Une catégorie dont le parent a été supprimé n'est rattachée à rien : elle
  // serait invisible pour la descente ci-dessus. On la montre quand même,
  // sinon « toutes les catégories » n'en serait pas.
  const seen = new Set(options.map((o) => key(o.id)));
  categories
    .filter((c: any) => !seen.has(key(c.id)) && !blocked.has(key(c.id)))
    .sort(byName)
    .forEach((c: any) => options.push({ id: c.id, label: c.nom, depth: 0 }));

  return options;
};

/**
 * Les familles principales : celles sans parent, plus les orphelines dont le
 * parent n'existe plus — sans quoi elles ne seraient choisissables nulle part.
 */
export const buildRootCategoryOptions = (
  categories: AnyCategorie[]
): CategoryOption[] => {
  const known = new Set(categories.map((c: any) => key(c.id)));
  return categories
    .filter((c: any) => !c.parent_id || !known.has(key(c.parent_id)))
    .sort(byName)
    .map((c: any) => ({ id: c.id, label: c.nom, depth: 0 }));
};

/**
 * Tout ce qui vit sous `parentId`, à n'importe quelle profondeur et indenté :
 * la sous-famille n'est plus limitée aux filles directes.
 */
export const buildSubcategoryOptions = (
  categories: AnyCategorie[],
  parentId: any
): CategoryOption[] => {
  if (!parentId) return [];
  const options: CategoryOption[] = [];
  walk(categories, parentId, 0, new Set(), options);
  return options;
};

/**
 * La famille principale d'une catégorie : on remonte les parents jusqu'à la
 * racine. Sert à pré-remplir le premier select quand l'article ne porte
 * qu'une sous-catégorie, qui peut désormais être à plus d'un niveau.
 */
export const getRootCategoryId = (
  categories: AnyCategorie[],
  id: any
): number | null => {
  if (!id) return null;
  const byId = new Map(categories.map((c: any) => [key(c.id), c]));
  let current: any = byId.get(key(id));
  const seen = new Set<string>();
  while (current && current.parent_id && !seen.has(key(current.id))) {
    seen.add(key(current.id));
    const parent = byId.get(key(current.parent_id));
    if (!parent) break; // parent supprimé : la catégorie fait office de racine
    current = parent;
  }
  return current ? current.id : null;
};

/**
 * La chaîne des parents de `id`, de la racine jusqu'au parent direct (`id`
 * lui-même exclu). Sert à savoir qui mettre à jour quand une catégorie doit
 * entraîner ses ancêtres (ex. l'afficher sur le site exige que sa famille
 * principale le soit aussi).
 */
export const getAncestorChain = (
  categories: AnyCategorie[],
  id: any
): AnyCategorie[] => {
  const byId = new Map(categories.map((c: any) => [key(c.id), c]));
  const chain: AnyCategorie[] = [];
  let current: any = byId.get(key(id));
  const seen = new Set<string>([key(id)]);
  while (current && current.parent_id) {
    const parent = byId.get(key(current.parent_id));
    if (!parent || seen.has(key(parent.id))) break; // parent supprimé ou cycle
    seen.add(key(parent.id));
    chain.unshift(parent);
    current = parent;
  }
  return chain;
};

/** `id` appartient-il à l'arborescence sous `parentId` ? */
export const isDescendantOf = (
  categories: AnyCategorie[],
  id: any,
  parentId: any
): boolean => {
  if (!id || !parentId) return false;
  const branch = branchOf(categories, parentId);
  branch.delete(key(parentId));
  return branch.has(key(id));
};

/**
 * L'arborescence mise à plat, parent puis filles, avec la profondeur de
 * chacune — pour les listes qui rendent elles-mêmes leurs lignes plutôt que
 * des <option>. `compare` laisse l'appelant garder son ordre d'affichage.
 */
export const flattenCategoryTree = (
  categories: AnyCategorie[],
  compare: (a: any, b: any) => number = byName
): { categorie: any; depth: number }[] => {
  const known = new Set(categories.map((c: any) => key(c.id)));
  // Une catégorie dont le parent a été supprimé fait office de racine, sinon
  // elle ne serait rattachée à rien et n'apparaîtrait nulle part.
  const childrenOf = (parent: any) =>
    categories
      .filter((c: any) =>
        parent === null
          ? !c.parent_id || !known.has(key(c.parent_id))
          : key(c.parent_id) === key(parent)
      )
      .sort(compare);

  const rows: { categorie: any; depth: number }[] = [];
  const seen = new Set<string>();
  const descend = (parent: any, depth: number) => {
    childrenOf(parent).forEach((c: any) => {
      if (seen.has(key(c.id))) return; // un cycle en base ne doit pas boucler
      seen.add(key(c.id));
      rows.push({ categorie: c, depth });
      descend(c.id, depth + 1);
    });
  };
  descend(null, 0);

  // Des catégories qui se pointent l'une l'autre n'ont pas de racine : on les
  // montre à plat plutôt que de les perdre.
  categories.forEach((c: any) => {
    if (!seen.has(key(c.id))) rows.push({ categorie: c, depth: 0 });
  });

  return rows;
};

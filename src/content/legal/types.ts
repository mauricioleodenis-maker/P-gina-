export type LegalSection = {
  id: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

export type LegalDoc = {
  slug: string;
  title: string;
  lead: string;
  /** Version del texto; se guarda en `consents.text_version` cuando aplica. */
  version: string;
  updated: string; // YYYY-MM-DD
  sections: LegalSection[];
};

/** Marca de revision: todos los textos legales la llevan hasta que un abogado/DPO los valide. */
export const REVIEW_MARK = 'REVISAR_CON_ABOGADO';

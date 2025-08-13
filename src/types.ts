export type CategoryKey =
  | 'gesundheit'
  | 'karriere'
  | 'finanzen'
  | 'beziehungen'
  | 'persoenliche_entwicklung'
  | 'freizeit'
  | 'umfeld_wohnen'
  | 'beitrag_gesellschaft';

export interface CategoryEntryInput {
  notes: string; // Freitext-Antworten des Nutzers
}

export interface Moment {
  id: string;
  age: number; // z.B. 30, 35, 40
  title?: string; // optionaler Titel, z.B. "Jetzt", "In 5 Jahren"
  categories: Record<CategoryKey, CategoryEntryInput>;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionTemplate {
  category: CategoryKey;
  questions: string[];
}

export interface FollowUpQuestion {
  id: string;
  category: CategoryKey;
  question: string;
}

export interface GoalSuggestion {
  id: string;
  category: CategoryKey;
  label: string; // z.B. "Haus kaufen"
  rationale: string; // kurze Begründung, wie sich die Empfehlung aus der Differenz ableitet
  fromAge: number;
  toAge: number;
}

export interface SaveMomentRequestBody {
  id?: string; // Für Updates optional
  age: number;
  title?: string;
  categories: Partial<Record<CategoryKey, CategoryEntryInput | undefined>>;
}

export interface SaveMomentResponse {
  moment: Moment;
  followUps: FollowUpQuestion[];
  suggestions: GoalSuggestion[];
}
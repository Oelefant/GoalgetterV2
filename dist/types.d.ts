export type CategoryKey = 'gesundheit' | 'karriere' | 'finanzen' | 'beziehungen' | 'persoenliche_entwicklung' | 'freizeit' | 'umfeld_wohnen' | 'beitrag_gesellschaft';
export interface ImageAsset {
    id: string;
    url: string;
    filename: string;
    caption?: string;
    createdAt: string;
}
export interface CategoryEntryInput {
    notes: string;
    images?: ImageAsset[];
}
export interface Moment {
    id: string;
    age: number;
    title?: string;
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
    label: string;
    rationale: string;
    fromAge: number;
    toAge: number;
}
export interface SaveMomentRequestBody {
    id?: string;
    age: number;
    title?: string;
    categories: Partial<Record<CategoryKey, CategoryEntryInput | undefined>>;
}
export interface SaveMomentResponse {
    moment: Moment;
    followUps: FollowUpQuestion[];
    suggestions: GoalSuggestion[];
}
//# sourceMappingURL=types.d.ts.map
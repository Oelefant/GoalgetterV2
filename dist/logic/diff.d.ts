import type { CategoryKey, GoalSuggestion, Moment } from '../types.js';
export interface CategoryDiffResult {
    category: CategoryKey;
    hasChange: boolean;
    signals: Record<string, boolean>;
}
export interface MomentDiffResult {
    from: Moment;
    to: Moment;
    byCategory: Record<CategoryKey, CategoryDiffResult>;
}
export declare function diffMoments(from: Moment, to: Moment): MomentDiffResult;
export declare function deriveGoalSuggestions(diff: MomentDiffResult): GoalSuggestion[];
//# sourceMappingURL=diff.d.ts.map
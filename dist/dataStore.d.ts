import type { Moment } from './types.js';
export declare function loadMoments(): Promise<Moment[]>;
export declare function saveMoments(moments: Moment[]): Promise<void>;
export declare function upsertMoment(partial: Omit<Moment, 'createdAt' | 'updatedAt' | 'id'> & {
    id?: string;
}): Promise<Moment>;
export declare function getPreviousMoment(age: number): Promise<Moment | null>;
export declare function getMomentById(id: string): Promise<Moment | null>;
//# sourceMappingURL=dataStore.d.ts.map
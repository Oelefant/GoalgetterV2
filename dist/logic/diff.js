import { v4 as uuid } from 'uuid';
const HOME_OWNERSHIP_KEYWORDS = {
    rent: [/miete/i, /zur miete/i, /mieter/i],
    own: [/eigenheim/i, /haus\s*kaufen/i, /wohnung\s*kaufen/i, /hypothek/i, /besitze/i],
};
function extractSignalsFromNotes(category, notes) {
    const text = notes.toLowerCase();
    const signals = {};
    if (category === 'umfeld_wohnen') {
        signals['rent'] = HOME_OWNERSHIP_KEYWORDS.rent.some((rx) => rx.test(text));
        signals['own'] = HOME_OWNERSHIP_KEYWORDS.own.some((rx) => rx.test(text));
    }
    if (category === 'finanzen') {
        signals['savings'] = /(ersparnis|ersparnisse|rücklage|notgroschen|sparrate)/i.test(text);
        signals['investment'] = /(etf|aktien|investment|depot|fonds)/i.test(text);
        signals['debt'] = /(schuld|kredit|dispo|verbindlichkeit)/i.test(text);
    }
    if (category === 'karriere') {
        signals['role_change'] = /(beförderung|leitung|lead|manager|wechsel|rolle wechseln)/i.test(text);
        signals['self_employed'] = /(selbstständig|freelance|freiberuf)/i.test(text);
    }
    if (category === 'gesundheit') {
        signals['routine'] = /(routine|regelmäßig|training|sport|bewegung)/i.test(text);
        signals['sleep'] = /(schlaf|schlafrhythmus|7-8 stunden)/i.test(text);
    }
    return signals;
}
export function diffMoments(from, to) {
    const byCategory = Object.fromEntries(Object.keys(from.categories).map((category) => {
        const fromNotes = from.categories[category]?.notes ?? '';
        const toNotes = to.categories[category]?.notes ?? '';
        const fromSignals = extractSignalsFromNotes(category, fromNotes);
        const toSignals = extractSignalsFromNotes(category, toNotes);
        const signalsSet = new Set([...Object.keys(fromSignals), ...Object.keys(toSignals)]);
        const signals = {};
        let hasChange = false;
        for (const key of signalsSet) {
            const a = !!fromSignals[key];
            const b = !!toSignals[key];
            signals[key] = a !== b;
            if (a !== b)
                hasChange = true;
        }
        // Also flag change if raw text changed significantly
        if (!hasChange && fromNotes.trim() !== toNotes.trim()) {
            hasChange = true;
        }
        return [
            category,
            {
                category,
                hasChange,
                signals,
            },
        ];
    }));
    return { from, to, byCategory };
}
export function deriveGoalSuggestions(diff) {
    const suggestions = [];
    const fromAge = diff.from.age;
    const toAge = diff.to.age;
    // Beispiel: Miete -> Eigentum
    const living = diff.byCategory['umfeld_wohnen'];
    if (living?.hasChange) {
        const fromNotes = diff.from.categories['umfeld_wohnen']?.notes ?? '';
        const toNotes = diff.to.categories['umfeld_wohnen']?.notes ?? '';
        const fromRent = /miete|mieter/i.test(fromNotes);
        const toOwn = /eigenheim|haus\s*kaufen|wohnung\s*kaufen/i.test(toNotes);
        if (fromRent && toOwn) {
            suggestions.push({
                id: uuid(),
                category: 'umfeld_wohnen',
                label: 'Haus/Eigentum kaufen',
                rationale: 'Vom Mieterstatus zum Eigenheim im Zielbild.',
                fromAge,
                toAge,
            });
            suggestions.push({
                id: uuid(),
                category: 'finanzen',
                label: 'Eigenkapital aufbauen (Sparrate, Nebenkosten, Notgroschen)',
                rationale: 'Finanzielle Vorbereitung auf Immobilienkauf.',
                fromAge,
                toAge,
            });
            suggestions.push({
                id: uuid(),
                category: 'finanzen',
                label: 'Finanzierung prüfen (Kreditwürdigkeit, Zins, Rate)',
                rationale: 'Machbarkeit und Tragfähigkeit der Finanzierung sichern.',
                fromAge,
                toAge,
            });
        }
    }
    // Beispiel: Karrierewechsel/Leitungsverantwortung
    const career = diff.byCategory['karriere'];
    if (career?.hasChange) {
        const toNotes = diff.to.categories['karriere']?.notes ?? '';
        if (/(leitung|manager|lead|teamleitung)/i.test(toNotes)) {
            suggestions.push({
                id: uuid(),
                category: 'karriere',
                label: 'Führungsskills entwickeln (Coaching, Seminare, Mentoring)',
                rationale: 'Zielbild enthält Führungsverantwortung.',
                fromAge,
                toAge,
            });
        }
        if (/(selbstständig|freelance|freiberuf)/i.test(toNotes)) {
            suggestions.push({
                id: uuid(),
                category: 'karriere',
                label: 'Selbstständigkeit vorbereiten (Businessplan, Rücklagen, Kundenakquise)',
                rationale: 'Zielbild enthält selbstständige Tätigkeit.',
                fromAge,
                toAge,
            });
        }
    }
    // Gesundheit: Routinen etablieren
    const health = diff.byCategory['gesundheit'];
    if (health?.hasChange) {
        const toNotes = diff.to.categories['gesundheit']?.notes ?? '';
        if (/(marathon|triathlon|5k|10k|halbmarathon)/i.test(toNotes)) {
            suggestions.push({
                id: uuid(),
                category: 'gesundheit',
                label: 'Trainingsplan erstellen und Tracken',
                rationale: 'Zielbild enthält sportliches Event.',
                fromAge,
                toAge,
            });
        }
        if (/(routine|regelmäßig|training|sport|bewegung)/i.test(toNotes)) {
            suggestions.push({
                id: uuid(),
                category: 'gesundheit',
                label: 'Wöchentliche Bewegungsroutine (2-4x/Woche) etablieren',
                rationale: 'Zielbild benennt regelmäßige Bewegung.',
                fromAge,
                toAge,
            });
        }
    }
    // Finanzen: Investments / Schuldenabbau
    const finance = diff.byCategory['finanzen'];
    if (finance?.hasChange) {
        const toNotes = diff.to.categories['finanzen']?.notes ?? '';
        if (/(etf|aktien|investment|depot|fonds)/i.test(toNotes)) {
            suggestions.push({
                id: uuid(),
                category: 'finanzen',
                label: 'ETF-Sparplan einrichten',
                rationale: 'Zielbild enthält Kapitalmarkt-Investments.',
                fromAge,
                toAge,
            });
        }
        if (/(schuldenfrei|schulden abbauen|kredit tilgen)/i.test(toNotes)) {
            suggestions.push({
                id: uuid(),
                category: 'finanzen',
                label: 'Schulden-Tilgungsplan erstellen',
                rationale: 'Zielbild sieht geringere Schulden vor.',
                fromAge,
                toAge,
            });
        }
    }
    return suggestions;
}
//# sourceMappingURL=diff.js.map
import { v4 as uuid } from 'uuid';
export function generateFollowUps(previous, current) {
    const followUps = [];
    for (const [category, entry] of Object.entries(current.categories)) {
        const prevNotes = previous?.categories?.[category]?.notes ?? '';
        const notes = entry?.notes ?? '';
        // Nur fragen, wenn sich etwas geändert hat oder unklar ist
        const changed = prevNotes.trim() !== notes.trim();
        if (!notes.trim()) {
            followUps.push({
                id: uuid(),
                category: category,
                question: 'Was genau stellst du dir hier vor? Bitte beschreibe dein Ziel konkreter.',
            });
            continue;
        }
        if (changed) {
            if (category === 'umfeld_wohnen') {
                if (/miete|mieter/i.test(notes) && /eigenheim|haus\s*kaufen|wohnung\s*kaufen/i.test(prevNotes)) {
                    // unlikely reverse, but ask
                    followUps.push({
                        id: uuid(),
                        category: 'umfeld_wohnen',
                        question: 'Planst du, Eigentum zu verkaufen/aufzugeben und wieder zu mieten? Warum?',
                    });
                }
                else if (/eigenheim|haus\s*kaufen|wohnung\s*kaufen/i.test(notes) && /miete|mieter/i.test(prevNotes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'umfeld_wohnen',
                        question: 'Bis wann möchtest du das Eigenheim realisieren und in welcher Region/Preisklasse?',
                    });
                }
                else if (/eigenheim|haus\s*kaufen|wohnung\s*kaufen/i.test(notes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'umfeld_wohnen',
                        question: 'Wie hoch schätzt du Eigenkapital, Kaufnebenkosten und monatliche Rate?',
                    });
                }
            }
            if (category === 'karriere') {
                if (/leitung|manager|lead|teamleitung/i.test(notes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'karriere',
                        question: 'Welche Führungsverantwortung konkret (Teamgröße, Bereich)? Welche Skills fehlen noch?',
                    });
                }
                if (/selbstständig|freelance|freiberuf/i.test(notes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'karriere',
                        question: 'Was ist dein Angebot/Zielkunden? Wie finanzierst du die Übergangsphase?',
                    });
                }
            }
            if (category === 'finanzen') {
                if (/etf|aktien|investment|depot|fonds/i.test(notes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'finanzen',
                        question: 'Welches monatliche Investmentziel hast du und mit welchem Risiko fühlst du dich wohl?',
                    });
                }
                if (/schuldenfrei|tilgen|kredit/i.test(notes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'finanzen',
                        question: 'Welche Schulden willst du bis wann getilgt haben? Hast du einen Plan für die Raten?',
                    });
                }
            }
            if (category === 'gesundheit') {
                if (/marathon|halbmarathon|triathlon|10k|5k/i.test(notes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'gesundheit',
                        question: 'Welchen Wettkampf peilst du an und wie sieht dein Trainingsplan aus?',
                    });
                }
                if (/routine|regelmäßig|training|sport|bewegung/i.test(notes)) {
                    followUps.push({
                        id: uuid(),
                        category: 'gesundheit',
                        question: 'Welche konkrete Wochenroutine setzt du dir (Tage, Uhrzeiten, Art der Bewegung)?',
                    });
                }
            }
        }
    }
    return followUps;
}
//# sourceMappingURL=followups.js.map
const diceCoefficient = (l: string, r: string, lBigrams: Map<string, number>) => {
    if (l.length < 2 || r.length < 2) return 0;
    let intersectionSize = 0;
    for (let i = 0; i < r.length - 1; i++) {
        const bigram = r.substr(i, 2);
        const count = lBigrams.has(bigram) ? lBigrams.get(bigram) : 0;

        if (count > 0) {
            lBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }

    return (2.0 * intersectionSize) / (l.length + r.length - 2);
};

export const getClosestMatches = <T>(
    candidate: string,
    dictionary: Array<T>,
    transform: (input: T) => string = (input) => input.toString(),
    topN = 4,
) => {
    if (!dictionary.length) return [];

    let lBigrams = new Map();
    for (let i = 0; i < candidate.length - 1; i++) {
        const bigram = candidate.substr(i, 2);
        const count = lBigrams.has(bigram) ? lBigrams.get(bigram) + 1 : 1;

        lBigrams.set(bigram, count);
    }

    return dictionary
        .map((val) => ({
            value: val,
            score: diceCoefficient(candidate, transform(val), new Map(lBigrams)),
        }))
        .filter(result => result.score !== 0)
        .sort((l, r) => l.score - r.score)
        .slice(0, topN);
};

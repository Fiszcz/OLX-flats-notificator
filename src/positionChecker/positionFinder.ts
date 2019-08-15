const upperCaseOrDigitREGEX = /^[A-ZŻŹĆĄŚĘŁÓŃ0-9]$/;
const letterOrDigitREGEX = /^[a-zżźćńółęąś0-9]$/i;
const spaceSignBetweenWordsREGEX = /^[ "„.]$/;

const isUpperCaseOrDigit = (letter: string) => upperCaseOrDigitREGEX.test(letter);
const isLetterOrDigit = (letter: string) => letterOrDigitREGEX.test(letter);
const isSpaceSignBetweenWords = (letter: string) => spaceSignBetweenWordsREGEX.test(letter);

// TODO: move to config, and make array (do not create REGEX, instead that use findIndex Array)
const perfectLocalization = /obok metra|blisko stacji metra|dobry dojazd|przy samej stacji metra|w centrum Warszawy/gi;
const specificLocalization = /(ul|ulica|ulicy|os|osiedle|osiedlu|al|aleja|alei|plac|placu|pl|galeria|galerii)(\s|\.|"|„)/gi;

export enum Location {
    PERFECT_LOCATION = 1,
    NOT_FOUND = 0,
}

export const findLocationOfFlatInDescription = (text: string): string | Location => {
    if (text.search(perfectLocalization) >= 0)
        return Location.PERFECT_LOCATION;

    const positionInText = text.search(specificLocalization);
    if (positionInText === -1)
        return Location.NOT_FOUND;

    return getTextOfLocation(text.slice(positionInText));
};

// TODO: describe rules of location text in documentation
// proposal: use Machine Learning instead manual finding of location
const getTextOfLocation =  (textWithLocation: string) => {
    let wordsCount = 0, isSpaceBetweenWords = false, lengthOfWord = 0, endOfAddressText = 0;
    for (const letter of textWithLocation) {
        if (isSpaceSignBetweenWords(letter)) {
            if (isEndOfSentence(letter, lengthOfWord)) {
                break;
            }
            if (isSpaceBetweenWords === false) {
                if (++wordsCount === 4) {
                    break;
                }
                isSpaceBetweenWords = true;
            }
        } else if (isSpaceBetweenWords) {
            if (isUpperCaseOrDigit(letter)) {
                isSpaceBetweenWords = false;
                lengthOfWord = 1;
            } else
                break;
        } else if (isLetterOrDigit(letter) === false) {
            break;
        } else
            lengthOfWord++;
        endOfAddressText++;
    }

    return textWithLocation.slice(0, endOfAddressText - Number(isSpaceBetweenWords));
};

const isEndOfSentence = (letter: string, lengthPreviousWord: number) => letter === '.' && lengthPreviousWord > 2;

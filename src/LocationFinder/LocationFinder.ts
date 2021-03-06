import { locationKeywords } from '../../config/locationKeywords';

export const isPerfectLocation = (text: string): boolean => text.search(locationKeywords.perfectLocalization) >= 0;

export const findLocationOfFlatInDescription = (text: string): string | undefined => {
    const positionInText = text.search(locationKeywords.specificLocalization);
    if (positionInText === -1) return undefined;

    return getTextOfLocation(text.slice(positionInText));
};

const upperCaseOrDigitREGEX = /^[A-ZŻŹĆĄŚĘŁÓŃ0-9]$/;
const letterOrDigitREGEX = /^[a-zżźćńółęąś0-9]$/i;
const spaceSignBetweenWordsREGEX = /^[ "„.]$/;

const isUpperCaseOrDigit = (letter: string) => upperCaseOrDigitREGEX.test(letter);
const isLetterOrDigit = (letter: string) => letterOrDigitREGEX.test(letter);
const isSpaceSignBetweenWords = (letter: string) => spaceSignBetweenWordsREGEX.test(letter);

// TODO: describe rules of location text in documentation
// proposal: use Machine Learning instead manual finding of location
const getTextOfLocation = (textWithLocation: string) => {
    let wordsCount = 0,
        isSpaceBetweenWords = false,
        lengthOfWord = 0,
        addressStringLength = 0;
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
            } else break;
        } else if (isLetterOrDigit(letter) === false) {
            break;
        } else lengthOfWord++;
        addressStringLength++;
    }

    return textWithLocation.slice(0, addressStringLength - Number(isSpaceBetweenWords));
};

const isEndOfSentence = (letter: string, lengthPreviousWord: number) => letter === '.' && lengthPreviousWord > 2;

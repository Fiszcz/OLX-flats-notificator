const upperCaseOrNumber = /[A-ZŻŹĆĄŚĘŁÓŃ0-9]/;
const letterOrNumber = /[a-zżźćńółęąś0-9]/i;

const perfectLocalization = /obok metra|blisko stacji metra|dobry dojazd|przy samej stacji metra|w centrum Warszawy/gi;
const specificLocalization = /(ul|ulica|ulicy|os|osiedle|osiedlu|al|aleja|alei|plac|placu|pl|galeria|galerii)(\s|\.|"|„)/gi;

export const findLocationOfFlatInDescription = (text: string) => {
    if (text.search(perfectLocalization) !== -1)
        return 1;

    const positionInText = text.search(specificLocalization);
    if (positionInText !== -1) {
        const slicedText = text.slice(positionInText);
        let parts = 0, space = false, endOfAddressText;
        for (endOfAddressText = 0; endOfAddressText < slicedText.length && parts <= 4; endOfAddressText++) {
            if (slicedText[endOfAddressText] === ' '
                || slicedText[endOfAddressText] === '.'
                || slicedText[endOfAddressText] === '"'
                || slicedText[endOfAddressText] === '„')
                if (!space) {
                    parts++;
                    space = true;
                }
            else if (space) {
                if (upperCaseOrNumber.test(slicedText[endOfAddressText]))
                    space = false;
                else
                    break;
            } else if (!letterOrNumber.test(slicedText[endOfAddressText])) {
                break;
            }
        }
        return slicedText.slice(0, endOfAddressText - Number(space));
    } else
        return -1;
};

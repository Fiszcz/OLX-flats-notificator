export const findLocationOfFlatInDescription = (text: string) => {
    const isFinded = text.search(/obok metra|blisko stacji metra|dobry dojazd|przy samej stacji metra|w centrum Warszawy/gi);
    if (isFinded !== -1) {
        return 1;
    }

    const positionInText = text.search(/(ul|ulica|ulicy|os|osiedle|osiedlu|al|aleja|alei|plac|placu|pl|galeria|galerii)(\s|\.|"|„)/gi);
    if (positionInText !== -1) {
        const slicedText = text.slice(positionInText);
        let parts = 0, space = false, endOfAddressText;
        for (endOfAddressText = 0; endOfAddressText < slicedText.length && parts <= 4; endOfAddressText++) {
            if (slicedText[endOfAddressText] === ' '
                || slicedText[endOfAddressText] === '.'
                || slicedText[endOfAddressText] === '"'
                || slicedText[endOfAddressText] === '„') {
                if (!space) {
                    parts++;
                    space = true;
                }
            } else if (space) {
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

const upperCaseOrNumber = new RegExp(/[A-ZŻŹĆĄŚĘŁÓŃ0-9]/);
const letterOrNumber = new RegExp(/[a-zżźćńółęąś0-9]/i);

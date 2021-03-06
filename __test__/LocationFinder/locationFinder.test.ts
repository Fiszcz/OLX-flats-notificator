import { findLocationOfFlatInDescription, isPerfectLocation } from '../../src/LocationFinder/LocationFinder';

jest.mock('../../config/locationKeywords', () => ({
    locationKeywords: {
        perfectLocalization: /obok metra|blisko stacji metra|dobry dojazd|przy samej stacji metra|w centrum Warszawy/gi,
        specificLocalization: /(ul|ulica|ulicy|os|osiedle|osiedlu|al|aleja|alei|plac|placu|pl|galeria|galerii)(\s|\.|"|„)/gi,
    },
}));

describe('locationFinder', () => {
    describe('findLocationOfFlatInDescription', () => {
        test('should return valid posted place in advertisements', () => {
            const exampleAdvertisements = [
                'Do wynajęcia ładne, nowoczesne,' +
                    ' 2 pokojowe mieszkanie w Wola Park Residence przy ul. Sowińskiego 25,' +
                    ' usytuowane na 6 piętrze 7- piętrowego apartamentowca z 2016 roku. ',
                'Do wynajęcia ładna kawalerka przy ulicy Pejzażowej.',
                'Mieszkanie na prestiżowym osiedlu Marina Mokotów o powierzchni 35 m2,' +
                    ' w skład którego wchodzi przestronny pokój, otwarta kuchnia i łazienka.',
            ];

            expect(findLocationOfFlatInDescription(exampleAdvertisements[0])).toBe('ul. Sowińskiego 25');
            expect(findLocationOfFlatInDescription(exampleAdvertisements[1])).toBe('ulicy Pejzażowej');
            expect(findLocationOfFlatInDescription(exampleAdvertisements[2])).toBe('osiedlu Marina Mokotów');
        });

        test('should return first mentioned valid place posted in advertisement', () => {
            const exampleAdvertisement = 'Mieszkanie położone jest przy ulicy Żeromskiego 1 (osiedle Słodowiec City).';

            expect(findLocationOfFlatInDescription(exampleAdvertisement)).toBe('ulicy Żeromskiego 1');
        });

        test('should return string with location of flat which is placed at the end of some sentence', () => {
            const exampleAdvertisement =
                'Znajduje się na 6 p w 8 p budynku na zamkniętym, chronionym osiedlu Shiraz. W budynku na dole recepcja.';

            expect(findLocationOfFlatInDescription(exampleAdvertisement)).toBe('osiedlu Shiraz');
        });

        test(
            'should return valid posted place in advertisement, ' + 'where place is written without space between parts of place name',
            () => {
                const exampleAdvertisements = [
                    'Do wynajęcia jasne, dwustronne i ciche mieszkanie przy ul.Hery 25.',
                    'ŻOLIBORZ, NOWE, 2 pok. 53m2, ul.Z.Krasińskiego\nNowiutkie, jasne 2 pokojowe mieszkanie do wynajęcia od 1 marca 2019.',
                ];

                expect(findLocationOfFlatInDescription(exampleAdvertisements[0])).toBe('ul.Hery 25');
                expect(findLocationOfFlatInDescription(exampleAdvertisements[1])).toBe('ul.Z.Krasińskiego');
            },
        );

        test('should return valid posted place in advertisement, where place contains ""', () => {
            const exampleAdvertisement = 'w spokojnej części dzielnicy Mokotów (osiedle „Służew nad Dolinką”).';

            expect(findLocationOfFlatInDescription(exampleAdvertisement)).toBe('osiedle „Służew');
        });
    });

    describe('isPerfectLocation', () => {
        test('should return false in case of text without proper location in description', () => {
            const exampleAdvertisement =
                'Mieszkanie po remoncie, usytuowane na 4 piętrze z windą. Wymagana kaucja w wysokości 1600 zł.' +
                ' Mieszkanie przeznaczone dla osób nie palących. ';

            expect(isPerfectLocation(exampleAdvertisement)).toBe(false);
        });

        test('should return true for special names of good locations', () => {
            const exampleAdvertisement = 'Wynajmę 2 pokojowe mieszkanie zlokalizowane przy samej stacji metra - Służew';

            expect(isPerfectLocation(exampleAdvertisement)).toBe(true);
        });
    });
});

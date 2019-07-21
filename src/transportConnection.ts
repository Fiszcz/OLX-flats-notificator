import axios from 'axios';
const config =  require("../config/config.json");

const transportDestination = config.transportDestination.split(' ').join('+');

const departureTime = new Date();
departureTime.setMonth(config.departureTime.month);
departureTime.setDate(config.departureTime.day);
departureTime.setHours(config.departureTime.hour);
departureTime.setMinutes(config.departureTime.minute);
const departureTimeInSeconds = Math.floor(departureTime.getTime() / 1000).toString();

export interface TransportInformation {
    transportSteps: any[];
    textTime: string;
    timeInSeconds: number;
}

export const checkTransportTime = async (placeDescription: string): Promise<TransportInformation | undefined> => {

    const informationAboutTransport = await axios.get('https://maps.googleapis.com/maps/api/directions/json' +
        '?origin=' + placeDescription.split(' ').join('+') + '+Warszawa' +
        '&destination=' + transportDestination +
        '&mode=transit' +
        '&departure_time=' + departureTimeInSeconds +
        '&key=' + config.GoogleMapsKey)
        .then((resp: any) => resp.data.routes[0].legs[0]);

    if (!!informationAboutTransport) {
        console.log('[Google Maps]' + informationAboutTransport.duration.text + ' to ' + placeDescription);
        return {
            transportSteps: informationAboutTransport.steps,
            textTime: informationAboutTransport.duration.text,
            timeInSeconds: informationAboutTransport.duration.value,
        };
    }
    return undefined;

};

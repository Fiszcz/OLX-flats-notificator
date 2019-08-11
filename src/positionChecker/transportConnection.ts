import axios from 'axios';
import {transportDestination as transportDestinationJSON, departureTime as departureTimeJSON, GoogleMapsKey} from '../../config/config.json';

const transportDestination = transportDestinationJSON.split(' ').join('+');

const departureTime = new Date();
departureTime.setMonth(departureTimeJSON.month);
departureTime.setDate(departureTimeJSON.day);
departureTime.setHours(departureTimeJSON.hour);
departureTime.setMinutes(departureTimeJSON.minute);
const departureTimeInSeconds = Math.floor(departureTime.getTime() / 1000).toString();

export interface TransportInformation {
    transportSteps: any[];
    textTime: string;
    timeInSeconds: number;
}

export const checkTransportTime = async (placeDescription: string): Promise<TransportInformation | undefined> => {

    const informationAboutTransport = await axios.get('https://maps.googleapis.com/maps/api/directions/json' +
        // TODO: move Warszawa to config property
        '?origin=' + placeDescription.split(' ').join('+') + '+Warszawa' +
        '&destination=' + transportDestination +
        // TODO: move way of transport to config property
        '&mode=transit' +
        '&departure_time=' + departureTimeInSeconds +
        '&key=' + GoogleMapsKey)
        .then((resp: any) => resp.data.routes[0].legs[0]);

    if (Boolean(informationAboutTransport)) {
        console.log('[Google Maps]' + informationAboutTransport.duration.text + ' to ' + placeDescription);
        return {
            transportSteps: informationAboutTransport.steps,
            textTime: informationAboutTransport.duration.text,
            timeInSeconds: informationAboutTransport.duration.value,
        };
    }
    return undefined;

};

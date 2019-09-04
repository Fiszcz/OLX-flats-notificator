import axios from 'axios';
import {
    transportDestination as transportDestinationJSON,
    departureTime as departureTimeJSON,
    GoogleMapsKey,
} from '../../config/config.json';
import DirectionsResult = google.maps.DirectionsResult;

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

const getGoogleMapsAPIUrlRequest = (locationDescription: string) => {
    return (
        'https://maps.googleapis.com/maps/api/directions/json' +
        // TODO: move Warszawa to config property
        '?origin=' +
        locationDescription.split(' ').join('+') +
        '+Warszawa' +
        '&destination=' +
        transportDestination +
        // TODO: move way of transport to config property
        '&mode=transit' +
        '&departure_time=' +
        departureTimeInSeconds +
        '&key=' +
        GoogleMapsKey
    );
};

export const checkTransportTime = async (locationDescription: string): Promise<TransportInformation | undefined> => {
    return (
        axios
            .get<DirectionsResult>(getGoogleMapsAPIUrlRequest(locationDescription))
            .then(resp => resp.data.routes[0].legs[0])
            .then(informationAboutTransport => {
                if (Boolean(informationAboutTransport)) {
                    console.log('[Google Maps]' + informationAboutTransport.duration.text + ' to ' + locationDescription);
                    return {
                        transportSteps: informationAboutTransport.steps,
                        textTime: informationAboutTransport.duration.text,
                        timeInSeconds: informationAboutTransport.duration.value,
                    };
                }
            })
            // TODO: handle error
            .catch(() => undefined)
    );
};

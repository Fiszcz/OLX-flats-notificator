import axios from 'axios';
import {
    transportDestination as transportDestinationJSON,
    departureTime as departureTimeJSON,
    GoogleMapsKey,
    transportMode,
} from '../../config/config.json';
import DirectionsResult = google.maps.DirectionsResult;
import DirectionsStep = google.maps.DirectionsStep;

const transportDestinations = transportDestinationJSON.map(destination => ({
    location: destination.location,
    locationToAPI: destination.location.replace(/[&,.\s\\/-]/g, '+'),
    maxTime: destination.maxTransportTime,
}));

const departureTime = new Date();
departureTime.setMonth(departureTimeJSON.month);
departureTime.setDate(departureTimeJSON.day);
departureTime.setHours(departureTimeJSON.hour);
departureTime.setMinutes(departureTimeJSON.minute);
const departureTimeInSeconds = Math.floor(departureTime.getTime() / 1000).toString();

export interface TransportInformation {
    transportSteps: DirectionsStep[];
    textTime: string;
    timeInMinutes: number;
    hasSatisfiedTime: boolean;
    location: string;
}

const getGoogleMapsAPIUrlRequest = (flatLocation: string, transportDestination: string) => {
    return (
        'https://maps.googleapis.com/maps/api/directions/json' +
        '?origin=' +
        flatLocation +
        '&destination=' +
        transportDestination +
        '&mode=' +
        (transportMode || 'driving') +
        '&departure_time=' +
        departureTimeInSeconds +
        '&key=' +
        GoogleMapsKey
    );
};

export const checkTransportTime = async (flatLocation: string): Promise<TransportInformation[]> => {
    const flatLocationForAPI = flatLocation.split(' ').join('+');
    const requests = transportDestinations.map(destination =>
        axios
            .get<DirectionsResult>(getGoogleMapsAPIUrlRequest(flatLocationForAPI, destination.locationToAPI))
            .then(resp => resp.data.routes[0].legs[0])
            .then(informationAboutTransport => {
                if (Boolean(informationAboutTransport)) {
                    console.log('[Google Maps]' + informationAboutTransport.duration.text + ' to ' + flatLocation);
                    const timeInMinutes = Math.floor(informationAboutTransport.duration.value / 60);
                    return {
                        location: destination.location,
                        transportSteps: informationAboutTransport.steps,
                        textTime: informationAboutTransport.duration.text,
                        timeInMinutes,
                        hasSatisfiedTime: destination.maxTime >= timeInMinutes,
                    } as TransportInformation;
                }
            })
            // TODO: handle error
            .catch(() => undefined),
    );
    return Promise.all(requests).then(results => results.filter(result => result !== undefined) as TransportInformation[]);
};

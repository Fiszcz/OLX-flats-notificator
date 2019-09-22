import { TransportInformation } from '../../src/TransportConnection/TransportConnection';
import DirectionsStep = google.maps.DirectionsStep;

export const responsesFromGoogleDirectionsAPI = [
    {
        routes: [
            {
                legs: [
                    {
                        steps: [{ distance: { text: '20 kilometers', value: 20 } }],
                        duration: { text: '20 minutes', value: 1200 },
                    },
                ],
            },
        ],
    },
    {
        routes: [
            {
                legs: [
                    {
                        steps: [{ distance: { text: '40 kilometers', value: 20 } }],
                        duration: { text: '21 minutes', value: 1260 },
                    },
                ],
            },
        ],
    },
];

export const mappedResponseToTransportInformation: TransportInformation[] = [
    {
        textTime: responsesFromGoogleDirectionsAPI[0].routes[0].legs[0].duration.text,
        timeInMinutes: 20,
        transportSteps: responsesFromGoogleDirectionsAPI[0].routes[0].legs[0].steps as DirectionsStep[],
        hasSatisfiedTime: true,
        location: 'some location',
    },
    {
        textTime: responsesFromGoogleDirectionsAPI[1].routes[0].legs[0].duration.text,
        timeInMinutes: 21,
        transportSteps: responsesFromGoogleDirectionsAPI[1].routes[0].legs[0].steps as DirectionsStep[],
        hasSatisfiedTime: false,
        location: 'some other location',
    },
];

export const responseForFailure: TransportInformation[] = [
    {
        location: 'some location',
        textTime: 'Cannot check ☹️',
        timeInMinutes: NaN,
        transportSteps: [],
    },
    {
        location: 'some other location',
        textTime: 'Cannot check ☹️',
        timeInMinutes: NaN,
        transportSteps: [],
    },
];

import { mocked } from 'ts-jest/utils';
import axios from 'axios';
import { checkTransportTime } from '../../src/TransportConnection/TransportConnection';
import { mappedResponseToTransportInformation, responseForFailure, responsesFromGoogleDirectionsAPI } from './transportConnection.fixture';

jest.mock('../../config/config.json', () => ({
    transportDestination: [
        {
            location: 'some location',
            maxTransportTime: 20,
        },
        {
            location: 'some other location',
            maxTransportTime: 20,
        },
    ],
    departureTime: {
        weekday: 'monday',
        time: '13:50',
    },
}));
jest.mock('axios');

describe('checkTransportTime', () => {
    afterEach(() => {
        mocked(axios).mockClear();
    });

    test('return results with information about unable check transport information if communication with Google Api was finished with failure', async () => {
        mocked(axios.get)
            // @ts-ignore
            .mockResolvedValueOnce({ data: responsesFromGoogleDirectionsAPI[0] })
            .mockRejectedValueOnce({});

        expect(await checkTransportTime('ulica Powstancow')).toMatchObject([
            mappedResponseToTransportInformation[0],
            responseForFailure[1],
        ]);
    });

    test('return transport information mapped from success Google Api request', async () => {
        mocked(axios.get)
            // @ts-ignore
            .mockResolvedValueOnce({ data: responsesFromGoogleDirectionsAPI[0] })
            .mockResolvedValueOnce({ data: responsesFromGoogleDirectionsAPI[1] });

        expect(await checkTransportTime('ulica Powstancow')).toMatchObject(mappedResponseToTransportInformation);
    });
});

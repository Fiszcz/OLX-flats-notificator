import { mocked } from "ts-jest/utils";
import axios from 'axios';
import { checkTransportTime, TransportInformation } from "../src/positionChecker/transportConnection";

jest.mock('axios');

describe('checkTransportTime', () => {

    afterEach(() => {
        // @ts-ignore
        mocked(axios).mockClear();
    });

    test('return undefined if communication with Google Api was finished with failure', async () => {
        mocked(axios.get)
            // @ts-ignore
            .mockRejectedValue({});

        expect(await checkTransportTime('ulica Powstancow')).toBeUndefined();
    });

    test('return transport information mapped from success Google Api request', async () => {
        const response = {
            routes: [{
                legs: [{
                    steps: [{distance: {text: '20 kilometrów', value: 20}}],
                    duration: {text: '20 minut', value: 1200},
                }],
            }],
        };

        const mappedResponse: TransportInformation = {
            textTime: response.routes[0].legs[0].duration.text,
            timeInSeconds: response.routes[0].legs[0].duration.value,
            transportSteps: response.routes[0].legs[0].steps,
        };

        mocked(axios.get)
            // @ts-ignore
            .mockResolvedValue({data: response});

        expect(await checkTransportTime('ulica Powstancow')).toMatchObject(mappedResponse);
    });

});

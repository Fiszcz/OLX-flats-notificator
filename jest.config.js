module.exports = {
    roots: ['.'],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.ts?$',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    preset: 'ts-jest',
    coverageDirectory: './coverage/',
    collectCoverage: true,
};

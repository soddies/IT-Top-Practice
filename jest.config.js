export default {
    testEnvironment: 'node',

    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    testMatch: [
        '<rootDir>/unitTests/**/*.test.js',
        '<rootDir>/unitTests/**/*.spec.js'
    ],

    testPathIgnorePatterns: [
        '/node_modules/'
    ],

    collectCoverageFrom: [
        'functions/**/*.js',
        '!**/node_modules/**',
        '!**/unitTests/**'
    ],

    coverageDirectory: '<rootDir>/coverage',

    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    roots: ['<rootDir>']
};

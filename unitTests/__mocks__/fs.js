export default {
    writeFileSync: jest.fn(),
    createReadaStream: jest.fn(() => ({
        pipe: jest.fn(),
        on: jest.fn()
    })),
    readFileSync: jest.fn(),
    existsSync: jest.fn(() => true)
};

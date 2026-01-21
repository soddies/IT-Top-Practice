import * as actualPath from 'path'

export default {
    ...actualPath,
    dirname: jest.fn(() => '/test/dir'),
    join: jest.fn((...args) => args.join('/'))
};
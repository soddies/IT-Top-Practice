import { jest } from '@jest/globals';

jest.unstable_mockModule('xlsx', () => {
    const mockReadFile = jest.fn();
    const mockSheetToJson = jest.fn();
    
    return {
        default: {
            readFile: mockReadFile,
            utils: {
                sheet_to_json: mockSheetToJson
            }
        }
    };
});

jest.unstable_mockModule('fs', () => {
    const mockWriteFileSync = jest.fn();
    const mockCreateReadStream = jest.fn(() => ({
        pipe: jest.fn(),
        on: jest.fn()
    }));
    
    return {
        default: {
            writeFileSync: mockWriteFileSync,
            createReadStream: mockCreateReadStream
        }
    };
});

jest.unstable_mockModule('path', () => {
    const actualPath = jest.requireActual('path');
    
    return {
        default: {
            ...actualPath,
            dirname: jest.fn(() => '/test/dir'),
            join: jest.fn((...args) => args.join('/'))
        }
    };
});

let XLSX, fs, path, func6Handler;

beforeAll(async () => {
    XLSX = (await import('xlsx')).default;
    fs = (await import('fs')).default;
    path = (await import('path')).default;
    
    const module = await import('../../functions/functionsHandlers/func6Handler.js');
    func6Handler = module.default;
});

test('Тестируем всю функцию func6Handler', async () => {
    const mockRows = [
        ['ФИО', '', 'Группа', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Процент ДЗ'],
        ['Иванов И.И.', '', 'ГР1', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '65'],
        ['Петров П.П.', '', 'ГР2', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '80']
    ];
    
    XLSX.readFile.mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
    });
    
    XLSX.utils.sheet_to_json.mockReturnValue(mockRows);
    
    const mockCtx = {
        reply: jest.fn().mockResolvedValue(true),
        replyWithDocument: jest.fn().mockResolvedValue(true)
    };
    
    await func6Handler(mockCtx, '/test/file.xlsx');
    
    expect(XLSX.readFile).toHaveBeenCalledWith('/test/file.xlsx');
    expect(mockCtx.reply).toHaveBeenCalled();
    
    const call = mockCtx.reply.mock.calls[0];
    const message = call[0];
    
    expect(message).toContain('Иванов');
    expect(message).toContain('65%');
    expect(message).not.toContain('Петров');
});
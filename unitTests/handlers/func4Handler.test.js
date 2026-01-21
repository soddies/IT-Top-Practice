import { jest } from '@jest/globals';

describe('func4Handler - дополнительные тесты', () => {
    let func4Handler;
    let mockReadFile, mockSheetToJson, mockReply;

    beforeEach(async () => {
        jest.resetModules();
        jest.clearAllMocks();
        
        mockReadFile = jest.fn();
        mockSheetToJson = jest.fn();
        mockReply = jest.fn().mockResolvedValue(true);
        console.error = jest.fn();

        jest.unstable_mockModule('xlsx', () => ({
            default: {
                readFile: mockReadFile,
                utils: {
                    sheet_to_json: mockSheetToJson
                }
            }
        }));

        const module = await import('../../functions/functionsHandlers/func4Handler.js');
        func4Handler = module.default;
    });

    test('должен корректно парсить разные форматы чисел', async () => {
        const mockExcelData = [
            ['ФИО преподавателя', '', '', '', '', '', '', '', '', '', 'Посещаемость', ''],
            ['Преподаватель 1', '', '', '', '', '', '', '', '', '', 45], 
            ['Преподаватель 2', '', '', '', '', '', '', '', '', '', '30'], 
            ['Преподаватель 3', '', '', '', '', '', '', '', '', '', 40.5], 
            ['Преподаватель 4', '', '', '', '', '', '', '', '', '', '25,5'], 
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });
        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func4Handler(mockCtx, 'formats.xlsx');

        const message = mockReply.mock.calls[0][0];

        expect(message).toContain('Преподаватель 1');
        expect(message).toContain('Преподаватель 2');
        expect(message).toContain('Преподаватель 3');
        expect(message).toContain('Преподаватель 4');
        expect(message).toContain('*Посещаемость:* 25%');
    });

    test('должен пропускать строки если колонка посещаемости не существует', async () => {
        const mockExcelData = [
            ['ФИО преподавателя', '', '', '', '', '', '', '', '', '', 'Посещаемость'],
            ['Преподаватель 1'], 
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });
        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func4Handler(mockCtx, 'short-rows.xlsx');

        expect(mockReply).toHaveBeenCalledWith(
            "Нет преподавателей с низкой посещаемостью."
        );
    });

    test('должен правильно форматировать вывод с процентами', async () => {
        const mockExcelData = [
            ['ФИО преподавателя', '', '', '', '', '', '', '', '', '', 'Посещаемость', ''],
            ['Иванов И.И.', '', '', '', '', '', '', '', '', '', '45', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });
        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func4Handler(mockCtx, 'format-output.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toContain('Преподаватели с низкой посещаемостью');
        expect(message).toContain('Иванов И.И.');
        expect(message).toContain('*Посещаемость:* 45%');
    });
});
import { jest } from '@jest/globals';

const mockReadFile = jest.fn();
const mockSheetToJson = jest.fn();
const mockReply = jest.fn();

jest.unstable_mockModule('xlsx', () => ({
    default: {
        readFile: mockReadFile,
        utils: {
            sheet_to_json: mockSheetToJson
        }
    }
}));

let func5Handler;

beforeAll(async () => {
    const module = await import('../../functions/functionsHandlers/func5Handler.js');
    func5Handler = module.default;
});

beforeEach(() => {
    jest.clearAllMocks();
    mockReply.mockResolvedValue(true);
    console.error = jest.fn();
});

describe('func5Handler', () => {
    test('должен находить преподавателей с проверкой ДЗ < 70% за месяц и неделю', async () => {
        const mockExcelData = [
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Иванов И.И.', '', '100', '', '60', '', '', '50', '', '30', ''],
            ['', 'Петров П.П.', '', '80', '', '70', '', '', '40', '', '35', ''],
            ['', 'Сидоров С.С.', '', '50', '', '25', '', '', '30', '', '10', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Кузнецов К.К.', '', '0', '', '0', '', '', '0', '', '0', ''],
            ['', 'Федоров Ф.Ф.', '', '100', '', '90', '', '', '100', '', '90', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func5Handler(mockCtx, 'test.xlsx');

        const sentMessage = mockReply.mock.calls[0][0];
        
        expect(sentMessage).toContain('Иванов И.И.');
        expect(sentMessage).toContain('Сидоров С.С.');
        expect(sentMessage).not.toContain('Петров');
        expect(sentMessage).not.toContain('Федоров'); 
        
        expect(sentMessage).toContain('*Проверено:* 60 / 100'); 
        expect(sentMessage).toContain('*Проверено:* 30 / 50'); 
        expect(sentMessage).toContain('*Всего за месяц:* 2');
        expect(sentMessage).toContain('*Всего за неделю:* 2');
    });

    test('должен пропускать преподавателей с issued=0', async () => {
        const mockExcelData = [
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Иванов И.И.', '', '0', '', '0', '', '', '0', '', '0', ''],
            ['', 'Петров П.П.', '', '100', '', '80', '', '', '0', '', '0', ''], 
            ['', 'Сидоров С.С.', '', '0', '', '0', '', '', '100', '', '50', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func5Handler(mockCtx, 'zero-issued.xlsx');

        const message = mockReply.mock.calls[0][0]; 
        expect(message).toContain('Сидоров');
        expect(message).toContain('50%');
        expect(message).not.toContain('Иванов');
        expect(message).not.toContain('Петров');
    });

    test('должен сортировать по проценту проверки (от меньшего к большему)', async () => {
        const mockExcelData = [
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Худший', '', '100', '', '30', '', '', '100', '', '30', ''],
            ['', 'Средний', '', '100', '', '50', '', '', '100', '', '50', ''],
            ['', 'Лучший из плохих', '', '100', '', '69', '', '', '100', '', '69', ''],
            ['', 'Хороший', '', '100', '', '80', '', '', '100', '', '80', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func5Handler(mockCtx, 'sorting.xlsx');

        const message = mockReply.mock.calls[0][0];
        const lines = message.split('\n');
        const teacherLines = lines.filter(line => line.match(/^\d+\./));
        
        expect(teacherLines[0]).toContain('Худший');
        expect(teacherLines[1]).toContain('Средний');
        expect(teacherLines[2]).toContain('Лучший из плохих');
        expect(lines.some(line => line.includes('Хороший'))).toBe(false);
    });

    test('должен правильно округлять проценты до 2 знаков', async () => {
        const mockExcelData = [
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Преподаватель 1', '', '7', '', '3', '', '', '7', '', '3', ''],
            ['', 'Преподаватель 2', '', '3', '', '2', '', '', '3', '', '2', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func5Handler(mockCtx, 'rounding.xlsx');

        const message = mockReply.mock.calls[0][0];
        expect(message).toContain('42.86%');
        expect(message).toContain('66.67%');
    });

    test('должен обрабатывать пустые строки и некорректные данные', async () => {
        const mockExcelData = [
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Иванов', '', 'не число', '', 'текст', '', '', 'abc', '', 'def', ''],
            ['', 'Петров', '', '100', '', '70', '', '', '50', '', '35', ''],
            ['', 'Сидоров', '', '100', '', '69.9', '', '', '100', '', '69.9', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func5Handler(mockCtx, 'invalid-data.xlsx');

        const message = mockReply.mock.calls[0][0];

        expect(message).toContain('Сидоров');
        expect(message).toContain('69.9%');
        expect(message).not.toContain('Иванов');
        expect(message).not.toContain('Петров');
    });

    test('должен показывать сообщение если все преподаватели хорошо проверяют', async () => {
        const mockExcelData = [
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Иванов', '', '100', '', '80', '', '', '50', '', '40', ''],
            ['', 'Петров', '', '100', '', '75', '', '', '60', '', '45', ''],
            ['', 'Сидоров', '', '100', '', '100', '', '', '100', '', '100', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func5Handler(mockCtx, 'all-good.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toContain('Все преподаватели проверяют более 70% ДЗ за месяц!');
        expect(message).toContain('Все преподаватели проверяют более 70% ДЗ за неделю!');
        expect(message).not.toContain('Иванов');
        expect(message).not.toContain('Петров');
        expect(message).not.toContain('Сидоров');
    });

    test('должен обрабатывать ошибки при чтении файла', async () => {
        mockReadFile.mockImplementation(() => {
            throw new Error('File not found');
        });

        const mockCtx = { reply: mockReply };
        
        await func5Handler(mockCtx, 'nonexistent.xlsx');

        expect(mockReply).toHaveBeenCalledWith(
            'Произошла ошибка при обработке проверенных ДЗ'
        );
        expect(console.error).toHaveBeenCalled();
    });

    test('должен правильно считать проценты для граничных значений', async () => {
        const mockExcelData = [
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', ''],
            ['', 'Граница 69.9', '', '100', '', '69.9', '', '', '100', '', '69.9', ''],
            ['', 'Граница 70', '', '100', '', '70', '', '', '100', '', '70', ''],
            ['', 'Граница 70.1', '', '100', '', '70.1', '', '', '100', '', '70.1', ''],
            ['', 'Граница 0', '', '100', '', '0', '', '', '100', '', '0', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func5Handler(mockCtx, 'boundaries.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toContain('Граница 69.9');
        expect(message).toContain('Граница 0');
        expect(message).not.toContain('Граница 70'); 
        expect(message).not.toContain('Граница 70.1'); 
        
        expect(message).toContain('69.9%'); 
        expect(message).toContain('0%'); 
    });
});
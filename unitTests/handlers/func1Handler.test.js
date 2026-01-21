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

let func1Handler;

beforeAll(async () => {
    const module = await import('../../functions/functionsHandlers/func1Handler.js');
    func1Handler = module.default;
});

beforeEach(() => {
    jest.clearAllMocks();
    mockReply.mockResolvedValue(true);
});

describe('func1Handler', () => {
    test('должен обрабатывать Excel с группами и предметами', async () => {
        const mockExcelData = [
            ['', 'Группа', '', '', 'Понедельник', '', 'Вторник'],
            ['', 'ГР-101', '', '', 'Предмет: Математика', '', 'Предмет: Физика'],
            ['', 'ГР-101', '', '', 'Предмет: Программирование', '', 'Предмет: Базы данных'],
            ['', 'ГР-101', '', '', 'Предмет: Математика', '', ''], 
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = {
            reply: mockReply
        };

        await func1Handler(mockCtx, 'test.xlsx');

        expect(mockReadFile).toHaveBeenCalledWith('test.xlsx');
        expect(mockReply).toHaveBeenCalled();

        const sentMessage = mockReply.mock.calls[0][0];
        
        expect(sentMessage).toContain('ГР-101');
        expect(sentMessage).toContain('Математика: *2 пар(ы)*'); 
        expect(sentMessage).toContain('Физика: *1 пар(ы)*');
        expect(sentMessage).toContain('Программирование: *1 пар(ы)*');
        expect(sentMessage).toContain('Всего групп: 1');
        expect(sentMessage).toContain('Всего пар:');
    });

    test('должен возвращать сообщение если групп не найдено', async () => {
        const mockExcelData = [
            ['Заголовок', 'Другая колонка'],
            ['Данные', '123']
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = {
            reply: mockReply
        };

        await func1Handler(mockCtx, 'empty.xlsx');

        expect(mockReply).toHaveBeenCalledWith(
            "В файле не найдено групп или занятий."
        );
    });

    test('должен правильно парсить дни недели', async () => {
        const mockExcelData = [
            ['', 'Группа', 'Понедельник', 'Вторник', 'Среда'],
            ['', 'ГР-1', 'Предмет: Математика', 'Предмет: Физика', 'Предмет: Химия'],
            ['', 'ГР-2', 'Предмет: История', '', 'Предмет: Литература'],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func1Handler(mockCtx, 'days.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toContain('Математика: *1 пар(ы)*');
        expect(message).toContain('Физика: *1 пар(ы)*');
        expect(message).toContain('Химия: *1 пар(ы)*');
        expect(message).toContain('История: *1 пар(ы)*');
        expect(message).toContain('Литература: *1 пар(ы)*');
    });

    test('должен обрабатывать пустые ячейки', async () => {
        const mockExcelData = [
            ['', 'Группа', 'Понедельник'],
            ['', 'ГР-1', ''],
            ['', 'ГР-2', 'Предмет: Математика'],
            ['', '', 'Предмет: Физика'], 
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func1Handler(mockCtx, 'empty-cells.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toContain('ГР-2');
        expect(message).toContain('Математика: *1 пар(ы)*');
        expect(message).toContain('Физика: *1 пар(ы)*');
    });

    test('должен обрабатывать ошибки при чтении файла', async () => {
        mockReadFile.mockImplementation(() => {
            throw new Error('File not found');
        });

        const mockCtx = { 
            reply: mockReply,
            console: { error: jest.fn() }
        };

        console.error = jest.fn();

        await func1Handler(mockCtx, 'nonexistent.xlsx');
        
        expect(mockReply).toHaveBeenCalledWith(
            'Произошла ошибка при обработке групп'
        );
        expect(console.error).toHaveBeenCalled();
    });
});

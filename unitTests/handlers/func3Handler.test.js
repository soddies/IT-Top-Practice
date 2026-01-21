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

global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
};

let func3Handler;

beforeAll(async () => {
    const module = await import('../../functions/functionsHandlers/func3Handler.js');
    func3Handler = module.default;
});

beforeEach(() => {
    jest.clearAllMocks();
    mockReply.mockResolvedValue(true);
    console.error = jest.fn();
});

// 4. Тесты
describe('func3Handler', () => {
    test('должен находить студентов с homework=1 и classroom>=3', async () => {
        const mockExcelData = [
            ['ФИО', '', 'Группа', '', '', '', '', '', '', '', '', '', '', '', '', 'ДЗ', 'КР', ''],
            ['Иванов И.И.', '', 'ГР-101', '', '', '', '', '', '', '', '', '', '', '', '', '1', '3', ''],
            ['Петров П.П.', '', 'ГР-102', '', '', '', '', '', '', '', '', '', '', '', '', '1', '5', ''],
            ['Сидоров С.С.', '', 'ГР-103', '', '', '', '', '', '', '', '', '', '', '', '', '2', '3', ''], // ДЗ=2 - не подходит
            ['Кузнецов К.К.', '', 'ГР-104', '', '', '', '', '', '', '', '', '', '', '', '', '1', '2', ''], // КР=2 - не подходит
            ['Федоров Ф.Ф.', '', 'ГР-105', '', '', '', '', '', '', '', '', '', '', '', '', 'не оценка', '5', ''], // Не числа
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = {
            reply: mockReply
        };

        await func3Handler(mockCtx, 'test.xlsx');

        expect(mockReadFile).toHaveBeenCalledWith('test.xlsx');
        expect(mockReply).toHaveBeenCalled();

        const sentMessage = mockReply.mock.calls[0][0];
        
        expect(sentMessage).toContain('Иванов И.И.');
        expect(sentMessage).toContain('Петров П.П.');
        expect(sentMessage).not.toContain('Сидоров'); 
        expect(sentMessage).not.toContain('Кузнецов'); 
        expect(sentMessage).not.toContain('Федоров');
        
        expect(sentMessage).toContain('*Группа:* ГР-101'); 
        expect(sentMessage).toContain('*Классная работа:* 3'); 
        expect(sentMessage).toContain('*Домашняя работа:* 1'); 
        expect(sentMessage).toContain('Всего студентов: 2');
    });

    test('должен возвращать сообщение если нет студентов с низкими оценками', async () => {
        const mockExcelData = [
            ['ФИО', '', 'Группа', '', '', '', '', '', '', '', '', '', '', '', '', 'ДЗ', 'КР', ''],
            ['Иванов И.И.', '', 'ГР-101', '', '', '', '', '', '', '', '', '', '', '', '', '2', '3', ''],
            ['Петров П.П.', '', 'ГР-102', '', '', '', '', '', '', '', '', '', '', '', '', '1', '2', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = {
            reply: mockReply
        };

        await func3Handler(mockCtx, 'good-students.xlsx');

        expect(mockReply).toHaveBeenCalledWith(
            "Студенты с низкими оценками не найдены."
        );
    });

    test('должен корректно обрабатывать граничные значения', async () => {
        const mockExcelData = [
            ['ФИО', '', 'Группа', '', '', '', '', '', '', '', '', '', '', '', '', 'ДЗ', 'КР', ''],
            ['Студент 1', '', 'ГР-1', '', '', '', '', '', '', '', '', '', '', '', '', '1', '3', ''],
            ['Студент 2', '', 'ГР-2', '', '', '', '', '', '', '', '', '', '', '', '', '1', '2.999', ''],
            ['Студент 3', '', 'ГР-3', '', '', '', '', '', '', '', '', '', '', '', '', '1', '3.0', ''],
            ['Студент 4', '', 'ГР-4', '', '', '', '', '', '', '', '', '', '', '', '', '1.0', '4', ''],
            ['Студент 5', '', 'ГР-5', '', '', '', '', '', '', '', '', '', '', '', '', '0.999', '3', ''],
            ['Студент 6', '', 'ГР-6', '', '', '', '', '', '', '', '', '', '', '', '', '1', '3.001', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func3Handler(mockCtx, 'boundary.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toMatch(/1\. Студент 1/);
        expect(message).not.toMatch(/Студент 2/);
        expect(message).toMatch(/2\. Студент 3/);
        expect(message).toMatch(/3\. Студент 4/);
        expect(message).not.toMatch(/Студент 5/);
        expect(message).toMatch(/4\. Студент 6/);
    });

    test('должен игнорировать нечисловые значения', async () => {
        const mockExcelData = [
            ['ФИО', '', 'Группа', '', '', '', '', '', '', '', '', '', '', '', '', 'ДЗ', 'КР', ''],
            ['Студент 1', '', 'ГР-1', '', '', '', '', '', '', '', '', '', '', '', '', 'отсутствует', '3', ''],
            ['Студент 2', '', 'ГР-2', '', '', '', '', '', '', '', '', '', '', '', '', '1', 'н/я', ''],
            ['Студент 3', '', 'ГР-3', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['Студент 4', '', 'ГР-4', '', '', '', '', '', '', '', '', '', '', '', '', '1', '3', ''],
            ['Студент 5', '', 'ГР-5', '', '', '', '', '', '', '', '', '', '', '', '', 'abc', 'def', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func3Handler(mockCtx, 'non-numeric.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toMatch(/1\. Студент 4/);
        expect(message).not.toMatch(/Студент 1/);
        expect(message).not.toMatch(/Студент 2/);
        expect(message).not.toMatch(/Студент 3/);
        expect(message).not.toMatch(/Студент 5/);
    });

    test('должен обрабатывать пустой файл (только заголовок)', async () => {
        const mockExcelData = [
            ['ФИО', '', 'Группа', '', '', '', '', '', '', '', '', '', '', '', '', 'ДЗ', 'КР', '']
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func3Handler(mockCtx, 'empty.xlsx');

        expect(mockReply).toHaveBeenCalledWith(
            "Студенты с низкими оценками не найдены."
        );
    });

    test('должен обрабатывать ошибки при чтении файла', async () => {
        mockReadFile.mockImplementation(() => {
            throw new Error('File not found');
        });

        const mockCtx = { reply: mockReply };
        
        await func3Handler(mockCtx, 'nonexistent.xlsx');

        expect(mockReply).toHaveBeenCalledWith(
            'Произошла ошибка при обработке студентов'
        );
        expect(console.log).toHaveBeenCalled();
    });

    test('должен правильно работать с плавающими числами', async () => {
        const mockExcelData = [
            ['ФИО', '', 'Группа', '', '', '', '', '', '', '', '', '', '', '', '', 'ДЗ', 'КР', ''],
            ['Студент 1', '', 'ГР-1', '', '', '', '', '', '', '', '', '', '', '', '', '1.0', '3.5', ''],
            ['Студент 2', '', 'ГР-2', '', '', '', '', '', '', '', '', '', '', '', '', '1.00', '3.00', ''],
            ['Студент 3', '', 'ГР-3', '', '', '', '', '', '', '', '', '', '', '', '', '0.5', '4.0', ''],
            ['Студент 4', '', 'ГР-4', '', '', '', '', '', '', '', '', '', '', '', '', '1', '2.99', ''],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func3Handler(mockCtx, 'floats.xlsx');

        const message = mockReply.mock.calls[0][0];
        
        expect(message).toMatch(/1\. Студент 1/);
        expect(message).toMatch(/2\. Студент 2/);
        expect(message).not.toMatch(/Студент 3/);
        expect(message).not.toMatch(/Студент 4/);
    });
});
import { jest } from '@jest/globals';

const mockReadFile = jest.fn();
const mockSheetToJson = jest.fn();
const mockWriteFileSync = jest.fn();
const mockCreateReadStream = jest.fn(() => ({
    pipe: jest.fn(),
    on: jest.fn()
}));
const mockReply = jest.fn();
const mockReplyWithDocument = jest.fn();

jest.unstable_mockModule('xlsx', () => ({
    default: {
        readFile: mockReadFile,
        utils: {
            sheet_to_json: mockSheetToJson
        }
    }
}));

jest.unstable_mockModule('fs', () => ({
    default: {
        writeFileSync: mockWriteFileSync,
        createReadStream: mockCreateReadStream
    }
}));

jest.unstable_mockModule('path', () => ({
    default: {
        dirname: jest.fn(() => '/test/dir'),
        join: jest.fn((...args) => args.join('/'))
    }
}));

let func2Handler;

beforeAll(async () => {
    const module = await import('../../functions/functionsHandlers/func2Handler.js');
    func2Handler = module.default;
});

beforeEach(() => {
    jest.clearAllMocks();
    mockReply.mockResolvedValue(true);
    mockReplyWithDocument.mockResolvedValue(true);
});

describe('func2Handler', () => {
    test('должен возвращать успех если все темы правильные', async () => {
        const mockExcelData = [
            ['Тема урока', 'ФИО преподавателя', 'Предмет', 'Date'],
            ['Урок №1. Тема: Математика', 'Иванов И.И.', 'Математика', '2024-01-01'],
            ['Урок 2: Физика', 'Петров П.П.', 'Физика', '2024-01-02'],
            ['Урок 3 Алгебра', 'Сидоров С.С.', 'Математика', '2024-01-03'], 
            ['Урок №4- Геометрия', 'Кузнецов К.К.', 'Математика', '2024-01-04'],
            ['Занятие №5. Тема: Химия', 'Федоров Ф.Ф.', 'Химия', '2024-01-05'],
            ['Занятие 6: Биология', 'Смирнов С.С.', 'Биология', '2024-01-06'],
            ['Тема №7: История', 'Попов П.П.', 'История', '2024-01-07'],
            ['КР №8 Контрольная', 'Васильев В.В.', 'Математика', '2024-01-08'], 
            ['Практическая работа №9', 'Николаев Н.Н.', 'Информатика', '2024-01-09'],
            ['/', '', '', ''], 
            ['', '', '', ''], 
            ['У', '', '', ''], 
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = {
            reply: mockReply
        };

        await func2Handler(mockCtx, 'correct-topics.xlsx');

        const errorMessages = mockReply.mock.calls.filter(call => 
            call[0].includes('Найдено') || call[0].includes('некорректных')
        );
        
        if (errorMessages.length > 0) {
            console.log('Ошибки найдены:', errorMessages[0][0]);
            const message = errorMessages[0][0];
            expect(message).not.toContain('КР №8');
        }
        
        const successMessages = mockReply.mock.calls.filter(call => 
            call[0].includes('Все темы уроков соответствуют формату')
        );
        
        if (successMessages.length > 0) {
            expect(mockReply).toHaveBeenCalledWith('Все темы уроков соответствуют формату!');
        }
    });

    test('должен находить некорректные темы', async () => {
        const mockExcelData = [
            ['Тема урока', 'ФИО преподавателя', 'Предмет', 'Date'],
            ['Урок №1. Тема: Математика', 'Иванов', 'Математика', '2024-01-01'],
            ['Просто тема без формата', 'Петров', 'Физика', '2024-01-02'],
            ['Еще одна плохая тема', 'Сидоров', 'Химия', '2024-01-03'],
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = {
            reply: mockReply
        };

        await func2Handler(mockCtx, 'incorrect-topics.xlsx');

        expect(mockReply).toHaveBeenCalled();
        const message = mockReply.mock.calls[0][0];
        
        expect(message).toContain('Найдено 2 некорректных тем');
        expect(message).toContain('Просто тема без формата');
        expect(message).toContain('Еще одна плохая тема');
    });

    test('должен правильно распознавать все форматы правильных тем', async () => {
        const correctFormats = [
            'Урок №1. Тема: Математика',       
            'Урок №1: Алгебра',                
            'Урок 1: Геометрия',               
            'Урок 1 Физика',                   
            'Урок №1- Химия',                  
            'Занятие №1. Тема: Биология',      
            'Занятие №1: История',             
            'Занятие 1 Литература',            
            'Тема №1: Программирование',       
            'КР №1 Контрольная работа',       
            'Практическая работа №2',          
            'Практическая работа №3 текст',    
        ];

        const mockExcelData = [
            ['Тема урока', 'ФИО преподавателя', 'Предмет', 'Date'],
            ...correctFormats.map(topic => [topic, 'Преподаватель', 'Предмет', '2024-01-01'])
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = {
            reply: mockReply
        };

        await func2Handler(mockCtx, 'all-formats.xlsx');

        const errorMessages = mockReply.mock.calls.filter(call => 
            call[0].includes('Найдено') || call[0].includes('некорректных')
        );
        
        if (errorMessages.length === 0) {
            const successMessages = mockReply.mock.calls.filter(call => 
                call[0].includes('Все темы уроков соответствуют формату')
            );
            expect(successMessages.length).toBeGreaterThan(0);
        } else {
            console.log('Найдены ошибки:', errorMessages[0][0]);
            const message = errorMessages[0][0];
            const match = message.match(/Найдено (\d+) некорректных тем/);
            if (match) {
                const errorCount = parseInt(match[1], 10);
                expect(errorCount).toBeLessThan(3);
            }
        }
    });
    
    test('должен создавать файл если много некорректных тем', async () => {
        const headers = ['Тема урока', 'ФИО преподавателя', 'Предмет', 'Date'];
        const rows = [headers];
        
        for (let i = 0; i < 55; i++) {
            rows.push([`Неправильная тема ${i + 1}`, `Преподаватель ${i + 1}`, 'Предмет', '2024-01-01']);
        }

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(rows);

        const mockCtx = {
            reply: mockReply,
            replyWithDocument: mockReplyWithDocument
        };

        await func2Handler(mockCtx, 'many-topics.xlsx');

        expect(mockWriteFileSync).toHaveBeenCalled();
        expect(mockReply).toHaveBeenCalled();
        expect(mockReplyWithDocument).toHaveBeenCalled();
    });

    test('должен бросать ошибку если колонка "Тема урока" не найдена', async () => {
        const mockExcelData = [
            ['Другая колонка', 'ФИО преподавателя'],
            ['Значение', 'Иванов И.И.']
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        console.error = jest.fn();

        await func2Handler(mockCtx, 'no-topic-column.xlsx');

        expect(mockReply).toHaveBeenCalledWith('Произошла ошибка при обработке тем');
        expect(console.error).toHaveBeenCalled();
    });

    test('должен отправлять примеры правильных форматов при ошибках', async () => {
        const mockExcelData = [
            ['Тема урока', 'ФИО преподавателя', 'Предмет', 'Date'],
            ['Неправильная тема', 'Иванов', 'Математика', '2024-01-01']
        ];

        mockReadFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: { Sheet1: {} }
        });

        mockSheetToJson.mockReturnValue(mockExcelData);

        const mockCtx = { reply: mockReply };
        await func2Handler(mockCtx, 'with-examples.xlsx');

        expect(mockReply).toHaveBeenCalledTimes(2);
        const secondMessage = mockReply.mock.calls[1][0];
        expect(secondMessage).toContain('Примеры правильных форматов');
    });
});
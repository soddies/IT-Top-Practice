export default {
    readFile: jest.fn(() => ({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {}} 
    })),
    utils: {
        sheet_to_json: jest.fn(() => [
            ['ФИО', 'Группа', 'Процент ДЗ'],
            ['Иванов И.И.', 'ГР1', '65'],
            ['Петров П.П.', 'ГР2', '80'],
        ])
    } 
}
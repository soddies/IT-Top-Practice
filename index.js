import { Telegraf, Markup, session } from 'telegraf'
import fs from 'fs';
import axios from 'axios';
import path from 'path';

import func1Recipient from './functions/recipientFunctions/func1Recipient.js';
import func2Recipient from './functions/recipientFunctions/func2Recipient.js';
import func3Recipient from './functions/recipientFunctions/func3Recipient.js';
import func4Recipient from './functions/recipientFunctions/func4Recipient.js';
import func5Recipient from './functions/recipientFunctions/func5Recipient.js';
import func6Recipient from './functions/recipientFunctions/func6Recipient.js';

import func1Handler from './functions/functionsHandlers/func1Handler.js';
import func2Handler from './functions/functionsHandlers/func2Handler.js';
import func3Handler from './functions/functionsHandlers/func3Handler.js';
import func4Handler from './functions/functionsHandlers/func4Handler.js';
import func5Handler from './functions/functionsHandlers/func5Handler.js';
import func6Handler from './functions/functionsHandlers/func6Handler.js';

const functions = {
    '1': func1Recipient,
    '2': func2Recipient,
    '3': func3Recipient,
    '4': func4Recipient,
    '5': func5Recipient,
    '6': func6Recipient,
}

const bot = new Telegraf('8404536921:AAF93gBUmUhkwy0DIu6i-M-MX-C4jAha_yY')

bot.use(session({
    defaultSession: () => ({
        isInFunctionMenu: false,
        waitingForFile: false,
        currentFunction: null,
        lastFunctionSelected: null,
        isProcessingFile: false
    })
}))

bot.start((ctx) => {
    ctx.session.isInFunctionMenu = false;
    ctx.session.waitingForFile = false;
    ctx.session.currentFunction = null;
    ctx.session.lastFunctionSelected = null;
    ctx.session.isProcessingFile = false;
    
    ctx.reply('Привет. Я - бот-помощник для учебной части IT-Top колледжа. Нажмите "Продолжить" чтобы перейти к функциям, которые я выполняю.',
    Markup.keyboard([
        ['Продолжить']
    ])
    .oneTime()
    .resize()
    )
})

bot.hears('Продолжить', (ctx) => {
    ctx.session.isInFunctionMenu = true;
    ctx.session.waitingForFile = false;
    ctx.session.currentFunction = null;
    ctx.session.lastFunctionSelected = null;
    ctx.session.isProcessingFile = false;
    
    return showMainMenu(ctx);
})

function showMainMenu(ctx) {
    ctx.session.isInFunctionMenu = true;
    ctx.session.waitingForFile = false;
    ctx.session.currentFunction = null;
    ctx.session.lastFunctionSelected = null;
    ctx.session.isProcessingFile = false;
    
    const menuText = 
        'Выберите функцию: \n' +
        '\n1. Отчет по выставленному расписанию' +
        '\n2. Отчет по темам занятия' +
        '\n3. Отчет по студентам' +
        '\n4. Отчет по посещаемости студентов' +
        '\n5. Отчет по проверенным ДЗ' +
        '\n6. Отчет по сданным ДЗ' + 
        '\n\n*ВАЖНО!!!*\n' +
        '*1 - файл "Расписание групп"*' +
        '\n*2 - файл "Темы уроков"*' +
        '\n*3 - файл "Отчет по студентам"*' +
        '\n*4 - файл "Посещаемость по преподавателям"*' +
        '\n*5 - файл "Отчет по домашним заданиям"*' +
        '\n*6 - файл "Отчет по студентам"*';
    
    return ctx.reply(
        menuText,
        {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [
                    ['1', '2'],
                    ['3', '4'],
                    ['5', '6']
                ],
                resize_keyboard: true
            }
        }
    );
}

bot.hears(['1', '2', '3', '4', '5', '6'], async (ctx) => {
    const btnNumber = ctx.message.text;
    ctx.session.isInFunctionMenu = false;
    ctx.session.waitingForFile = false;
    ctx.session.currentFunction = btnNumber;
    ctx.session.lastFunctionSelected = btnNumber;
    ctx.session.isProcessingFile = false;
    
    if (functions[btnNumber]) {
        try {
            await functions[btnNumber](ctx);
        } catch (error) {
            console.error(error);
            ctx.reply('Извините. Произошла ошибка');
        }
    } else {
        ctx.reply('Функция не найдена');
    }
})

bot.hears('Вернуться в меню', (ctx) => {
    if (!ctx.session.isInFunctionMenu) {
        ctx.session.isInFunctionMenu = true;
        ctx.session.waitingForFile = false;
        ctx.session.currentFunction = null;
        ctx.session.lastFunctionSelected = null;
        ctx.session.isProcessingFile = false;
        
        return showMainMenu(ctx);
    }
});

bot.on('document', async(ctx) => {
    if (ctx.session.isProcessingFile) {
        return;
    }

    ctx.session.isProcessingFile = true;
    
    if (ctx.session.waitingForFile && ctx.session.currentFunction) {
        await processFile(ctx);
    } 

    else if (ctx.session.lastFunctionSelected) {
        const btnNumber = ctx.session.lastFunctionSelected;
        
        ctx.session.waitingForFile = true;
        ctx.session.currentFunction = btnNumber;
        ctx.session.isInFunctionMenu = false;
        
        await processFile(ctx);
    }
    else {
        ctx.session.isInFunctionMenu = false;
        ctx.session.isProcessingFile = false;
        
        await ctx.reply(
            'Сначала выберите функцию из меню, а затем загрузите файл.\n' +
            'Нажмите "Вернуться в меню" чтобы выбрать функцию.',
            Markup.keyboard([
                ['Вернуться в меню']
            ]).resize()
        );
    }
});

async function processFile(ctx) {
    const document = ctx.message.document;
    const ext = path.extname(document.file_name).toLowerCase();

    if (ext !== '.xls' && ext !== '.xlsx') {
        ctx.session.isProcessingFile = false;
        return ctx.reply('Неверный формат файла! Попробуйте еще раз');
    }

    try {
        const fileLink = await ctx.telegram.getFileLink(document.file_id);

        const os = await import('os');
        const tempDir = os.tmpdir();
        const filePath = path.join(tempDir, `temp_${Date.now()}.xlsx`);

        const response = await axios.get(fileLink.href, {
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(filePath, response.data);

        const fileNotEmpty = await checkExcelFileContent(filePath);
        if (!fileNotEmpty) {
            ctx.session.isProcessingFile = false;
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return ctx.reply('Файл не содержит данных или содержит только заголовки. Загрузите файл с данными.');
        }

        const currentFunc = ctx.session.currentFunction;
        ctx.session.waitingForFile = false;
        
        switch(currentFunc) {
            case '1':
                await func1Handler(ctx, filePath);
                break;
            case '2':
                await func2Handler(ctx, filePath);
                break;
            case '3':
                await func3Handler(ctx, filePath);
                break;
            case '4':
                await func4Handler(ctx, filePath);
                break;
            case '5':
                await func5Handler(ctx, filePath);
                break;
            case '6':
                await func6Handler(ctx, filePath);
                break;
            default:
                ctx.reply('Ошибка: неизвестная функция');
        }

        ctx.session.currentFunction = null;
        ctx.session.isProcessingFile = false;
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    catch (err) {
        console.error('Ошибка обработки файла:', err);
        
        ctx.session.waitingForFile = false;
        ctx.session.currentFunction = null;
        ctx.session.isProcessingFile = false;
        
        if (err.message && err.message.includes('пустой')) {
            ctx.reply(err.message);
        } else {
            ctx.reply('Ошибка при обработке файла. Пожалуйста, попробуйте еще раз.');
        }
    }
}

async function checkExcelFileContent(filePath) {
    try {
        const XLSX = await import('xlsx');
        
        const workbook = XLSX.default.readFile(filePath);
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            console.log('Файл не содержит листов');
            return false;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        if (!worksheet) {
            console.log('Лист не найден');
            return false;
        }
        
        const data = XLSX.default.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Размер данных в файле:', data.length, 'строк');
        
        if (data.length <= 1) {
            console.log('Файл содержит только заголовки или пуст');
            return false;
        }
        
        for (let i = 1; i < Math.min(data.length, 50); i++) { 
            const row = data[i];
            if (Array.isArray(row)) {
                const hasData = row.some(cell => {
                    return cell !== null && 
                           cell !== undefined && 
                           cell !== '' && 
                           String(cell).trim() !== '';
                });
                
                if (hasData) {
                    return true;
                }
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('Ошибка проверки Excel файла:', error);
        return false;
    }
}

bot.help((ctx) => ctx.reply('/start - перезапуск бота\n' + 
    '/about - информация о создателе'))
bot.command('about', (ctx) => ctx.reply('Создателя зовут Екатерина Пчелкина, студентка IT-Top колледжа, группа 9/3-РПО-23/2.' +
    ' Данный бот сделан в рамках учебной/производственной практики от колледжа.'))
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

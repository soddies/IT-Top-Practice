const {
    Telegraf, 
    Markup,
    session
} = require('telegraf')

const fs = require('fs');
const axios = require('axios');
const path = require('path')

const func1Recipient = require('./functions/recipientFunctions/func1Recipient')
const func2Recipient = require('./functions/recipientFunctions/func2Recipient')
const func3Recipient = require('./functions/recipientFunctions/func3Recipient')
const func4Recipient = require('./functions/recipientFunctions/func4Recipient')
const func5Recipient = require('./functions/recipientFunctions/func5Recipient')
const func6Recipient = require('./functions/recipientFunctions/func6Recipient')

const func1Handler = require('./functions/functionsHandlers/func1Handler')
const func2Handler = require('./functions/functionsHandlers/func2Handler')
const func3Handler = require('./functions/functionsHandlers/func3Handler')
const func4Handler = require('./functions/functionsHandlers/func4Handler')
const func5Handler = require('./functions/functionsHandlers/func5Handler')
const func6Handler = require('./functions/functionsHandlers/func6Handler')

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
    
    return ctx.reply(
        'Выберите функцию: \n' +
        '\n1. Отчет по выставленному расписанию' +
        '\n2. Отчет по темам занятия' +
        '\n3. Отчет по студентам' +
        '\n4. Отчет по посещаемости студентов' +
        '\n5. Отчет по проверенным ДЗ' +
        '\n6. Отчет по сданным ДЗ',

        Markup.keyboard([
            ['1', '2'],
            ['3', '4'],
            ['5', '6']
        ]).resize()
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
        const filePath = path.join(__dirname, 'temp.xlsx');

        const response = await axios.get(fileLink.href, {
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(filePath, response.data);
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
        console.error(err);
        
        ctx.session.waitingForFile = false;
        ctx.session.currentFunction = null;
        ctx.session.isProcessingFile = false;
        
        ctx.reply('Ошибка при обработке файла');
    }
}

bot.help((ctx) => ctx.reply('/start - перезапуск бота\n' + 
    '/about - информация о создателе'))
bot.command('about', (ctx) => ctx.reply('Создателя зовут Екатерина Пчелкина, студентка IT-Top колледжа, группа 9/3-РПО-23/2.' +
    ' Данный бот сделан в рамках учебной/производственной практики от колледжа.'))
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

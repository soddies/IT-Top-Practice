const {
    Telegraf, 
    Markup,
    session
} = require('telegraf')

const fs = require('fs');
const axios = require('axios');

const path = require('path')

const func1 = require('./functions/defaultFunctions/func1')
const func2 = require('./functions/defaultFunctions/func2')
const func3 = require('./functions/defaultFunctions/func3')
const func4 = require('./functions/defaultFunctions/func4')
const func5 = require('./functions/defaultFunctions/func5')
const func6 = require('./functions/defaultFunctions/func6')

const func1Handler = require('./functions/fucntionsHandlers/func1Handler')
const func2Handler = require('./functions/fucntionsHandlers/func2Handler')
const func3Handler = require('./functions/fucntionsHandlers/func3Handler')
const func4Handler = require('./functions/fucntionsHandlers/func4Handler')
const func5Handler = require('./functions/fucntionsHandlers/func5Handler')
const func6Handler = require('./functions/fucntionsHandlers/func6Handler')

const functions = {
    '1': func1,
    '2': func2,
    '3': func3,
    '4': func4,
    '5': func5,
    '6': func6,
}

const bot = new Telegraf('8404536921:AAF93gBUmUhkwy0DIu6i-M-MX-C4jAha_yY')

bot.use(session({
    defaultSession: () => ({
        isInFunctionMenu: false,
        waitingForFile: false,
        currentFunctions: null
    })
}))

bot.start((ctx) => {
    ctx.session.isInFunctionMenu = false;
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
    return showMainMenu(ctx);
})


function showMainMenu(ctx) {
    ctx.session.isInFunctionMenu = true;
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
        return showMainMenu(ctx);
    }
});

bot.on('document', async(ctx) => {
    if (!ctx.session.waitingForFile || !ctx.session.currentFunctions) {
        ctx.session.isInFunctionMenu = false;
        await ctx.reply(
            'Сначала выберите функцию из меню, а затем загрузите файл.\n' +
            'Нажмите "Вернуться в меню" чтобы выбрать функцию.',
            Markup.keyboard([
                ['Вернуться в меню']
            ]).resize()
        );
        return;
    }

    const document = ctx.message.document;
    const ext = path.extname(document.file_name).toLowerCase();

    if (ext !== '.xls' && ext !== '.xlsx') {
        return ctx.reply('Неверный формат файла! Попробуйте еще раз');
    }

    try {
        const fileLink = await ctx.telegram.getFileLink(document.file_id);
        const filePath = path.join(__dirname, 'temp.xlsx');

        const response = await axios.get(fileLink.href, {
            responseType: 'arraybuffer'
        });

        fs.writeFileSync(filePath, response.data);

        ctx.session.waitingForFile = false;

        switch(ctx.session.currentFunctions) {
            case 'func1':
                await func1Handler(ctx, filePath);
                break;
            case 'func2':
                await func2Handler(ctx, filePath);
                break;
            case 'func3':
                await func3Handler(ctx, filePath);
                break;
            case 'func4':
                await func4Handler(ctx, filePath);
                break;
            case 'func5':
                await func5Handler(ctx, filePath);
                break;
            case 'func6':
                await func6Handler(ctx, filePath);
                break;
            default:
                ctx.reply('Ошибка: неизвестная функция');
        }

        ctx.session.currentFunctions = null;
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    catch (err) {
        console.error(err);
        ctx.session.waitingForFile = false;
        ctx.session.currentFunctions = null;
        ctx.reply('Ошибка при обработке файла');
    }
});

bot.help((ctx) => ctx.reply('/start - перезапуск бота\n' + 
    '/about - информация о создателе'))
bot.command('about', (ctx) => ctx.reply('Создателя зовут Екатерина Пчелкина, студентка IT-Top колледжа, группа 9/3-РПО-23/2.' +
    ' Данный бот сделан в рамках учебной/производственной практики от колледжа.'))
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

// отчет по посещаемости студентов
const { Markup } = require('telegraf');

module.exports = async (ctx) => {
    ctx.session.isInFunctionMenu = false;
    ctx.session.waitingForFile = true;
    ctx.session.currentFunctions = 'func4';
    
    await ctx.reply('*Вы выбрали: 4*', {parse_mode: "Markdown"});
    await ctx.reply("Пожалуйста, загрузите файл в формате XLS/XLSX", 
        Markup.keyboard([
            ['Вернуться в меню']
        ])
        .oneTime()
        .resize()
    );
};

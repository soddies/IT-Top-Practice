const { Markup } = require('telegraf');

module.exports = async (ctx) => {
    ctx.session.isInFunctionMenu = false;
    ctx.session.waitingForFile = true;
    ctx.session.currentFunctions = 'func1';
    
    await ctx.reply('*Вы выбрали: 1*', {parse_mode: "Markdown"});
    await ctx.reply("Пожалуйста, загрузите файл в формате XLS/XLSX", 
        Markup.keyboard([
            ['Вернуться в меню']
        ])
        .oneTime()
        .resize()
    );
};

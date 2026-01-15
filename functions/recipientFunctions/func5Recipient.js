// отчет по проверенным ДЗ
import { Markup } from "telegraf";

export default async (ctx) => {
    ctx.session.isInFunctionMenu = false;
    ctx.session.waitingForFile = true;
    ctx.session.currentFunctions = 'func5';
    
    await ctx.reply('*Вы выбрали: 5*', {parse_mode: "Markdown"});
    await ctx.reply("Пожалуйста, загрузите файл в формате XLS/XLSX", 
        Markup.keyboard([
            ['Вернуться в меню']
        ])
        .oneTime()
        .resize()
    );
};

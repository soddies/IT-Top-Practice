// отчет по темам занятия
import { Markup } from "telegraf";

export default async (ctx) => {
    ctx.session.isInFunctionMenu = false;
    ctx.session.waitingForFile = true;
    ctx.session.currentFunctions = 'func2';
    
    await ctx.reply('*Вы выбрали: 2*', {parse_mode: "Markdown"});
    await ctx.reply("Пожалуйста, загрузите файл в формате XLS/XLSX", 
        Markup.keyboard([
            ['Вернуться в меню']
        ])
        .oneTime()
        .resize()
    );
};

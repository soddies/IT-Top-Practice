const XLSX = require('xlsx');

async function func4Handler(ctx, filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});

        const teachers = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const fio = row[0];

            const attendance = parseFloat(row[10]);

            if (!isNaN(attendance)) {
                if (attendance <= 50) {
                    teachers.push({
                        fio,
                        attendance
                    });
                }
            }
        }

        if (teachers.length > 0) {
            let message = "*Преподаватели с низкой посещаемостью*\n\n";

            teachers.forEach((teach, index) => {
                message += `${index + 1}. ${teach.fio}\n`;
                message += `*Посещаемость:* ${teach.attendance}%\n\n`;
            })

            await ctx.reply(message, {parse_mode: "Markdown"});
        }
        else {
            await ctx.reply("Нет преподавателей с низкой посещаемостью.");
        }
    }
    catch (error) {
        console.error("Ошибка в функции: " + error);
        await ctx.reply("Произошла ошибка при обработке преподавателей");
    }
}

module.exports = func4Handler;

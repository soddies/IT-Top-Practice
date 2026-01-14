const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

async function func6Handlers(ctx, filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});

        const badStudents = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const fio = row[0];

            const group = row[2];
            const percentHW = parseFloat(row[19]);

            if (percentHW < 70) {
                badStudents.push({
                    fio,
                    group,
                    percentHW
                });
            }
        }

        if (badStudents.length > 0) {
            const studentsToShow = badStudents.slice(0, 10);
            const remainingStudents = badStudents.slice(10);
            
            let message = `*Студенты с % выполненных ДЗ ниже 70:*\n\n`;

            studentsToShow.forEach((student, index) => {
                message += `${index + 1}. ${student.fio}\n`;
                message += `*Группа:* ${student.group}\n`;
                message += `*Процент выполненных ДЗ:* ${student.percentHW}%\n\n`;
            });

            if (remainingStudents.length > 0) {
                let fileContent = "Оставшиеся студенты с % выполненных ДЗ ниже 70:\n\n";
                
                remainingStudents.forEach((student, index) => {
                    fileContent += `${index + 1 + 10}. ${student.fio}\n`;
                    fileContent += `Группа: ${student.group}\n`;
                    fileContent += `Процент выполненных ДЗ: ${student.percentHW}%\n\n`;
                });

                const fileName = `Студенты.txt`;
                const fileDir = path.dirname(filePath);
                const outputPath = path.join(fileDir, fileName);

                fs.writeFileSync(outputPath, fileContent, 'utf8');

                message += `*Еще ${remainingStudents.length} студент(ов) со слабой успеваемостью*\n`;
                message += `*Полный список сохранен в файл:* ${fileName}`;

                await ctx.reply(message, {parse_mode: "Markdown"});
                await ctx.replyWithDocument({
                    source: fs.createReadStream(outputPath),
                    filename: fileName
                });
            } else {
                await ctx.reply(message, {parse_mode: "Markdown"});
            }
        }
        else {
            await ctx.reply("Таких студентов в таблице нет");
        }
    }
    catch (error) {
        console.error("Ошибка в функции: " + error);
        await ctx.reply("Произошла ошибка при обработке студентов");
    }
}

module.exports = func6Handlers;

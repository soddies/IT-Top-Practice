import XLSX from 'xlsx'

async function func3Handler(ctx, filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const allStudentsBad = [];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const fio = row[0];
            const group = row[2];

            const homework = parseFloat(row[15]);
            const classroom = parseFloat(row[16]);

            if (!isNaN(homework) && !isNaN(classroom)) {
                if (homework == 1 && classroom >= 3) {
                    allStudentsBad.push({
                        fio,
                        group,
                        classroom,
                        homework
                    });
                }
            }
        }
        if (allStudentsBad.length > 0) {
            let message = "*Студенты с низкими оценками:* \n\n";

            allStudentsBad.forEach((student, index) => {
                message += `${index + 1}. ${student.fio}\n`;
                message += `*Группа:* ${student.group}\n`;
                message += `*Классная работа:* ${student.classroom}\n`;
                message += `*Домашняя работа:* ${student.homework}\n\n`;
            })

            message += `*Всего студентов: ${allStudentsBad.length}*`;

            await ctx.reply(message, {parse_mode: "Markdown"});
        }
        else {
            await ctx.reply("Студенты с низкими оценками не найдены.");
        }
    }
    catch (error) {
        console.log('Ошибка в функции: ' + error);
        await ctx.reply('Произошла ошибка при обработке студентов');
    }
}

export default func3Handler

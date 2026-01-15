import XLSX from 'xlsx'

async function func5Handler(ctx, filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});

        const badTeachersMonth = []; 
        const badTeachersWeek = [];  

        for (let i = 2; i < rows.length; i++) {
            const row = rows[i];

            if (!row[1] || row[1].trim() === "") {
                continue;
            }

            const fio = row[1].trim();

            const issuedMonth = parseFloat(row[3]) || 0;
            const verifiedMonth = parseFloat(row[5]) || 0;
            
            if (issuedMonth > 0) {
                const percentMonth = (verifiedMonth / issuedMonth) * 100;
                if (percentMonth < 70) {
                    badTeachersMonth.push({
                        name: fio,
                        percent: Math.round(percentMonth * 100) / 100,
                        verified: verifiedMonth,
                        issued: issuedMonth
                    });
                }
            }
            const issuedWeek = parseFloat(row[8]) || 0;
            const verifiedWeek = parseFloat(row[10]) || 0;
            
            if (issuedWeek > 0) {
                const percentWeek = (verifiedWeek / issuedWeek) * 100;
                if (percentWeek < 70) {
                    badTeachersWeek.push({
                        name: fio,
                        percent: Math.round(percentWeek * 100) / 100,
                        verified: verifiedWeek,
                        issued: issuedWeek
                    });
                }
            }
        }

        badTeachersMonth.sort((a, b) => a.percent - b.percent);
        badTeachersWeek.sort((a, b) => a.percent - b.percent);

        let message = "*Отчет по проверке ДЗ*\n\n";

        message += "*За МЕСЯЦ (процент проверки < 70%):*\n";
        if (badTeachersMonth.length === 0) {
            message += "Все преподаватели проверяют более 70% ДЗ за месяц!\n\n";
        } else {
            badTeachersMonth.forEach((teacher, index) => {
                message += `${index + 1}. ${teacher.name}\n`;
                message += `*Проверено:* ${teacher.verified} / ${teacher.issued}\n`;
                message += `*Процент:* ${teacher.percent}%\n\n`;
            });
            message += `*Всего за месяц:* ${badTeachersMonth.length}\n\n`;
        }

        message += "*За НЕДЕЛЮ (процент проверки < 70%):*\n";
        if (badTeachersWeek.length === 0) {
            message += "Все преподаватели проверяют более 70% ДЗ за неделю!\n";
        } else {
            badTeachersWeek.forEach((teacher, index) => {
                message += `${index + 1}. ${teacher.name}\n`;
                message += `*Проверено:* ${teacher.verified} / ${teacher.issued}\n`;
                message += `*Процент:* ${teacher.percent}%\n\n`;
            });
            message += `*Всего за неделю:* ${badTeachersWeek.length}`;
        }

        await ctx.reply(message, {parse_mode: "Markdown"});
    } 
    catch (error) {
        console.error("Ошибка в функции: " + error);
        await ctx.reply("Произошла ошибка при обработке проверенных ДЗ");
    }
}

export default func5Handler

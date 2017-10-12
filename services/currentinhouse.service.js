const sql = require("sqlite");
sql.open("./db/inhouseDB.sqlite");

module.exports = class LadderService {
    static addUser(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) {
                sql.run("INSERT INTO CurrentInHouse (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 1, 0]);
            } else {
                let curLevel = Math.floor(0.5 * Math.sqrt(row.points + 1));
                if (curLevel > row.level) {
                    row.level = curLevel;
                    sql.run(`UPDATE CurrentInHouse SET points = ${row.points + 1}, level = ${row.level} WHERE userId = ${message.author.id}`);
                    message.reply(`You've leveled up to level **${curLevel}**! Ain't that dandy?`);
                }
                sql.run(`UPDATE CurrentInHouse SET points = ${row.points + 1} WHERE userId = ${message.author.id}`);
            }
        })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS CurrentInHouse (userId TEXT, points INTEGER, level INTEGER)").then(() => {
                    sql.run("INSERT INTO CurrentInHouse (userId, points, level) VALUES (?, ?, ?)", [message.author.id, 1, 0]);
                });
            });
    }
    static getLevel(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("Your current level is 0");
            message.reply(`Your current level is ${row.level}`);
            console.log(row);
        });
    }
    static getPoints(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("sadly you do not have any points yet!");
            message.reply(`you currently have ${row.points} points, good going!`);
        });
    }
}
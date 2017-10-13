const sql = require("sqlite");
sql.open("./db/inhouseDB.sqlite");

//keeps track of all the players and their points

module.exports = class LadderService {
    static addUser(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) {
                sql.run("INSERT INTO ladder (userId, username, rank, points) VALUES (?, ?, ?, ?)", [message.author.id, message.author.username, "unranked", 0]);
            } else {
                if (row.rank == "UnRanked") {
                    message.reply(`You have already been added! But be sure to update your rank from unranked :D`);
                } else
                    message.reply(`You have already been added!`);
            }
        })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS ladder (userId TEXT, username TEXT, rank TEXT , points INTEGER)").then(() => {
                    sql.run("INSERT INTO ladder (userId, username, rank, points) VALUES (?, ?, ?, ?)", [message.author.id, message.author.username, my.inhouse.Ranks.unranked, 0]);
                });
            });
    }
    static getUser(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("Your current level is 0");
            message.reply(`Your current level is ${row.level}`);
            console.log(row);
        });
    }
    static updatePoints(message,username, points) {
        var result = "";
        sql.get(`SELECT * FROM ladder WHERE username ="${username}"`).then(row => {
            console.log(row.username);
            if (!row) {
                return false
            }
            else {
                sql.run(`UPDATE ladder SET points = ${row.points + points} WHERE username = ${username}`);
                return true;
            }

        }).catch(() => {
            console.error;
            message.reply("Please run the addUser command first to be added to the system.");            
        });
    }
    static updateRank(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) {
                message.reply("Please run the addUser command first to be added to the system.");
            } else {
                let curLevel = Math.floor(0.5 * Math.sqrt(row.points + 1));
                if (curLevel > row.level) {
                    row.level = curLevel;
                    sql.run(`UPDATE scores SET points = ${row.points + 1}, level = ${row.level} WHERE userId = ${message.author.id}`);
                    message.reply(`You've leveled up to level **${curLevel}**! Ain't that dandy?`);
                }
                sql.run(`UPDATE scores SET points = ${row.points + 1} WHERE userId = ${message.author.id}`);
            }
        })
            .catch(() => {
                console.error;
                message.reply("Please run the addUser command first to be added to the system.");                
            });
    }
}
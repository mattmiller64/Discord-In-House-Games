const sql = require("sqlite");
sql.open("./db/inhouseDB.sqlite");
var config = require('../config.json');

//keeps track of all the players and their points

var ranks = {
    unranked: 'unranked',
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold',
    platinum: 'platinum',
    diamond: 'diamond',
    masters: 'masters',
    challenger: 'challenger'
}

module.exports = class LadderService {
    static addUser(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) {
                sql.run("INSERT INTO ladder (userId, username, rank, points) VALUES (?, ?, ?, ?)", [message.author.id, message.author.username, ranks.unranked, 0]);
            } else {
                if (row.rank == ranks.unranked) {
                    message.reply(`You have already been added! But be sure to update your rank from unranked :D`);
                } else
                    message.reply(`You have already been added!`);
            }
        })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS ladder (userId TEXT, username TEXT, rank TEXT , points INTEGER)").then(() => {
                    sql.run("INSERT INTO ladder (userId, username, rank, points) VALUES (?, ?, ?, ?)", [message.author.id, message.author.username, ranks.unranked, 0]);
                });
            });
    }
    static availableRanks(message) {
        message.reply(`Type '${config.prefix}updateRank' followed by a space and your rank - Ex. ${config.prefix}updateRank${ranks.challenger} \n\nYour available ranks are ${ranks.unranked}, ${ranks.bronze}, ${ranks.silver}, ${ranks.gold}, ${ranks.platinum}, ${ranks.diamond}, ${ranks.masters}, ${ranks.challenger}`)
    }
    static getUserInfo(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("No User was found, please use the addUser command first.");
            message.reply(`Your current points: ${row.points}, and your current rank is ${row.rank} `);
            console.log(row);
        });
    }
    //BUGS - duplicate usernames will mess it up
    static updatePoints(message) {//expected .updatePoints <username> <points>
        var parts = message.content.split(" ");
        username = parts[1];
        var points = parts[2];
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
    static updateRank(message) { //expected .updateRank silver
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) {
                message.reply("Please run the addUser command first to be added to the system.");
            } else {
                var parts = message.content.split(" ");
                console.log(parts);
                if (parts.count() > 1) {
                    message.reply(`invalid command - must be in format : ${config.prefix}updateRank rank`)
                }
                if (isValidRank(parts[1])) {
                    sql.run(`UPDATE ladder SET rank = ${parts[1]} WHERE userId = ${message.author.id}`);
                    message.reply(`Rank successfully updated to ${parts[1]}`);
                }
                else {
                    message.reply(`Your rank entered of : ${parts[1]} is not a valid rank. use the command ${config.prefix}availableRanks for more help.`);
                }
            }
        })
            .catch(() => {
                console.error;
                message.reply("Please run the addUser command first to be added to the system.");
            });
    }
    static topForty(message) {
        sql.all(`SELECT * FROM ladder ORDER BY points DESC LIMIT 40`).then(rows => {
            var result = "\n";
            var counter = 1;
            if (!rows) {
                message.reply("No Users in the System");
            } else {
                console.log("here");
                console.log(rows.length);
                var t = 0;
                while(t < rows.length){
                    var element = rows[t];
                    console.log(element);
                    result += `rank: ${t+1}, player: ${element.username}, points: ${element.points}\n`;
                    t++;
                }

                message.reply(result);
            }
        })
            .catch(() => {
                console.error;
                message.reply("ERROR - Please run the addUser command first to be added to the system.");
            });
    }
    static isValidRank(parts) {
        if (parts == ranks.bronze || parts == ranks.challenger || parts == ranks.diamond || parts == ranks.gold || parts == ranks.masters || parts == ranks.platinum || parts == ranks.silver || parts == ranks.unranked)
            return true;
        else
            return false;
    }
}
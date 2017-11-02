'use babel';
'use strict';

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
    // expected .addUser
    static addUser(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
                if (!row) {
                    sql.run("INSERT INTO ladder (userId, username, rank, points,LastPointsUpdateDate) VALUES (?, ?, ?, ?,?)", [message.author.id, message.author.username, ranks.unranked, 0, new Date().toJSON().slice(0, 10).toString()])
                    .then(() => {
                        message.reply("You were successfully added, dont forget to add your rank by using the updateRank <rank> command, type availableRanks command for help.")
                    });
                } else {
                    if (row.rank == ranks.unranked) {
                        message.reply(`You have already been added! But be sure to update your rank from unranked :D`);
                    } else
                        message.reply(`You have already been added!`);
                }
            })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS ladder (userId TEXT, username TEXT, rank TEXT , points INTEGER, LastPointsUpdateDate TEXT)").then(() => {
                    sql.run("INSERT INTO ladder (userId, username, rank, points,LastPointsUpdateDate) VALUES (?, ?, ?, ?,?)", [message.author.id, message.author.username, ranks.unranked, 0, new Date().toJSON().slice(0, 10).toString()]);
                });
            });
    }
    // expected .availableRanks
    static availableRanks(message) {
        message.reply(`Type '${config.prefix}updateRank' followed by a space and your rank - Ex. ${config.prefix}updateRank ${ranks.challenger} \n\nYour available ranks are ${ranks.unranked}, ${ranks.bronze}, ${ranks.silver}, ${ranks.gold}, ${ranks.platinum}, ${ranks.diamond}, ${ranks.masters}, ${ranks.challenger}`)
    }
    // expected .standing
    static getUserInfo(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("No User was found, please use the addUser command first.");
            message.reply(`Your current points: ${row.points}, and your current rank is ${row.rank} `);
        });
    }
    //BUGS - duplicate usernames will mess it up
    //expected .updatePoints <username> <points>
    static updatePoints(message) {
        var parts = message.content.split(" ");
        var username = parts[1];
        var points = parts[2];
        //find userId
        sql.get(`SELECT * FROM ladder where username="${username}"`).then(row => {
            return this.addPoints(message, row.userId, points);
        }).catch(() => {
            return false;
        })

    }
    static addPoints(message, userId, points) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${userId}"`).then(row => {
            if (!row) {
                console.log("User of ID : " + userId + " was not found.");
                message.channel.send("A user was not found, please have an admin check the logs.")
                return false
            } else {
                var p = +row.points + +points;

                if (p < 0) { //ensure points dont go negative
                    p = 0;
                }
                sql.run(`UPDATE ladder SET points = ${p}, LastPointsUpdateDate = "${new Date().toJSON().slice(0, 10).toString()}" WHERE userId = "${userId}"`).then(row => {
                    return true;
                });
            }
        }).catch(() => {
            console.error;
            message.reply("Please run the addUser command first to be added to the system.");
        });
    }
    //expected .updateRank silver
    static updateRank(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}"`).then(row => {
                if (!row) {
                    message.reply("Please run the addUser command first to be added to the system.");
                } else {
                    var parts = message.content.split(' ');
                    if (parts.length > 2) {
                        message.reply(`invalid command - must be in format : ${config.prefix}updateRank rank`)
                    } else if (this.isValidRank(parts[1])) {
                        sql.run(`UPDATE ladder SET rank = "${parts[1].toLowerCase()}" WHERE userId = "${message.author.id}"`);
                        message.reply(`Rank successfully updated to ${parts[1]}`);
                    } else {
                        message.reply(`Your rank entered of : ${parts[1]} is not a valid rank. use the command ${config.prefix}availableRanks for more help.`);
                    }
                }
            })
            .catch(() => {
                console.error;
                message.reply("Error running sql command, please make sure you entered the correct command.");
            });
    }
    //expected .topForty
    static topForty(message) {
        sql.all(`SELECT * FROM ladder ORDER BY points DESC LIMIT 40`).then(rows => {
                var result = "\n";
                var counter = 1;
                if (!rows) {
                    message.reply("No Users in the System");
                } else {
                    var t = 0;
                    while (t < rows.length) {
                        var element = rows[t];
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
        if (parts.toLowerCase() == ranks.bronze || parts.toLowerCase() == ranks.challenger || parts.toLowerCase() == ranks.diamond || parts.toLowerCase() == ranks.gold || parts.toLowerCase() == ranks.masters || parts.toLowerCase() == ranks.platinum || parts.toLowerCase() == ranks.silver || parts.toLowerCase() == ranks.unranked)
            return true;
        else
            return false;
    }
}
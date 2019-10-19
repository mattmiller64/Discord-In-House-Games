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
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}" and serverId = "${message.guild.id}"`).then(row => {
                if (!row) {
                    sql.run("INSERT INTO ladder (userId, username, rank, points,LastPointsUpdateDate, serverId) VALUES (?, ?, ?, ?, ?, ?)", [message.author.id, message.author.username, ranks.unranked, 0, new Date().toJSON().slice(0, 10).toString(), message.guild.id])
                        .then(() => {
                            message.reply("You were successfully added, when you sign up, your rank will be stored!")
                        });
                } else {
                    message.reply(`You have already been added!`);
                }
            })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS ladder (userId TEXT, username TEXT, rank TEXT , points INTEGER, LastPointsUpdateDate TEXT, serverId TEXT)").then(() => {
                    sql.run("INSERT INTO ladder (userId, username, rank, points,LastPointsUpdateDate, serverId) VALUES (?, ?, ?, ?, ?, ?)", [message.author.id, message.author.username, ranks.unranked, 0, new Date().toJSON().slice(0, 10).toString(), message.guild.id]);
                });
            });
    }

    // expected .availableRanks
    static availableRanks(message) {
        message.reply(`Type '${config.prefix}updateRank' followed by a space and your rank - Ex. ${config.prefix}updateRank ${ranks.challenger} \n\nYour available ranks are ${ranks.unranked}, ${ranks.bronze}, ${ranks.silver}, ${ranks.gold}, ${ranks.platinum}, ${ranks.diamond}, ${ranks.masters}, ${ranks.challenger}`)
    }

    // expected .standing
    static getUserInfo(message) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}" and serverId = "${message.guild.id}"`).then(row => {
            if (!row) return message.reply("No User was found, please use the addUser command first.");
            message.reply(`Your current points: ${row.points}, and your current rank is ${row.rank} `);
        });
    }

    //BUGS - duplicate usernames will mess it up
    //expected .updatePoints <username> <points>
    static updatePoints(message) {
        var parts = message.content.split(" ");
        var user = message.mentions.members.first();
        var points = parts[2];
        if(!this.isInt(points))
        {
            console.log(`points value - ${points}`);
            message.channel.send("Command must be in the format ~updatePoints <username> <points>~ with points being a whole number, please try again.");
            return false;
        }
        console.log(user.id);
        sql.get(`SELECT * FROM ladder WHERE userId ="${user.id}" and serverId = "${message.guild.id}"`).then(row => {
            if (!row) {
                console.log("User of ID : " + user.id + " was not found.");
                message.channel.send("A user was not found, please have an admin check the logs.")
                return false
            } else {
                var p = +row.points + +points;

                if (p < 0) { //ensure points dont go negative
                    p = 0;
                }
                sql.run(`UPDATE ladder SET points = ${p}, LastPointsUpdateDate = "${new Date().toJSON().slice(0, 10).toString()}" WHERE userId = "${user.id}" and serverId = "${message.guild.id}"`).then(row => {
                    message.channel.send(`Points Successfully added - total points for user: ${p}`);
                    return true;
                }).catch(() => {
                    console.log("Something went wrong in UpdatePoints Function");
                    message.reply("Something went wrong for adding points to this user");
                });
            }
        }).catch(() => {
            console.error;
            message.reply("Please run the addUser command first to be added to the system.");
        });


    }

    static addPoints(message, userId, points) {
        sql.get(`SELECT * FROM ladder WHERE userId ="${userId}" and serverId = "${message.guild.id}"`).then(row => {
            if (!row) {
                console.log("User of ID : " + userId + " was not found.");
                message.channel.send("A user was not found, please have an admin check the logs.")
                return false
            } else {
                var p = +row.points + +points;

                if (p < 0) { //ensure points dont go negative
                    p = 0;
                }
                sql.run(`UPDATE ladder SET points = ${p}, LastPointsUpdateDate = "${new Date().toJSON().slice(0, 10).toString()}" WHERE userId = "${userId}" and serverId = "${message.guild.id}"`).then(row => {
                    message.channel.send(`Points Successfully added - total points for user: ${p}`);
                    return true;
                });
            }
        }).catch(() => {
            console.error;
            message.reply("Please run the addUser command first to be added to the system.");
        });
    }

    static riotUpdateRank(message, rank) {
        // sql.get(`SELECT * FROM ladder WHERE userId ="${message.author.id}" and serverId = "${message.guild.id}"`).then(row => {
        //     if (!row) {
        //         message.reply("Please run the addUser command first to be added to the system.");
        //     } else if (this.isValidRank(rank) && rank.toLowerCase() != row.rank) {
        //         sql.run(`UPDATE ladder SET rank = "${rank.toLowerCase()}" WHERE userId = "${message.author.id}" and serverId = "${message.guild.id}"`);
        //         message.reply(`Rank successfully updated to ${rank.toLowerCase()}`);
        //     }
        // });
    }

    //expected .updateRank @user silver
    static updateRank(message) {
        var user = message.mentions.members.first();

        if (!user) {
            message.reply("you must mention a user to use this command");
            return false;
        } else {
            user = user.user;
            console.log(user);
            sql.get(`SELECT * FROM ladder WHERE userId ="${user.id}" and serverId = "${message.guild.id}"`).then(row => {
                console.log(row);    
                if (!row) {
                        message.reply("Please run the addUser command first to be added to the system.");
                    } else {
                        var parts = message.content.split(' ');
                        if (parts.length != 3) {
                            message.reply(`invalid command - must be in format : ${config.prefix}updateRank @user rank`)
                        } else if (this.isValidRank(parts[2])) {
                            sql.run(`UPDATE ladder SET rank = "${parts[2].toLowerCase()}" WHERE userId = "${user.id}" and serverId = "${message.guild.id}"`);
                            message.reply(`Rank successfully updated to ${parts[2]}`);
                        } else {
                            message.reply(`Your rank entered of : ${parts[2]} is not a valid rank. use the command ${config.prefix}availableRanks for more help.`);
                        }
                    }
                })
                .catch(() => {
                    console.error;
                    message.reply("Error running sql command, please make sure you entered the correct command.");
                });
        }
    }

    //expected .topForty
    static topForty(message) {
        sql.all(`SELECT * FROM ladder Where serverId = "${message.guild.id}" ORDER BY points DESC`).then(rows => {
                var result = `\`\`\`ml\n`;
                var counter = 1;
                if (!rows) {
                    message.reply("No Users in the System");
                } else {
                    var t = 0;
                    while (t < rows.length) {
                        var element = rows[t];
                        var username = element.username.toLowerCase()
                                                        .split(' ')
                                                        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
                                                        .join(' ');
                        result += `${t+1}. player: ${username}, points: ${element.points}\n`;
                        t++;
                    }
                    result += "\`\`\`";
                    message.channel.send(result);
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

    static isInt(value) {
        return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
      }

}
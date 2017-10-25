const sql = require("sqlite");
sql.open("./db/inhouseDB.sqlite");
//keeps track of teams for a certain day

module.exports = class CurrentInHouseService {
    //user signs up, if not added to ladder database throws error.
    // if not added to ladder database throws warning
    // if signups arent open, throws warning
    // groups all sign ups in groups of ten and makes team even
    static signUp(message) { 
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
    // starts the sign ups for the current in-houses
    static startSignUps(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("Your current level is 0");
            message.reply(`Your current level is ${row.level}`);
            console.log(row);
        });
    }
    //this will also stop sign ups - if a team doesnt have 10 players, the team will disband
    static endSignUps(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("Your current level is 0");
            message.reply(`Your current level is ${row.level}`);
            console.log(row);
        });
    }
    //Re-opens the sign ups to allow last minute people to sign up
    static reOpenSignUps(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("Your current level is 0");
            message.reply(`Your current level is ${row.level}`);
            console.log(row);
        });
    }
    //called by another function to create all sets of teams? - have this auto make once 10 people are hit
    static makeTeams(message) {

    }
    //creates a team of 5 somehow
    static makeWholeTeam(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("sadly you do not have any points yet!");
            message.reply(`you currently have ${row.points} points, good going!`);
        });
    }
    //shows the list of current teams full or incomplete
    static showTeams(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("sadly you do not have any points yet!");
            message.reply(`you currently have ${row.points} points, good going!`);
        });
    }
    // ends the in-house for the day
    static endInhouse(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
            if (!row) return message.reply("sadly you do not have any points yet!");
            message.reply(`you currently have ${row.points} points, good going!`);
        });
    }
    //either average the number of points/ start from the highest and divy them out ie 2 diamonds, one on each team, 
    //3 diamonds, 2 on one team, next highest on the other until the points even out or 5 are added
    /*
        ie 5 diamonds and 3 golds and 2 bronze
        3 diamond on one team
        2 diamond on other, then puts 3 golds on this
        2 bronze on other
        challenger = 8 pts
        masters = 6 points
        diamond = 5 points
        plat = 4
        gold = 3
        silver = 2
        bronze = 1
        unranked = 3
    */
    static balanceTeams(){

    }
}
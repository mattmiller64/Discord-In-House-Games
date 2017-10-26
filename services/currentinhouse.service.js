const sql = require("sqlite");
sql.open("./db/inhouseDB.sqlite");
//keeps track of teams for a certain day

module.exports = class CurrentInHouseService {
    //mod starts the inhouse games 
    //user signs up, if not added to ladder database throws error.
    // if not added to ladder database throws warning
    // if signups arent open, throws warning
    // groups all sign ups in groups of ten and makes team even
    // starts the sign ups for the current in-houses
    static startSignUps(message) { //maybe creates an entry like inhouse1 and from this you can see the entire roster of inhouse 1, along with teams etc
        sql.get(`SELECT * FROM CurrentInHouse ORDER BY Id DESC LIMIT 1`).then(row => {
                //row gets the most recent game to increment the name from
                sql.run("INSERT INTO CurrentInHouse (InhouseId, name, date, created_by_id, created_by_username) VALUES (?, ?, ?, ?, ?)", [null, `InHouse${row.Id + 1}`,new Date().toJSON().slice(0, 10).toString(), message.author.id, message.author.username]);
            })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS CurrentInHouse (InhouseId INTEGER PRIMARY KEY, name TEXT, date TEXT, created_by_id TEXT, created_by_username TEXT)").then(() => {
                    sql.run("INSERT INTO CurrentInHouse (InhouseId, name, date, created_by_id, created_by_username) VALUES (?, ?, ?, ?, ?)", [null, "InHouse1", new Date().toJSON().slice(0, 10).toString(), message.author.id, message.author.username]);
                })
                .catch(()=>{console.log("Fatal Error Occured.")});
            });
    }
    //allows a user to sign up, must already be in the ladder db
    static signUp(message) {

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
    // static makeTeams(message) {

    // }
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
    static balanceTeams() {

    }
}
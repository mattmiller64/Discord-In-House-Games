const sql = require("sqlite");
sql.open("./db/inhouseDB.sqlite");
var LadderService = require('./ladder.service');
//keeps track of teams for a certain day

module.exports = class CurrentInHouseService {
    //mod starts the inhouse games 
    //user signs up, if not added to ladder database throws error.
    // if not added to ladder database throws warning
    // if signups arent open, throws warning
    // groups all sign ups in groups of ten and makes team even
    // starts the sign ups for the current in-houses
    static startSignUps(message) { //maybe creates an entry like inhouse1 and from this you can see the entire roster of inhouse 1, along with teams etc
        sql.get(`SELECT * FROM CurrentInHouse ORDER BY InhouseId DESC LIMIT 1`).then(row => {
            //row gets the most recent game to increment the name from
            sql.run("INSERT INTO CurrentInHouse (InhouseId, inhouseName, date, created_by_id, created_by_username) VALUES (?, ?, ?, ?, ?)", [null, `InHouse${row.InhouseId + 1}`,
                new Date().toJSON().slice(0, 10).toString(), message.author.id, message.author.username
            ])
        })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS CurrentInHouse (InhouseId INTEGER PRIMARY KEY, inhouseName TEXT, date TEXT, created_by_id TEXT, created_by_username TEXT)").then(() => {
                    sql.run("INSERT INTO CurrentInHouse (InhouseId, inhouseName, date, created_by_id, created_by_username) VALUES (?, ?, ?, ?, ?)", [null, "InHouse1",
                        new Date().toJSON().slice(0, 10).toString(), message.author.id, message.author.username
                    ]);
                })
                    .catch(() => {
                        console.log("Creating and inserting into CurrentInHouse - error occured")
                    });
            });
    }
    //allows a user to sign up, must already be in the ladder db
    static signUp(message) {
        sql.get(`SELECT * FROM CurrentInHouse ORDER BY InhouseId DESC LIMIT 1`).then(row => {
            //row gets the most recent game to use as the InhouseId
            //CHECK TO SEE IF THEY ALREADY SIGNED UP
            sql.get(`SELECT * FROM ladder where userId = "${message.author.id}"`).then((isContained) => {
                if (!isContained) {
                    message.reply(`You must use the addUser command and setRank commands before you sign up so that we can properly balance teams.`)
                    return false;
                }
                sql.get(`SELECT * FROM InHouseRoster Where playerId = "${message.author.id}" AND InhouseId = "${row.InhouseId}"`).then((row2) => {
                    if (row2) {
                        message.reply("You have already signed up for todays InHouses");
                        return false;
                    }
                    // TODO: NEED TO CHECK TO MAKE SURE THEY ARE IN THE LADDER? - should we add the ladder id to the roster rather than the player info? - who knows, but im doing it my way
                    if (!row2) {
                        //if not found, go ahead and add them               
                        sql.run("INSERT INTO InHouseRoster (RosterId, InhouseId, playerName,playerId, date) VALUES (?, ?, ?, ?, ?)", [null, row.InhouseId, message.author.username,
                            message.author.id, new Date().toJSON().slice(0, 10).toString()
                        ]).then(() => {
                            message.reply('You have been successfully added to the inhhouse games! May the odds be ever in your favor.');
                            return true;
                        })
                    }
                }) //if the db doesnt exist then they must not have been added so create the table and add them as well, set up the team and RosterTeamBridge db
                    .catch(() => {
                        console.log('inhouseroster db does not exist, creating db then inserting user')
                        console.error;
                        sql.run("CREATE TABLE IF NOT EXISTS InHouseRoster (RosterId INTEGER PRIMARY KEY, InhouseId INTEGER, playerName TEXT, playerId TEXT, date TEXT)").then(() => {
                            sql.run("INSERT INTO InHouseRoster (RosterId, InhouseId, playerName,playerId, date) VALUES (?, ?, ?, ?, ?)", [null, row.InhouseId, message.author.username,
                                message.author.id, new Date().toJSON().slice(0, 10).toString()
                            ])
                            sql.run("CREATE TABLE IF NOT EXISTS RosterTeamBridge (RosterId INTEGER, TeamId INTEGER, InhouseId INTEGER)");
                            sql.run("CREATE TABLE IF NOT EXISTS Team (TeamId INTEGER PRIMARY KEY, teamName TEXT,InhouseId INTEGER, VsId INTEGER, isWinner TEXT)");
                            message.reply('You have been successfully added to the inhhouse games! May the odds be ever in your favor.');
                            return true;
                        });
                    });
            })

        })

    }
    static leftover(message) {
        sql.all(`Select ihr.* from InHouseRoster ihr 
        Left join RosterTeamBridge rtb
            ON ihr.RosterId = rtb.RosterId AND ihr.inhouseId = rtb.inhouseId
        Where rtb.RosterId is null AND ihr.inhouseId = ${inhouseid}
        `).then((rows) => {
                if (!rows) {
                    messae.reply("Everyone is currently signed up with a team :) (or no people have signed up)")
                }
                message.reply(`There are ${rows.length} people that have not been matched to a team, WE NEED ${(10 - rows.length)} MORE LETS GO!!!`)
            })
    }

    static createTeams(message) { // if there is not enough to make teams, make sure we drop the newest added. (order by id cause date sorting sucks)
        //get people ordered by rosterId joined with ladder table to get ranks
        sql.get(`SELECT * FROM CurrentInHouse ORDER BY InhouseId DESC LIMIT 1`).then(ihd => {
            sql.get(`SELECT COUNT(*) as count from InHouseRoster where InhouseId = ${ihd.InhouseId} AND RosterId not in (Select RosterId from RosterTeamBridge)`).then((row) => { //dont get people already on a team
                if (!row) {
                    message.reply("no one has signed up yet!")
                    return true;
                }
                var leftover = row.count - (row.count % 10);
                sql.all(`SELECT ihr.RosterId, ihr.InhouseId,ihr.playerName,ihr.playerId,ihr.date,l.Rank
            FROM InHouseRoster ihr
                LEFT JOIN ladder l
                    ON ihr.playerId = l.userId
            where ihr.RosterId not in (Select RosterId from RosterTeamBridge)  AND ihr.inhouseId = "${ihd.InhouseId}"
            ORDER BY ihr.RosterId LIMIT ${leftover}`).then((result) => {
                        //this function should separate the teams based on rank - simple averaging formula used - could eventually upgrade it but meh
                        //potential bug - if 20 people sign up too fast to keep up with - this isnt async, so it should be ok? handle this later
                        this.balanceTeams(message, result, ihd.InhouseId);
                    });
            })
        })
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
    static balanceTeams(message, result, inhouseId) { //highly inneficient
        //build avg ranking points and sort by highest elo
        console.log("balancing teams");
        var playerAverage = 0;
        var teamAverage = 0;
        result = result.sort(function (a, b) {
            var ta = CurrentInHouseService.rankNumValue(a.rank);
            var tb = CurrentInHouseService.rankNumValue(b.rank);
            if (ta < tb)
                return 1;
            else if (ta > tb)
                return -1;
            else
                return 0;
        });
        var teamsNeeded = result.length / 5; //since 5 people per team

        for (var count = 0; count < result.length; count++) {
            //this loop will iterate through each team
            playerAverage += CurrentInHouseService.rankNumValue(result[count]);
        }
        playerAverage /= result.length;
        teamAverage = playerAverage * 5;
        console.log("here");

        var teamsArray = new Array(teamsNeeded);
        var totalRuns = 0; // iterator to go over all the players
        //FOR NOW - we will just drop higher elo until over ie put a diamond on each team until out of diamonds, then continue down the line (this is not terribly balanced, but it works)
        for (var runs = 0; runs < 5; runs++) { //need to add 5 players to a team
            for (var count = 0; count < teamsNeeded; count++) { //goes through the list sequentially and adds the next player of highest elo (this isnt balanced)
                if (!teamsArray[count]) {
                    teamsArray[count] = [];
                }
                teamsArray[count].push(result[totalRuns]);
                totalRuns++;
            }
        }
        for (var taco = 0; taco < (teamsNeeded); taco += 2) {//adds team to database by 2's
            console.log(taco);
            this.addTeamDb(teamsArray[taco], teamsArray[taco + 1], inhouseId, message, taco + 1, taco + 2);
        }
        // var team1points = 0;
        // var team1members = 0;
        // var team2members = 0;
        // var team2points = 0;
        // var team2 = [];
        // var team1 = [];
        // //divy out highest elo players trying to keep teams even
        // for (var count = 0; count < 10; count++) {
        //     var p = CurrentInHouseService.rankNumValue(result[count].rank);
        //     //team 2 needs members
        //     if (team1points > team2points && team2members != 5) {
        //         team2members++;
        //         team2points += p;
        //         team2.push(result[count]);
        //     }
        //     //team 1 needs members
        //     else if (team2points > team1points && team1members != 5) {
        //         team1members++;
        //         team1points += p;
        //         team1.push(result[count]);
        //     }
        //     //these last 2 functions are just catch alls, since we dont have a greater or equal, this basically implies the 2 points are the same
        //     //team 1 needs the member
        //     else if (team1members > team2members && team1members != 5) //if team1 has the same points but more members, means the need the next highest elo person
        //     {
        //         team1members++;
        //         team1points += p;
        //         team1.push(result[count]);
        //     }
        //     //same as above but reversed
        //     else if (team2members > team1members && team2members != 5) {
        //         team2members++;
        //         team2points += p;
        //         team2.push(result[count]);
        //     }
        //     //else we just add a member to team 1
        //     else if (team1members != 5) {
        //         team1members++;
        //         team1points += p;
        //         team1.push(result[count]);
        //     }
        //     //else add member to team 2
        //     else if (team2members != 5) {
        //         team2members++;
        //         team2points += p;
        //         team2.push(result[count]);
        //     }
        // }

        //Create Team X and Y in the db - do we need them to have a vs column? probs not tbh these should be made together - odd always plays the +1 even ie team 13 palys team 14 team 1 plays team 2
        // this.addTeamDb(team1, team2, inhouseId, message);
    }

    static addTeamDb(team1, team2, inhouseId, message, num1, num2) {
        console.log("add team db")
        var teamId = null;
        console.log("team1", team1);
        console.log("team2", team2);
        //Create team 1
        sql.run("INSERT INTO Team (TeamId, teamName, InhouseId, VsId, isWinner) VALUES (?, ?, ?, ?, ?)", [null, `Team${num1}`, inhouseId, null, "not played"]).then((row) => {
            //insert the 5 players into this team using row.lastID as teamID
            teamId = row.lastID;
            for (var i = 0; i < 5; i++) {
                sql.run("INSERT INTO RosterTeamBridge (RosterId, TeamId,InhouseId) VALUES (?, ?, ?)", [team1[i].RosterId, row.lastID, inhouseId])
            }
        }).then(() => {
            //create team 2
            sql.run("INSERT INTO Team (TeamId, teamName, InhouseId, VsId, isWinner) VALUES (?, ?, ?, ?, ?)", [null, `Team${num2}`, inhouseId, teamId, "not played"]).then((row) => {
                //insert the 5 players into this team using row.lastID as teamID
                sql.run(`Update TEAM SET VsId = "${row.lastID}" WHERE TeamId = "${teamId}"`);
                for (var i = 0; i < 5; i++) {
                    sql.run("INSERT INTO RosterTeamBridge (RosterId, TeamId,InhouseId) VALUES (?, ?, ?)", [team2[i].RosterId, row.lastID, inhouseId]);
                }
            })
        }).then(() => {

            this.displayNewTeam(message, team1, team2, num1, num2)
        });

    }

    static rankNumValue(rank) { // idealy we would just have a table called ranks with the rank name and point value and join the tables together but meh, later
        //if we cant figure it out, they are worth 3
        var points = 3;
        if (rank == "challenger") //switch statement? meh
            points = 8;
        else if (rank == "masters")
            points = 7;
        else if (rank == "diamond")
            points = 6;
        else if (rank == "platinum")
            points = 4;
        else if (rank == "gold")
            points = 3;
        else if (rank == "silver")
            points = 2;
        else if (rank == "bronze")
            points = 1;
        return points;
    }

    //Re-opens the sign ups to allow last minute people to sign up - i believe this doesnt need to do anything in the database
    static reOpenSignUps(message) {
        message.channel.send("Sign Ups are reopenned, use the signUp command to signup!!!")
    }

    // adds points to the winners and detracts from the losers expects .winner team1
    static winner(message) {
        var parts = message.content.split(" ");
        var teamName = parts[1];
        sql.get(`SELECT * FROM CurrentInHouse ORDER BY InhouseId DESC LIMIT 1`).then(r => {
            // expected .updatePoints <username> <points>
            sql.get(`SELECT * FROM Team WHERE teamName ="${teamName}" AND InhouseId="${r.InhouseId}"`).then(row => {
                if (row.isWinner == "true" || row.isWinner == "false") {
                    message.reply("These teams have already played.")
                    return true;
                }
                sql.run(`UPDATE Team SET isWinner = "true" where TeamId = "${row.TeamId}"`);
                sql.run(`UPDATE Team SET isWinner = "false" where TeamId = "${row.VsId}"`);
                if (!row) return message.reply("There is no team by that team name in the latest inhouse");
                //get winning team by using row.TeamId
                sql.all(`SELECT  *
                FROM RosterTeamBridge rtb 
                    LEFT JOIN InHouseRoster ihr
                        ON rtb.RosterId = ihr.RosterId
                where rtb.TeamId = "${row.TeamId}" AND rtb.InhouseId="${r.InhouseId}"`).then(rows => {
                        for (var i = 0; i < rows.length; i++)
                            LadderService.addPoints(message, rows[i].playerId, 5);
                    })
                //get losing team by using row.VsId
                sql.all(`SELECT  *
                FROM RosterTeamBridge rtb 
                    LEFT JOIN InHouseRoster ihr
                        ON rtb.RosterId = ihr.RosterId
                where rtb.TeamId = "${row.VsId}" AND rtb.InhouseId="${r.InhouseId}"`).then(rows1 => {
                        for (var i = 0; i < rows1.length; i++)
                            LadderService.addPoints(message, rows1[i].playerId, -2);
                    }).then(taco => { //Promise still not waiting correctly
                        setTimeout(function () { //wonky way to make it wait a sec and the updates should be finished, not stable
                            message.channel.send("Points updated");
                            LadderService.topForty(message);
                            return true;
                        }, 5000);
                    })
            });
        })
    }
    /* //creates a premade team of 5 somehow
     static makeWholeTeam(message) {
         return true;
         sql.get(`SELECT * FROM CurrentInHouse WHERE userId ="${message.author.id}"`).then(row => {
             if (!row) return message.reply("sadly you do not have any points yet!");
             message.reply(`you currently have ${row.points} points, good going!`);
         });
     }
    */

    //shows the list of current teams that are created - played and unplayed matches.
    static showTeams(message) {
        sql.get(`SELECT * FROM CurrentInHouse ORDER BY InhouseId DESC LIMIT 1`).then(row => {
            sql.all(`SELECT ihr.RosterId, ihr.InhouseId,ihr.playerName,ihr.playerId,ihr.date,t.TeamId, t.teamName, t.isWinner, l.rank
        FROM InHouseRoster ihr
            LEFT JOIN RosterTeamBridge r
                ON ihr.Rosterid = r.RosterId
            Left JOIN Team t
                ON r.TeamId = t.TeamId
            Left JOIN Ladder l
                ON ihr.playerId = l.userId
            where ihr.RosterId in (Select RosterId from RosterTeamBridge)  AND ihr.inhouseId = "${row.InhouseId}"
        ORDER BY t.TeamId asc`).then(rows => {
                    if (!rows) return message.reply("There are no teams Yet!!!");
                    if (rows.length == 0) return message.channel.send("There are no teams yet!!!!")
                    // TODO add reply to channel
                    var reply = "\`\`\`";
                    message.channel.send(`There are some teams here :D`);
                    for (var i = 0; i < rows.length; i++) {
                        if (i % 10 == 0 && i!=0) {
                            reply += `\`\`\`
                            \`\`\``
                        }
                        if (i % 5 == 0) {
                            var winnerText = "Not Played Yet"
                            if (rows[i].isWinner == "true") {
                                winnerText = "Won";
                            } else if (rows[i].isWinner == "false") {
                                winnerText = "Lost"
                            }
                            reply += `\n\n***** ${rows[i].teamName} - ${winnerText} *****\n`
                        }
                        reply += (`player name: ${rows[i].playerName}, rank: ${rows[i].rank}\n`);

                    }
                    reply += "\`\`\`"
                    message.channel.send(reply);

                });
        })
    }
    static displayNewTeam(message, team1, team2, num1, num2) {
        var reply = `\`\`\`2 NEW TEAMS have been created, please type showTeams to view all teams\n***** Team ${num1} *****\n`;
        for (var i = 0; i < 5; i++) {
            reply += (`player name: ${team1[i].playerName}, rank: ${team1[i].rank}\n`);
        }
        reply += `\n\nVERSUS\n\n\n***** Team ${num2} *****\n`;
        for (var i = 0; i < 5; i++) {
            reply += (`player name: ${team2[i].playerName}, rank: ${team2[i].rank}\n`);
        }
        reply += `\`\`\``
        message.channel.send(reply);
    }
    // TODO: ends the in-house for the day
    //right now this is just a flag, to reset they have to hit .startSignUps, otherwise the code will always use the most recently done inhouse
    static endInhouse(message) {
        message.channel.send("Sign Ups are now over, to reopen use the reopen command, otherwise be sure every team's winners and losers are entered using the winner command.")
        return true;
    }
}
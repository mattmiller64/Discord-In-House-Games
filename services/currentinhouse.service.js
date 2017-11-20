const sql = require("sqlite");
sql.open("./db/inhouseDB.sqlite");
var LadderService = require('./ladder.service');
const snekfetch = require('snekfetch');

module.exports = class CurrentInHouseService {
    //mod starts the inhouse games 
    //user signs up, if not added to ladder database throws error.
    // if not added to ladder database throws warning
    // if signups arent open, throws warning
    // groups all sign ups in groups of ten and makes team even
    // starts the sign ups for the current in-houses
    static startSignUps(message) { //maybe creates an entry like inhouse1 and from this you can see the entire roster of inhouse 1, along with teams etc
        sql.get(`SELECT * FROM CurrentInHouse where serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(row => {
                //row gets the most recent game to increment the name from
                sql.run("INSERT INTO CurrentInHouse (InhouseId, inhouseName, date, created_by_id, created_by_username, isOpen, serverId) VALUES (?, ?, ?, ?, ?, ?, ?)", [null, "InHouse1",
                    new Date().toJSON().slice(0, 10).toString(), message.author.id, message.author.username, "true", message.guild.id
                ]).then(result => {
                    message.channel.send(
                        `Inhouse #${result.lastID} is open. Please use: signup <username> to participate\nPlease enter your username **WITH** special characters, this helps with balancing!)`)
                })
            })
            .catch(() => {
                console.error;
                sql.run("CREATE TABLE IF NOT EXISTS CurrentInHouse (InhouseId INTEGER PRIMARY KEY, inhouseName TEXT, date TEXT, created_by_id TEXT, created_by_username TEXT, isOpen TEXT, serverId TEXT)").then(() => {
                        sql.run("INSERT INTO CurrentInHouse (InhouseId, inhouseName, date, created_by_id, created_by_username, isOpen, serverId) VALUES (?, ?, ?, ?, ?, ?, ?)", [null, "InHouse1",
                            new Date().toJSON().slice(0, 10).toString(), message.author.id, message.author.username, "true", message.guild.id
                        ]);
                    })
                    .catch(() => {
                        console.log("Creating and inserting into CurrentInHouse - error occured")
                    });
            });
    }

    static setInhouseStatus(message, status) {
        return new Promise((resolve, reject) => {
            sql.get(`SELECT * FROM CurrentInHouse where serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(row => {
                if (!row) {
                    message.channel.send(`no inhouses found for this server, please use the openinhouse command`);
                } else {
                    console.log('status', status);
                    sql.run(`UPDATE CurrentInHouse SET isOpen = "${status}" WHERE InhouseId = "${row.InhouseId}" AND serverId = "${message.guild.id}"`).then(() => {
                        resolve(true);
                    }).catch(() => {
                        reject(false);
                    })
                }
            })
        })
    }

    static areInHousesOpen(message) {
        return new Promise((resolve, reject) => {
            sql.get(`SELECT * FROM CurrentInHouse where serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(row => {
                console.log(row);
                if (!row) {
                    message.channel.send(`no inhouses found for this server, please use the openinhouse command`);
                } else {
                    if (row.isOpen == "true") {
                        console.log('true returned');
                        resolve(true);
                    } else if (row.isOpen == "false") {
                        resolve(false);
                    } else {
                        message.channel.send("could not parse result");
                    }
                }
            })
        })
    }
    //allows a user to sign up, must already be in the ladder db
    static signUp(message) {
        //ping riot api to get users rank
        var parts = message.content.split(" ");
        //update rank
        var summonerName = ""
        for (var i = 1; i < parts.length; i++) {
            summonerName += parts[i];
        }
        if (parts.length == 1) {
            message.reply('must be in format signup <summoner name>');
            return false;
        }
        var summonerId = 0;
        var rank = 'unranked';
        snekfetch.get('https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/' + summonerName + '?api_key=RGAPI-ca99041e-f455-4571-be1c-4d6e5c8d24a7')
            .then(r => {
                summonerId = r.body.id
                snekfetch.get('https://na1.api.riotgames.com/lol/league/v3/positions/by-summoner/' + summonerId + '?api_key=RGAPI-ca99041e-f455-4571-be1c-4d6e5c8d24a7')
                    .then(r => {
                        for (var i = 0; i < r.body.length; i++) {
                            if (r.body[i].queueType == 'RANKED_SOLO_5x5') {
                                rank = r.body[i].tier;
                                break;
                            }
                        }
                        LadderService.riotUpdateRank(message, rank);
                    }).catch(err => {
                        console.log(err);
                        message.reply(`error fetching rank from riot api`)
                    });
            }).catch(err => {
                console.log(err);
                message.reply(`error fetching user from riot api`)
            });
        //signup for inhouse
        sql.get(`SELECT * FROM CurrentInHouse where serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(row => {
            //row gets the most recent game to use as the InhouseId
            //CHECK TO SEE IF THEY ALREADY SIGNED UP
            sql.get(`SELECT * FROM ladder where userId = "${message.author.id}" and serverId = "${message.guild.id}"`).then((isContained) => {
                if (!isContained) {
                    message.reply(`You must use the addUser command and setRank commands before you sign up so that we can properly balance teams.`)
                    return false;
                }
                sql.get(`SELECT * FROM InHouseRoster Where playerId = "${message.author.id}" AND InhouseId = "${row.InhouseId}" and serverId = "${message.guild.id}" AND RosterId not in (SELECT RosterId from RosterTeamBridge rtb 
                left join Team t on rtb.TeamId = t.TeamId 
                Where rtb.InhouseId = '${row.InhouseId}' AND t.isWinner != 'not played')`).then((row2) => {
                        if (row2) {
                            message.reply("You have already signed up for todays InHouses");
                            return false;
                        }
                        if (!row2) {
                            //if not found, go ahead and add them               
                            sql.run("INSERT INTO InHouseRoster (RosterId, InhouseId, playerName,playerId, date, nickname, serverId) VALUES (?, ?, ?, ?, ?, ?, ?)", [null, row.InhouseId, message.author.username,
                                message.author.id, new Date().toJSON().slice(0, 10).toString(), message.member.nickname, message.guild.id
                            ]).then(() => {
                                message.reply('You have been successfully added to the inhhouse games! May the odds be ever in your favor.');
                                return true;
                            })
                        }
                    }) //if the db doesnt exist then they must not have been added so create the table and add them as well, set up the team and RosterTeamBridge db
                    .catch(() => {
                        console.log('inhouseroster db does not exist, creating db then inserting user')
                        console.error;
                        sql.run("CREATE TABLE IF NOT EXISTS InHouseRoster (RosterId INTEGER PRIMARY KEY, InhouseId INTEGER, playerName TEXT, playerId TEXT, date TEXT, nickname TEXT, serverId TEXT)").then(() => {
                            sql.run("INSERT INTO InHouseRoster (RosterId, InhouseId, playerName, playerId, date, nickname, serverId) VALUES (?, ?, ?, ?, ?, ?, ?)", [null, row.InhouseId, message.author.username,
                                message.author.id, new Date().toJSON().slice(0, 10).toString(), message.member.nickname, message.guild.id
                            ])
                            sql.run("CREATE TABLE IF NOT EXISTS RosterTeamBridge (RosterId INTEGER, TeamId INTEGER, InhouseId INTEGER, serverId TEXT)");
                            sql.run("CREATE TABLE IF NOT EXISTS Team (TeamId INTEGER PRIMARY KEY, teamName TEXT,InhouseId INTEGER, VsId INTEGER, isWinner TEXT, serverId TEXT)");
                            message.reply('You have been successfully added to the inhhouse games! May the odds be ever in your favor.');
                            return true;
                        });
                    });
            })
        })
    }
    //check to see if they are on a team that has played, if not, they can be removed
    static removeFromInhouse(message) {
        sql.get(`SELECT * FROM CurrentInHouse where serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(ihd => {
            sql.run(`DELETE from InHouseRoster where InhouseId = "${ihd.InhouseId}" AND playerId = "${message.author.id}" and serverId = "${message.guild.id}" AND RosterId not in (SELECT RosterId from RosterTeamBridge where inhouseId = "${ihd.InhouseId}")`).then((result) => {
                if (result.changes > 0) {
                    message.reply("You have been removed from the inhouses")
                } else {
                    message.reply("It looks like you have not been signed up yet or you already are in a team. - if you are already in a team, please contact a moderator to fix the issue")
                }
            })
        })
    }
    static leftover(message) {
        sql.get(`SELECT * FROM CurrentInHouse where serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(ihd => {
            sql.all(`Select ihr.* from InHouseRoster ihr 
        Left join RosterTeamBridge rtb
            ON ihr.RosterId = rtb.RosterId AND ihr.InhouseId = rtb.InhouseId
        Where rtb.RosterId is null AND ihr.InhouseId = "${ihd.InhouseId}" and ihr.serverId = "${message.guild.id}"
        `).then((rows) => {
                if (!rows) {
                    message.reply("Everyone is currently signed up with a team :) (or no people have signed up)")
                }
                if (rows.length % 10 == 0)
                    message.reply(`There are ${rows.length} people signed up that have not been matched to a team`);
                else
                    message.reply(`There are ${rows.length} people signed up that have not been matched to a team, WE NEED ${(10 - rows.length % 10)} MORE LETS GO!!!`)
            })
        })
    }

    static laddersignups(message) {
        sql.get(`SELECT * FROM CurrentInHouse where serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(ihd => {
            sql.all(`Select ihr.* from InHouseRoster ihr 
            LEFT JOIN RosterTeamBridge rtb
                on ihr.RosterId = rtb.RosterId
            Left Join Team t
                on rtb.TeamId = t.TeamId
        WHERE ihr.InhouseId = "${ihd.InhouseId}" AND t.TeamId is null AND ihr.serverId = "${message.guild.id}"
        `).then((rows) => {
                if (!rows || rows.length == 0) {
                    message.reply("No one has signed up yet (╯°□°）╯︵ ┻━┻")
                } else {
                    var reply = `\`\`\`**Current Players Signed Up**\n`
                    for (var i = 0; i < rows.length; i++) {
                        var name = rows[i].nickname;
                        if (!name)
                            name = rows[i].playerName
                        reply += (`${i + 1}. ${name} \n`);
                    }
                    reply += `\`\`\``
                    message.channel.send(reply);
                }
            })
        })
    }
    static createTeams(message) { // if there is not enough to make teams, make sure we drop the newest added. (order by id cause date sorting sucks)
        //get people ordered by rosterId joined with ladder table to get ranks
        sql.get(`SELECT * FROM CurrentInHouse WHERE serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(ihd => {
            sql.get(`SELECT COUNT(*) as count from InHouseRoster where serverId = "${message.guild.id}" AND InhouseId = "${ihd.InhouseId}" AND RosterId not in (Select RosterId from RosterTeamBridge)`).then((row) => { //dont get people already on a team
                if (!row || row.count < 10) {
                    message.reply("no one/ not enough people have signed up yet that are not already on teams! Use the leftover command to see how many are missing or show teams to see those currently on a team.")
                    return true;
                }
                var leftover = row.count - (row.count % 10);
                sql.all(`SELECT ihr.*, l.*
            FROM InHouseRoster ihr
                LEFT JOIN ladder l
                    ON ihr.playerId = l.userId
            where ihr.RosterId not in (Select RosterId from RosterTeamBridge)  AND ihr.inhouseId = "${ihd.InhouseId}" AND ihr.serverId = "${message.guild.id}"
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
        if (teamsNeeded == 2) {
            var team1points = 0;
            var team1members = 0;
            var team2members = 0;
            var team2points = 0;
            var team2 = [];
            var team1 = [];
            //divy out highest elo players trying to keep teams even
            for (var count = 0; count < 10; count++) {
                var p = CurrentInHouseService.rankNumValue(result[count].rank);
                //team 2 needs members
                if (team1points > team2points && team2members != 5) {
                    team2members++;
                    team2points += p;
                    team2.push(result[count]);
                }
                //team 1 needs members
                else if (team2points > team1points && team1members != 5) {
                    team1members++;
                    team1points += p;
                    team1.push(result[count]);
                }
                //these last 2 functions are just catch alls, since we dont have a greater or equal, this basically implies the 2 points are the same
                //team 1 needs the member
                else if (team1members > team2members && team1members != 5) //if team1 has the same points but more members, means the need the next highest elo person
                {
                    team1members++;
                    team1points += p;
                    team1.push(result[count]);
                }
                //same as above but reversed
                else if (team2members > team1members && team2members != 5) {
                    team2members++;
                    team2points += p;
                    team2.push(result[count]);
                }
                //else we just add a member to team 1
                else if (team1members != 5) {
                    team1members++;
                    team1points += p;
                    team1.push(result[count]);
                }
                //else add member to team 2
                else if (team2members != 5) {
                    team2members++;
                    team2points += p;
                    team2.push(result[count]);
                }
            }
            //Create Team X and Y in the db - do we need them to have a vs column ? probs not tbh these should be made together - odd always plays the + 1 even ie team 13 palys team 14 team 1 plays team 2
            message.channel.send('Balancing teams and eating tacos, please be patient :)')
            sql.get(`SELECT TeamId from Team WHERE InhouseId = ${inhouseId} AND serverId = "${message.guild.id}" Order By TeamId Desc Limit 1 `).then(result => {
                var startingNum = 0;
                if (!result)
                    startingNum = 1;
                else
                    startingNum = parseInt(result.TeamId);
                CurrentInHouseService.addTeamDb(team1, team2, inhouseId, message, parseInt(startingNum), parseInt(startingNum) + 1);
            }).catch(err => {
                console.log('error before addteamdb call - 2 teams');
                message.channel.send('error before addteamdb, Apologies for the inconvenience :(')
            });
        } else {
            for (var count = 0; count < result.length; count++) {
                //this loop will iterate through each team
                playerAverage += CurrentInHouseService.rankNumValue(result[count]);
            }
            playerAverage /= result.length;
            teamAverage = playerAverage * 5;
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
            message.channel.send('Balancing teams and eating tacos, please be patient :)')
            sql.get(`SELECT TeamId from Team WHERE InhouseId = ${inhouseId} AND serverId = "${message.guild.id}" Order By TeamId Desc Limit 1 `).then(result => {
                var startingNum = 0;
                if (!result)
                    startingNum = 1;
                else
                    startingNum = result.TeamId;
                for (var taco = 0; taco < (teamsNeeded); taco += 2) { //adds team to database by 2's
                    CurrentInHouseService.addTeamDb(teamsArray[taco], teamsArray[taco + 1], inhouseId, message, taco + parseInt(startingNum), taco + parseInt(startingNum) + 1);
                }
            }).catch(err => {
                console.log('error before addteamdb call');
                message.channel.send('error before addteamdb, Apologies for the inconvenience :(')
            });
        }
    }
    static addTeamDb(team1, team2, inhouseId, message, num1, num2) {
        console.log("add team db")
        var teamId = null;
        //Create team 1
        // get top team #'s and add to num1 and num2
        sql.run("INSERT INTO Team (TeamId, teamName, InhouseId, VsId, isWinner, serverId) VALUES (?, ?, ?, ?, ?, ?)", [null, `Team${num1}`, inhouseId, null, "not played", message.guild.id]).then((row) => {
            //insert the 5 players into this team using row.lastID as teamID
            teamId = row.lastID;
            if (!teamId)
                teamId = 1;
            for (var i = 0; i < 5; i++) {
                sql.run("INSERT INTO RosterTeamBridge (RosterId, TeamId, InhouseId, serverId) VALUES (?, ?, ?, ?)", [team1[i].RosterId, row.lastID, inhouseId, message.guild.id])
            }
        }).then(() => {
            //create team 2
            sql.run("INSERT INTO Team (TeamId, teamName, InhouseId, VsId, isWinner, serverId) VALUES (?, ?, ?, ?, ?, ?)", [null, `Team${num2}`, inhouseId, teamId, "not played", message.guild.id]).then((row) => {
                //insert the 5 players into this team using row.lastID as teamID
                sql.run(`Update TEAM SET VsId = "${row.lastID}" WHERE TeamId = "${teamId}"`);
                for (var i = 0; i < 5; i++) {
                    sql.run("INSERT INTO RosterTeamBridge (RosterId, TeamId,InhouseId, serverId) VALUES (?, ?, ?, ?)", [team2[i].RosterId, row.lastID, inhouseId, message.guild.id]);
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
        message.channel.send("Sign Ups are reopenned, use the signUp command to signup!!!");
        return true;
    }
    //addtoteam @user team
    static manuallyAddUserToTeam(message) {
        var user = message.mentions.members.first();
        var parts = message.content.split(" ");
        var teamName = "";
        if (parts.length > 3) {
            message.reply("please make sure the command is in the format 'addtoteam @user team'")
            return false;
        } else if (!user) {
            message.reply("you must mention a user to use this command");
            return false;
        } else {
            teamName = parts[2];
            //user.id to match this and remove him from team
            user = user.user;
            sql.get(`SELECT * FROM CurrentInHouse WHERE serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(r => {
                var ihid = r.InhouseId;
                //find roster id
                sql.get(`SELECT * From InHouseRoster where InhouseId = '${ihid}' AND playerId = '${user.id}' AND serverId = "${message.guild.id}" `).then(pRoster => {
                    //find team id - check to make sure less than 5 are on team currently BREAKS HERE!
                    sql.get(`SELECT * FROM Team where InhouseId = "${ihid}" AND 
                    TeamName = "${teamName}" AND serverId = "${message.guild.id}" AND
                    (Select Count(*) as count from RosterTeamBridge
					rtb left join Team t ON rtb.TeamId = t.TeamId WHERE
					rtb.InhouseId = "${ihid}"
                     AND t.TeamName = "${teamName}") < 5`).then((result) => {
                        if (!result || result.count >= 5) {
                            message.reply("Make sure that the team is in the database and has less than 5 members");
                        } else {
                            //insert the player
                            sql.run("INSERT INTO RosterTeamBridge (RosterId, TeamId, InhouseId, serverId) VALUES (?, ?, ?, ?)", [pRoster.RosterId, result.TeamId, ihid, message.guild.id]).then(didwork => {
                                message.reply("User successfully added.")
                            }).catch(() => {
                                message.reply('error adding user to team')
                            })
                        }
                    }).catch(() => {
                        message.reply(`There is no team by that name`)
                    })
                }).catch(() => {
                    message.reply(`there is no user by that name currently signed up or they are on a team in progress, please have them use the signup command or remove them from their current team or complete that game.`)
                })

            }).catch(() => {
                message.reply(`You must have an inhouse open first.`)
            })
        }
    }
    //expect removefromteam @user
    static manuallyRemoveUserFromTeam(message) {
        var user = message.mentions.members.first();
        if (!user) {
            message.reply("you must mention a user to use this command");
            return false;
        } else {
            // user.id to match this and add him to team
            user = user.user;
            sql.get(`SELECT * FROM CurrentInHouse WHERE serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(r => {
                var ihid = r.InhouseId;
                sql.run(`DELETE FROM RosterTeamBridge where InhouseId = "${ihid}" AND serverId = "${message.guild.id}" AND RosterId = (Select RosterId from 
                InHouseRoster where playerId = "${user.id}" AND InhouseId = '${ihid}'  ORDER BY RosterId DESC LIMIT 1)`).then((rows) => {
                    if (rows.changes < 1)
                        message.reply('no users found playing by that name')
                    else
                        message.channel.send(`user successfully removed ${user.username}`);
                }).catch(() => {
                    message.reply(`no player found in the database playing a game by that name`)
                })
            }).catch(() => {
                message.reply(`You must have an inhouse open first.`)
            })
        }
    }
    //expect removefromteam @user
    static manuallyRemoveUserFromSignUps(message) {
        var user = message.mentions.members.first();
        if (!user) {
            message.reply("you must mention a user to use this command");
            return false;
        } else {
            // user.id to match this and add him to team
            user = user.user;
            sql.get(`SELECT * FROM CurrentInHouse WHERE serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(r => {
                var ihid = r.InhouseId;
                sql.run(`DELETE FROM InHouseRoster where InhouseId = "${ihid}" AND playerId = '${user.id}' AND serverId = "${message.guild.id}"
                AND RosterId not in (Select RosterId from RosterTeamBridge where InhouseId = "${ihid}")`).then((rows) => {
                    if (rows.changes < 1)
                        message.reply('no users found playing by that name')
                    else
                        message.channel.send(`user successfully removed ${user.username}`);
                }).catch(() => {
                    message.reply(`no player found in the database currently signed up`)
                })
            }).catch(() => {
                message.reply(`You must have an inhouse open first.`)
            })
        }
    }
    // adds points to the winners and detracts from the losers expects .winner team1
    //TODO - need to add a check to winner to make sure they have 5
    static winner(message) {
        var parts = message.content.split(" ");
        var teamName = parts[1];
        sql.get(`SELECT * FROM CurrentInHouse WHERE serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(r => {
            sql.get(`SELECT * FROM Team WHERE teamName ="${teamName}" AND serverId = "${message.guild.id}" AND InhouseId="${r.InhouseId}"`).then(row => {
                if (!row) return message.reply("There is no team by that team name in the latest inhouse");
                if (row.isWinner == "true" || row.isWinner == "false") {
                    message.reply("These teams have already played.")
                    return true;
                }
                //get winning team by using row.TeamId
                sql.all(`SELECT  *
                FROM RosterTeamBridge rtb 
                    LEFT JOIN InHouseRoster ihr
                        ON rtb.RosterId = ihr.RosterId
                where rtb.TeamId = "${row.TeamId}" AND rtb.serverId = "${message.guild.id}" AND rtb.InhouseId="${r.InhouseId}"`).then(rows => {
                    for (var i = 0; i < rows.length; i++)
                        LadderService.addPoints(message, rows[i].playerId, 5);
                })
                //get losing team by using row.VsId
                sql.all(`SELECT  *
                FROM RosterTeamBridge rtb 
                    LEFT JOIN InHouseRoster ihr
                        ON rtb.RosterId = ihr.RosterId
                where rtb.TeamId = "${row.VsId}" AND rtb.serverId = "${message.guild.id}" AND rtb.InhouseId="${r.InhouseId}"`).then(rows1 => {
                    for (var i = 0; i < rows1.length; i++)
                        LadderService.addPoints(message, rows1[i].playerId, -2);
                }).then(taco => { //Promise still not waiting correctly
                    message.channel.send('adding points to the winners :)')
                    setTimeout(function () { //wonky way to make it wait a sec and the updates should be finished, not stable
                        sql.run(`UPDATE Team SET isWinner = "true" where TeamId = "${row.TeamId}" AND serverId = "${message.guild.id}"`);
                        sql.run(`UPDATE Team SET isWinner = "false" where TeamId = "${row.VsId}" AND serverId = "${message.guild.id}"`);
                        message.channel.send("Points updated");
                        LadderService.topForty(message);
                        return true;
                    }, 5000);
                })
            });
        })
    }
    //shows the list of current teams that are created - played and unplayed matches.
    static showTeams(message) {
        sql.get(`SELECT * FROM CurrentInHouse WHERE serverId = "${message.guild.id}" ORDER BY InhouseId DESC LIMIT 1`).then(row => {
            sql.all(`SELECT ihr.*, l.*, t.*
        FROM InHouseRoster ihr
            LEFT JOIN RosterTeamBridge r
                ON ihr.Rosterid = r.RosterId
            Left JOIN Team t
                ON r.TeamId = t.TeamId
            Left JOIN Ladder l
                ON ihr.playerId = l.userId
            where ihr.RosterId in (Select RosterId from RosterTeamBridge)  AND ihr.inhouseId = "${row.InhouseId}" AND ihr.serverId = "${message.guild.id}"
        ORDER BY t.teamName asc`).then(rows => {
                if (!rows) return message.reply("There are no teams Yet!!!");
                if (rows.length == 0) return message.channel.send("There are no teams yet!!!!")
                var reply = "\`\`\`";
                message.channel.send(`There are some teams here :D`);
                for (var i = 0; i < rows.length; i++) {
                    if (i % 10 == 0 && i != 0) {
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
                    var name = rows[i].nickname;
                    if (!name)
                        name = rows[i].playerName
                    reply += (`player name: ${name}, rank: ${rows[i].rank}\n`);

                }
                reply += "\`\`\`"
                message.channel.send(reply);

            });
        })
    }
    static displayNewTeam(message, team1, team2, num1, num2) {
        var reply = `\`\`\`2 NEW TEAMS have been created, please type showTeams to view all teams\n***** Team ${num1} *****\n`;
        for (var i = 0; i < 5; i++) {
            var name = team1[i].nickname;
            if (!name)
                name = team1[i].playerName
            reply += (`player name: ${name}, rank: ${team1[i].rank}\n`);
        }
        reply += `\n\nVERSUS\n\n\n***** Team ${num2} *****\n`;
        for (var i = 0; i < 5; i++) {
            var name = team2[i].nickname;
            if (!name)
                name = team2[i].playerName
            reply += (`player name: ${name}, rank: ${team2[i].rank}\n`);
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
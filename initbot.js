const sql = require("sqlite");


sql.open("./db/inhouseDB.sqlite").then(()=>
{
    sql.run("CREATE TABLE IF NOT EXISTS CurrentInHouse (InhouseId INTEGER PRIMARY KEY, inhouseName TEXT, date TEXT, created_by_id TEXT, created_by_username TEXT, isOpen TEXT, serverId TEXT)");
    sql.run("CREATE TABLE IF NOT EXISTS InHouseRoster (RosterId INTEGER PRIMARY KEY, InhouseId INTEGER, playerName TEXT, playerId TEXT, date TEXT, nickname TEXT, serverId TEXT)");
    sql.run("CREATE TABLE IF NOT EXISTS ladder (userId TEXT, username TEXT, rank TEXT , points INTEGER, LastPointsUpdateDate TEXT, serverId TEXT)");
    sql.run("CREATE TABLE IF NOT EXISTS RosterTeamBridge (RosterId INTEGER, TeamId INTEGER, InhouseId INTEGER, serverId TEXT)");
    sql.run("CREATE TABLE IF NOT EXISTS Team (TeamId INTEGER PRIMARY KEY, teamName TEXT,InhouseId INTEGER, VsId INTEGER, isWinner TEXT, serverId TEXT)");
}).then(()=>{console.log("DB inited")});
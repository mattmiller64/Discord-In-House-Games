//import { ScoreService } from "./services/score.service";
var LadderService = require('./services/ladder.service');
var CurrentInhouseService = require('./services/currentinhouse.service');

var Discord = require('discord.js');
const bot = new Discord.Client();
var logger = require('winston');
var config = require('./config.json');
let inHouseOpen = false;
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.user.username + ' - (' + bot.user.id + ')');
});


const prefix = config.prefix; //gets prefix from config file, will look cleaner to just use prefix

bot.on("message", (message) => {
    //Our bot needs to know if it will execute a command
    if (message.author.bot) return; // Ignore bots.    
    if (message.channel.type === "dm") return; // Ignore DM channels.    
    if (message.channel.type !== "text") return;

    //Base
    else if (message.content.toLowerCase().startsWith(prefix + 'showcommands')) {
        message.channel.send(commands);
        message.channel.send(commands2);
    } else if (message.content.toLowerCase().startsWith(prefix + 'help')) {
        message.channel.send(help);
        //message.channel.send(commands2);
    }
    //LadderService
    else if (message.content.toLowerCase().startsWith(prefix + 'adduser')) { //adds a user to the db
        LadderService.addUser(message);
    } else if (message.content.toLowerCase().startsWith(prefix + 'availableranks')) { //shows user available ranks and how to update theirs
        LadderService.availableRanks(message);
    } else if (message.content.toLowerCase().startsWith(prefix + 'stats')) { //gets users info
        LadderService.getUserInfo(message);
    } else if (message.content.toLowerCase().startsWith(prefix + 'updatepoints') && message.member.roles.some(r => config.roles.includes(r.name))) { //updates users points - can only be called by mod to manually adjust a users points
        LadderService.updatePoints(message);
    } else if (message.content.toLowerCase().startsWith(prefix + 'updaterank')) { //updates the users rank
        LadderService.updateRank(message);
    } else if (message.content.toLowerCase().startsWith(prefix + 'ladder')) { //gives top 40 ladder standings
        LadderService.topForty(message);
    }
    //CurrentInhouseService 
    // can only be called by a mod
    else if (message.member.roles.some(r => config.roles.includes(r.name))) {
        if (message.content.toLowerCase().startsWith(prefix + 'openinhouse')) { // opens the sign ups for the current in-houses today
            if (inHouseOpen) {
                message.reply("inHouses are already open");
            } else {
                inHouseOpen = true;
                CurrentInhouseService.startSignUps(message);
                message.channel.send(`Inhouses are now open! type ${prefix}signUp to sign up!!!`)
            }
        }
        // can only be called by a mod
        // potential bug, if you close inhouses, then you decide to start a new one - itll just be obnoxious, dont do that, i dont think it needs to make a bug,
        //it will leave anyone who signed up but didnt get assigned a team out to dry, but if they ressign up all is well.
        else if (message.content.toLowerCase().startsWith(prefix + 'repensignups')) { // Re-opens the sign ups to allow last minute people to sign up
            if (inHouseOpen) {
                message.reply("inHouses are already open");
            } else {
                inHouseOpen = true;
                message.reply("inHouses are reOpened");
            }
        }
        // end sign ups can only be called by a mod - this and endInHouse are probably duplicates
        else if (message.content.toLowerCase().startsWith(prefix + 'showteams')) { // shows the list of current teams full or incomplete
            CurrentInhouseService.showTeams(message);
        } // can only be called by a mod
        else if (message.content.toLowerCase().startsWith(prefix + 'winner')) { // adds points to the winners and detracts from the losers expects .winner team1
            CurrentInhouseService.winner(message);
        } // can only be called by a mod
        else if (inHouseOpen) {
            if (message.content.toLowerCase().startsWith(prefix + 'closeinhouse')) { // ends the in-house games for the day
                inHouseOpen = false;
                CurrentInhouseService.endInhouse(message); //this doesnt do anything special either, really to end an inhouse you just create a new one with startSignUps
            }
            //mods can still sign up ;)
            else if (message.content.toLowerCase().startsWith(prefix + 'signup')) { //signs a user up for this days inhouse
                CurrentInhouseService.signUp(message);
            } else if (message.content.toLowerCase().startsWith(prefix + 'leftover')) {
                CurrentInhouseService.leftover(message);
            } else if (message.content.toLowerCase().startsWith(prefix + 'createteams')) { //signs a user up for this days inhouse
                CurrentInhouseService.createTeams(message);
            } else if (message.content.toLowerCase().startsWith(prefix + 'remove')) { // removes user from these inhouses 
                CurrentInhouseService.removeFromInhouse(message);
            } else if (message.content.toLowerCase().startsWith(prefix + 'whosesignedup')) { // displays everyone who is signed up today
                CurrentInhouseService.laddersignups(message);
            }
        }
    }
    // users can only sign up and show the current teams laddersignups
    else if (inHouseOpen) {
        if (message.content.toLowerCase().startsWith(prefix + 'signup')) { //signs a user up for this days inhouse
            CurrentInhouseService.signUp(message);
        } else if (message.content.toLowerCase().startsWith(prefix + 'whosesignedup')) { // displays everyone who is signed up today
            CurrentInhouseService.laddersignups(message);
        }
    } else if (message.content.toLowerCase().startsWith(prefix + 'showteams')) { // shows the list of current teams full or incomplete
        CurrentInhouseService.showTeams(message);
    } else if (message.content.toLowerCase().startsWith(prefix + 'remove')) { // removes user from these inhouses
        CurrentInhouseService.removeFromInhouse(message);
    }
});

bot.login(config.token);

const commands = `\`\`\`all commands start with ${prefix}
help command will show a user the steps to take to participate in the inhouse games!

***Ladder Commands***

**addUser**
command to add you to our databases so that you can participate.

**availableRanks**
command to show what ranks you can be on your account(silver gold etc).

**updateRank arg**
command to update your rank. Use this by typing 'updateRank silver' or whatever rank you are

**stats**
command to see your current info and points in our system.

***MOD COMMAND INCOMING***

**updatePoints arg1 arg2**
command to manually update a users role. arg1 is a username, arg2 is the amount to adjust the points by. For instance 'updatePoints rpl-inhouse-bot 5' will update my points by 5.

**ladder**
command will display the current top forty players in our system
\`\`\`


`;
const commands2 = `\`\`\`
***InHouse Commands***

Normal Users can only use 2 commands(MODS - you can use these too :))

signUp
command is used to sign up for the inhouses today, this is only available when the inhouses are open

showTeams
command is used to show the current teams and their opponents.

***MORE MOD Commands***

**openInhouse**
command to Start the sign ups so taht users can sign up for the inhouse games

**reOpenSignUps**
command will reopen the last inhouses just in case they were accidentally closed or you had a few last minute sign ups

**closeInhouse**
command closes the current inhouse games to signups, you may use the reOpenSignUps command to reopen the signups or wait until the next inhouses and openInhouse to proceed to the next inhouse session

**showTeams**
command will show the current teams and their standings (ie who won or if they have not played yet)

**winner arg1**
command will mark a team as the winner and mark their opponent as the loser, NOTE: this will add 5 points to every player in the winning team and subtract 2 points from every player on the losing team NOTE2: YOU CANNOT GO BELOW 0 POINTS!

**leftover**
command will show you the number of people who are currently signed up without a team and those needed to make a new set of teams.

**whosesignedup**
command will show you everyone who has signed up so far. \`\`\``;


var help = `Preface: all commands shown will be prefixed with ${prefix}  ie this function is help, called by ${prefix}help
Welcome to the Inhouse Games!

1. If you have not already, please use the addUser command followed by the updateRank command to add yourself to the database and fill in your rank this will look like this
\`\`\`${prefix}addUser
${prefix}updateRank silver\`\`\`
2. Once you have been added to our system, wait until someone starts the inhouse games.
3. Once they have been started use the signUp command to sign up for the games and wait until you have been assigned a team.
4. Team assigning will be automatic, but if you forgot what team you are on, use the showTeams command to see all current teams.
5. Then get together with your team and come up with a combat plan! (decide your lanes).
6. Contact someone from the other team to set up the match.
7. Dont forget to get a tournament code by an in-house admin
8. Once the match is over, let one of the inhouse admins know who won so they can record it. (Mod remembet this is - winner TeamName)
9. This will update the winners points by +5 and the loser will lose 2 points.
10. You can check your current info using the stats command
`
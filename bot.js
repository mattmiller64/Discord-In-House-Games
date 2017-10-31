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
const commands = `\`\`\`all commands start with ${prefix}
help command will show a user the steps to take to participate in the inhouse games!

***Ladder Commands***

**addUser**
command to add you to our databases so that you can participate.

**availableRanks**
command to show what ranks you can be on your account(silver gold etc).

**updateRank arg**
command to update your rank. Use this by typing 'updateRank silver' or whatever rank you are

**standing**
command to see your current info and points in our system.

***MOD COMMAND INCOMING***

**updatePoints arg1 arg2**
command to manually update a users role. arg1 is a username, arg2 is the amount to adjust the points by. For instance 'updatePoints rpl-inhouse-bot 5' will update my points by 5.

**topForty**
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

**startSignUps**
command to Start the sign ups so taht users can sign up for the inhouse games

**reOpenSignUps**
command will reopen the last inhouses just in case they were accidentally closed or you had a few last minute sign ups

**endSignUps** and **endInhouse**
commands both close the current inhouse games to signups, you may use the reOpenSignUps command to reopen the signups or wait until the next inhouses and startSignUps to proceed to the next inhouse session

**showTeams**
command will show the current teams and their standings (ie who won or if they have not played yet)

**winner arg1**
command will mark a team as the winner and mark their opponent as the loser, NOTE: this will add 5 points to every player in the winning team and subtract 2 points from every player on the losing team NOTE2: YOU CANNOT GO BELOW 0 POINTS!

**leftover**
command will show you the number of people who are currently signed up without a team and those needed to make a new set of teams.\`\`\``;

bot.on("message", (message) => {
    //Our bot needs to know if it will execute a command
    if (message.author.bot) return; // Ignore bots.    
    if (message.channel.type === "dm") return; // Ignore DM channels.    
    if (message.channel.type !== "text") return;

    //Base
    else if(message.content.startsWith(prefix + 'showCommands')){
        message.channel.send(commands);
        message.channel.send(commands2);
    }
    //LadderService
    else if (message.content.startsWith(prefix + 'addUser')) { //adds a user to the db
        LadderService.addUser(message);
    } else if (message.content.startsWith(prefix + 'availableRanks')) { //shows user available ranks and how to update theirs
        LadderService.availableRanks(message);
    } else if (message.content.startsWith(prefix + 'standing')) { //gets users info
        LadderService.getUserInfo(message);
    } else if (message.content.startsWith(prefix + 'updatePoints')&&message.member.roles.some(r => config.roles.includes(r.name))) { //updates users points - can only be called by mod to manually adjust a users points
        LadderService.updatePoints(message);
    } else if (message.content.startsWith(prefix + 'updateRank')) { //updates the users rank
        LadderService.updateRank(message);
    } else if (message.content.startsWith(prefix + 'topForty')) { //gives top 40 ladder standings
        LadderService.topForty(message);
    }
    //CurrentInhouseService 
    // can only be called by a mod
    else if (message.member.roles.some(r => config.roles.includes(r.name))) {
        if (message.content.startsWith(prefix + 'startSignUps')) { // opens the sign ups for the current in-houses today
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
        else if (message.content.startsWith(prefix + 'reOpenSignUps')) { // Re-opens the sign ups to allow last minute people to sign up
            if (inHouseOpen) {
                message.reply("inHouses are already open");
            } else {
                inHouseOpen = true;
                //CurrentInhouseService.reOpenSignUps(message);
            }
        }
        // end sign ups can only be called by a mod - this and endInHouse are probably duplicates
       
        else if (message.content.startsWith(prefix + 'showTeams')) { // shows the list of current teams full or incomplete
            CurrentInhouseService.showTeams(message);
        } // can only be called by a mod
        else if (message.content.startsWith(prefix + 'winner')) { // adds points to the winners and detracts from the losers expects .winner team1
            CurrentInhouseService.winner(message);
        } // can only be called by a mod
        else if (inHouseOpen) {
            if (message.content.startsWith(prefix + 'endInhouse')) { // ends the in-house games for the day
                inHouseOpen = false;
                CurrentInhouseService.endInhouse(message); //this doesnt do anything special either, really to end an inhouse you just create a new one with startSignUps
            }
            else if (message.content.startsWith(prefix + 'endSignUps')) { // this will also stop sign ups - if a team doesnt have 10 players, the team will disband
                inHouseOpen = false;
                CurrentInhouseService.endSignUps(message); //this probably doesnt need to do anything
            } // can only be called by a mod
            //mods can still sign up ;)
            else if (message.content.startsWith(prefix + 'signUp')) { //signs a user up for this days inhouse
                CurrentInhouseService.signUp(message);
            } else if (message.content.startsWith(prefix + 'leftover')) {
                CurrentInhouseService.leftover(message);
            }
        }
    }
    // users can only sign up and show the current teams
    else if (inHouseOpen) {
        if (message.content.startsWith(prefix + 'signUp')) { //signs a user up for this days inhouse
            CurrentInhouseService.signUp(message);
        }
    } else if (message.content.startsWith(prefix + 'showTeams')) { // shows the list of current teams full or incomplete
        CurrentInhouseService.showTeams(message);
    }
});

bot.login(config.token);
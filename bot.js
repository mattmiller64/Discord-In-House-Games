//import { ScoreService } from "./services/score.service";
var LadderService = require('./services/ladder.service');
var ScoreService = require('./services/score.service');
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
    // //ScoreService - test
    // ScoreService.addScore(message);
    // if (message.content.startsWith(prefix + 'level')) {
    //     ScoreService.getLevel(message);
    // } else if (message.content.startsWith(prefix + 'points')) {
    //     ScoreService.getPoints(message);
    // }
    //LadderService
    else if (message.content.startsWith(prefix + 'addUser')) { //adds a user to the db
        LadderService.addUser(message);
    } else if (message.content.startsWith(prefix + 'availableRanks')) { //shows user available ranks and how to update theirs
        LadderService.availableRanks(message);
    } else if (message.content.startsWith(prefix + 'standing')) { //gets users info
        LadderService.getUserInfo(message);
    } else if (message.content.startsWith(prefix + 'updatePoints')) { //updates users points - can only be called by mod to manually adjust a users points
        LadderService.updatePoints(message);
    } else if (message.content.startsWith(prefix + 'updateRank')) { //updates the users rank
        LadderService.updateRank(message);
    } else if (message.content.startsWith(prefix + 'topForty')) { //gives top 40 ladder standings
        LadderService.topForty(message);
    }
    //CurrentInhouseService 
    // can only be called by a mod
    else if (message.member.roles.some(r => ["Mod", "Executive Officer"].includes(r.name))) {
        if (message.content.startsWith(prefix + 'startSignUps')) { // opens the sign ups for the current in-houses today
            if (inHouseOpen) {
                message.reply("inHouses are already open");
            } else {
                inHouseOpen = true;
                CurrentInhouseService.startSignUps(message);
                message.reply(`Inhouses are now open! type ${prefix}signUp to sign up!!!`)
            }
        }
        // can only be called by a mod
        else if (message.content.startsWith(prefix + 'reOpenSignUps')) { // Re-opens the sign ups to allow last minute people to sign up
            if (inHouseOpen) {
                message.reply("inHouses are already open");
            } else {
                inHouseOpen = true;
                CurrentInhouseService.reOpenSignUps(message);
            }
        }
        // end sign ups can only be called by a mod
        else if (message.content.startsWith(prefix + 'endSignUps')) { // this will also stop sign ups - if a team doesnt have 10 players, the team will disband
            inHouseOpen = false;
            CurrentInhouseService.endSignUps(message); //this probably doesnt need to do anything
        } // can only be called by a mod
        else if (message.content.startsWith(prefix + 'showTeams')) { // shows the list of current teams full or incomplete
            CurrentInhouseService.showTeams(message);
        } // can only be called by a mod
        else if (inHouseOpen) {
            if (message.content.startsWith(prefix + 'endInhouse')) { // ends the in-house games for the day
                inHouseOpen = false;
                CurrentInhouseService.endInhouse(message); //this doesnt do anything special either, really to end an inhouse you just create a new one with startSignUps
            }
            //mods can still sign up ;)
            if (message.content.startsWith(prefix + 'signUp')) { //signs a user up for this days inhouse
                CurrentInhouseService.signUp(message);
            }
        }
    }

    // users can only sign up / end sign up if it is currently open 
    else if (inHouseOpen) {
        if (message.content.startsWith(prefix + 'signUp')) { //signs a user up for this days inhouse
            CurrentInhouseService.signUp(message);
        }
    }
});

bot.login(config.token);
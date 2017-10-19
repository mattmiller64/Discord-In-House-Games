//import { ScoreService } from "./services/score.service";
var LadderService = require('./services/ladder.service');
var ScoreService = require('./services/score.service');
var Discord = require('discord.js');
const bot = new Discord.Client();
var logger = require('winston');
var config = require('./config.json');

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
    //ScoreService
    ScoreService.addScore(message);
    if (message.content.startsWith(prefix + 'level')) {
        ScoreService.getLevel(message);
    } else if (message.content.startsWith(prefix + 'points')) {
        ScoreService.getPoints(message);
    }
    //LadderService
    else if (message.content.startsWith(prefix + 'addUser')) {      //adds a user to the db
        LadderService.addUser(message);
    }
    else if (message.content.startsWith(prefix + 'availableRanks')) {    //shows user available ranks and how to update theirs
        LadderService.availableRanks(message);
    }
    else if (message.content.startsWith(prefix + 'standing')) {    //gets users info
        LadderService.getUserInfo(message);
    }
    else if (message.content.startsWith(prefix + 'updatePoints')) {    //updates users points
        LadderService.updatePoints(message);
    }
    else if (message.content.startsWith(prefix + 'updateRank')) {    //updates the users rank
        LadderService.updateRank(message);
    }
    else if (message.content.startsWith(prefix + 'topForty')) {    //gives top 40 ladder standings
        LadderService.topForty(message);
    }
    //CurrentInhouseService
    else if (message.content.startsWith(prefix + 'signUp')) {       //signs a user up for this days inhouse

    }
});

bot.login(config.token);

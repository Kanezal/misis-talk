const { API_TOKEN } = require("./config.dev.json")

const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(API_TOKEN, {polling: true});

const commandsFolder = './commands/';

// Reading the content of the commands folder
fs.readdir(commandsFolder, (err, files) => {
    if (err) return console.error(err);
    
    files.forEach((file) => {
        // Checking if the file is a Javascript file
        if (path.extname(file) === '.js') {
            const command = require(commandsFolder + file);
            
            // Removing the file extension and add '/'
            const commandName = '/' + path.basename(file, '.js');
            
            bot.onText(new RegExp(`^${commandName}$`, 'i'), command);
        }
    });
});

module.exports = bot
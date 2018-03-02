# Discord-In-House-Games

# Set-Up
download the bot then add a config.json file to the root (roles is for maintainance - ie starting the tournament, assigning a winner), it should look like this: 
```javascript
{
   "token" : "Your Super Secret Bot Token",
   "prefix": "YourPrefixForCommandsHere",
   "roles" : ["OneMod", "OtherModRoleHere"]
}
```
create a db folder containing a file named inhouseDB.sqlite
run the initbot.js script - node initbot.js
run bot.js - node bot.js

# Discord-In-House-Games

# TODO 
- hide bot id
- add teams to db
- add a way to display how many of 10 players needed to create another team
- have a way to show current teams for the nights (display ones that havent finished or display all with who won?)
- implement having a winner (should be, if odd number wins, +5 to that team and take odd#+1 team and -2, if even wins - add 5 to their team, take team#-1 and -2 to their points)
- have a .help and .modHelp to display commands

# Set Up
download the bot then add a config.json file to the root (roles is for maintainance ie starting the tournament, assigning a winner), it should look like this: 
{
   "token" : "Your Super Secret Bot Token",
   "prefix": "YourPrefixForCommandsHere"
   "roles" : ["Mod", "OtherModRoleHere"]
}

might have to create a db folder containing a file named inhouseDB.sqlite

# Potential Bugs
- 20+ users sign up before the first 10 are added to a team (basically if 20 people sign up in less than a minute - unlikely)
- duplicate user names as unfortunately a search has to be made on the user name rather than the id (this is also mostly unlikely as it is a mod making a manual point adjustment)
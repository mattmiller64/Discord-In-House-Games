# Discord-In-House-Games

# Set-Up
download the bot then add a config.json file to the root (roles is for maintainance ie starting the tournament, assigning a winner), it should look like this: 
{
   "token" : "Your Super Secret Bot Token",
   "prefix": "YourPrefixForCommandsHere"
   "roles" : ["Mod", "OtherModRoleHere"]
}

might have to create a db folder containing a file named inhouseDB.sqlite

# Not-Implemented
- decay - as of today, decaying points will not be implemented as this would need to be ran on a scheduler to be consistent in its job
- resetting points - there is currently no implementation for resetting points as I am not sure how they want it to be implemented, right now you can run a sql script to set all points to 0 if you wanted
- adding a whole group of five - need to implement the vs feature, since you want it to auto make teams when 10 people have signed up this is impossible, you would have to change your requirements on that.

# TODO 
- hide bot id
- add a way to display how many of 10 players needed to create another team
- display teams with whether they won or not?
- implement having a winner (should be, if odd number wins, +5 to that team and take odd#+1 team and -2, if even wins - add 5 to their team, take team#-1 and -2 to their points)
- have a .help and .modHelp to display commands (maybe a .commands)
- better error handling and add a team vs column or table
- write ladder check on sign up - Needs testing
- add inhouseId to team table so that we can reset team numbers after each, add vs column, add winner column

# Potential Bugs
- 20+ users sign up before the first 10 are added to a team (basically if 20 people sign up in less than a minute - unlikely)
- duplicate user names as unfortunately a search has to be made on the user name rather than the id (this is also mostly unlikely as it is a mod making a manual point adjustment)
- if teams get messed up they might not match up correctly
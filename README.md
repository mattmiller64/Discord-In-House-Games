# Discord-In-House-Games

# Set-Up
download the bot then add a config.json file to the root (roles is for maintainance - ie starting the tournament, assigning a winner), it should look like this: 
```javascript
{
   "token" : "Your Super Secret Bot Token",
   "prefix": "YourPrefixForCommandsHere"
   "roles" : ["OneMod", "OtherModRoleHere"]
}
```
might have to create a db folder containing a file named inhouseDB.sqlite

# Not-Implemented
- decay - as of today, decaying points will not be implemented as this would need to be ran on a scheduler to be consistent in its job
- resetting points - there is currently no implementation for resetting points as I am not sure how they want it to be implemented, right now you can run a sql script to set all points to 0 if you wanted
- adding a whole group of five - need to implement 

# TODO for BETA
- Get bot on Raspberry PI

- .LadderOpen - will show the current signed up players for inhouse games
- NEED BETTER BALANCING - at addTeamtoDB function - need to make it loop through it, probably a foreach function calling the 2 teams.

- need to do end to end testing
- need to beta test with real users
- need to constraint this bot to a certain channel? - this should be able to be done via the server admin giving the bot permissions/roles


#TODO Later
- better error handling
- possibly make a check db command that runs on start to init the dbs
- write scripts to be ran nightly to dm users when they will decay
- add a fix to remove someone already on a team
- NEED TO STORE WHETHER INHOUSE IS OPEN IN THE DB, not in the bots state - also should probably have server id instances for each table and added to each sql command


# Potential Bugs
- duplicate user names as unfortunately a search has to be made on the user name rather than the id (this is also mostly unlikely as it is a mod making a manual point adjustment)
- if teams get messed up they might not match up correctly
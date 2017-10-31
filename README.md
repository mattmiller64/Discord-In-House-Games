# Discord-In-House-Games

# Set-Up
download the bot then add a config.json file to the root (roles is for maintainance ie starting the tournament, assigning a winner), it should look like this: 
```javascript
{
   "token" : "Your Super Secret Bot Token",
   "prefix": "YourPrefixForCommandsHere"
   "roles" : ["Mod", "OtherModRoleHere"]
}
```
might have to create a db folder containing a file named inhouseDB.sqlite

# Not-Implemented
- decay - as of today, decaying points will not be implemented as this would need to be ran on a scheduler to be consistent in its job
- resetting points - there is currently no implementation for resetting points as I am not sure how they want it to be implemented, right now you can run a sql script to set all points to 0 if you wanted
- adding a whole group of five - need to implement the vs feature, since you want it to auto make teams when 10 people have signed up this is impossible, you would have to change your requirements on that.

# TODO for BETA
- hide bot id
- Make sure if the 10th person signs up but an 11th signs up too that we start the process of making the team
- have a .help to show the flow of using our inhouse service bot - maybe dm anyone that joins inhouses or something idk

#TODO Later
- better error handling
- possibly make a check db command that runs on start to init the dbs
- write scripts to be ran nightly to dm users when they will decay


# Potential Bugs
- 20+ users sign up before the first 10 are added to a team (basically if 20 people sign up in less than a minute - unlikely)
- duplicate user names as unfortunately a search has to be made on the user name rather than the id (this is also mostly unlikely as it is a mod making a manual point adjustment)
- if teams get messed up they might not match up correctly
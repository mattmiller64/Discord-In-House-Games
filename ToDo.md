# Not-Implemented
- decay - as of today, decaying points will not be implemented as this would need to be ran on a scheduler to be consistent in its job
- resetting points - there is currently no implementation for resetting points as I am not sure how they want it to be implemented, right now you can run a sql script to set all points to 0 if you wanted

# TODO for BETA
- TEST : if you create teams twice in one inhouse make it increment
- better admin removing and adding to teams and to signups (maybe a -clean [username] or something like that - use @username)
- Get bot on Raspberry PI


#TODO Later
- better error handling
- allow people to use like addPoints @user
- NEED TO STORE WHETHER INHOUSE IS OPEN IN THE DB, not in the bots state - also should probably have server id instances for each table and added to each sql command
- adding a whole group of five - need to implement 
- make check ign command to make sure everyone is who they say
- possibly make a check db command that runs on start to init the dbs - since its only ran by me not a huge deal atm.
- write scripts to be ran nightly to dm users when they will decay
- add a fix to remove someone already on a team
- make MMR and prettify results

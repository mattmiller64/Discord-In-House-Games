# Not-Implemented
- decay - as of today, decaying points will not be implemented as this would need to be ran on a scheduler to be consistent in its job
- resetting points - there is currently no implementation for resetting points as I am not sure how they want it to be implemented, right now you can run a sql script to set all points to 0 if you wanted

#TODO NOW
1. finish implementing guild/server uniqueness - need to update reopen/close sign ups
2. add true and false to inhouse table - TEST THIS 
3. update bot on raspberry pi


#TODO NEXT
- make MMR and W/L and prettify results

#TODO - BACKLOG
- add a way to add riot account id tied to the user, user provides name and it fetches id, then they signup once and it checks based on that id, if they mess up the name they have to contact a mod, also doesnt need to update on each signup?
- better error handling
- write scripts to be ran nightly to dm users when they will decay, also add nightly script to implement the decay

- adding a whole group of five - need to implement 
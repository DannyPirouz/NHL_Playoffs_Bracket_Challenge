# NHL Playoffs Bracket Challenge

Every year, my friends and I play a game where we try to predict the NHL playoff bracket and who will win the Stanley Cup. 
We usually upload an image on Discord where we can see each other's brackets and at the end, we will manually count up how many points each person got. 
The person with the highest points wins the prize pool. This often got pretty messy for many reasons. 
Uploading an image got annoying because if we wanted to change our prediction we had to redo the bracket, save the image, and upload it again to Discord. 
Manually tallying up points was also tedious and could lead to errors. I noticed there wasn't a bot like this on Discord so I decided to make my own. 
Given the 16 teams that make playoffs, users can create their entire bracket all the way to the Stanley Cup winner. 
I also introduced a points system and points will be awarded based on the correctness of each round. The later rounds earn more points as they are harder to predict. 
Users can view their predictions as well as display their brackets with simple commands. User data gets saved and once the first match of the playoffs starts, predictions can no longer be made.


To run the bot on your server:
1. Paste in your bot token in the like this: client.login('Your Token')
2. run "npm install" 
3. run "npm install discord.js"
4. run "npm install mongodb"
5. run "npm install -g serve"
<!-- 6. run the bracket-renderer with serve bracket-renderer/. if in root directory -->
6. run the server with "node src/index.js"


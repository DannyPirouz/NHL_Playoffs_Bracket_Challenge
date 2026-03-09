# NHL Playoffs Bracket Challenge

Every year, my friends and I play a game where we try to predict the NHL playoff bracket and who will win the Stanley Cup. 
We usually upload an image on Discord where we can see each other's brackets and at the end, we will manually count up how many points each person got. 
The person with the highest points wins the prize pool. This often got pretty messy for many reasons. 
Uploading an image got annoying because if we wanted to change our prediction we had to redo the bracket, save the image, and upload it again to Discord. 
Manually tallying up points was also tedious and could lead to errors. I noticed there wasn't a bot like this on Discord so I decided to make my own. 
Given the 16 teams that make playoffs, users can create their entire bracket all the way to the Stanley Cup winner. 
I also introduced a points system and points will be awarded based on the correctness of each round. The later rounds earn more points as they are harder to predict. 
Users can view their predictions as well as display their brackets with simple commands. User data gets saved and once the first match of the playoffs starts, predictions can no longer be made!


## To run the bot:

1. Create a .env file in the root of the project with the following variables:

TOKEN = your_discord_bot_token  
MONGO_URI = your_mongodb_connection_uri

2. Build the docker image by running:
docker build -t discord-bot .

3. Run the docker container with:
docker run discord-bot

4. If there is an issue with the bracket renderer, you may need to run the it for the first time with "serve bracket-renderer/." Be in the root directory

### Requirements:
Docker installed on your system


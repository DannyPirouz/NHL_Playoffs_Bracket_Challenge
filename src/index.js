require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder, MessageFlags } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { MongoClient } = require('mongodb');
const generateBracketImage = require('../screenshotBracket');
const { AttachmentBuilder } = require('discord.js');


const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildIntegrations,
        IntentsBitField.Flags.MessageContent,
    ],
});

const uri = 'mongodb://localhost:27017';
const clientMongo = new MongoClient(uri);

const activeCollectors = new Map();

async function connectToMongoDB() {
    try {
        await clientMongo.connect();
        console.log('Connected to MongoDB');
        await loadPredictions();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectToMongoDB();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

const prefix = '!';

const round1Matchups = [['Jets', 'Blues'], ['Stars', 'Avs'], ['Vegas', 'Wild'], ['Kings', 'Oilers'],
['Leafs', 'Sens'], ['Tampa', 'Panthers'], ['Caps', 'Habs'], ['Canes', 'Devils']];

let predictions = {};

async function loadPredictions() {
    const database = clientMongo.db('NHLBracket');
    const collection = database.collection('predictions');

    try {
        const predictionData = await collection.findOne({ _id: 'predictions' });
        if (predictionData) {
            predictions = predictionData.predictions;
            console.log('Predictions loaded from MongoDB');
        }
    } catch (error) {
        console.error('Error loading predictions from MongoDB:', error);
    }
}

async function savePredictions() {
    const database = clientMongo.db('NHLBracket');
    const collection = database.collection('predictions');

    try {
        await collection.updateOne({ _id: 'predictions' }, { $set: { predictions } }, { upsert: true });
        console.log('Predictions saved to MongoDB');
    } catch (error) {
        console.error('Error saving predictions to MongoDB:', error);
    }
}

function calculateUserPoints(userPrediction) {
    if (!userPrediction || !userPrediction.round1) {
        return {
            round1Points: 0,
            round2Points: 0,
            round3Points: 0,
            round4Points: 0,
            totalPoints: 0
        };
    }

    const round1Winners = ["null", "null", "null", "null", "null", "null", "null", "null"];
    const round2Winners = ["null", "null", "null", "null"];
    const round3Winners = ["null", "null"];
    const finalWinner = "null";
    
    let round1Points = 0;
    let round2Points = 0;
    let round3Points = 0;
    let round4Points = 0;
    
    if (userPrediction.round1) {
        userPrediction.round1.forEach(team => {
            if (round1Winners.includes(team)) {
                round1Points++;
            }
        });
    }
    
    if (userPrediction.round2) {
        userPrediction.round2.forEach(team => {
            if (round2Winners.includes(team)) {
                round2Points += 2;
            }
        });
    }
    
    if (userPrediction.round3) {
        userPrediction.round3.forEach(team => {
            if (round3Winners.includes(team)) {
                round3Points += 4;
            }
        });
    }
    
    if (userPrediction.round4 === finalWinner) {
        round4Points = 8;
    }
    
    const totalPoints = round1Points + round2Points + round3Points + round4Points;
    
    return {
        round1Points,
        round2Points,
        round3Points,
        round4Points,
        totalPoints
    };
}

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) {
        return;
    }
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'predict') {

        let currentDate = new Date();
        if ((currentDate.getMonth() == 3 && currentDate.getDate() >= 19) || currentDate.getMonth() > 3) {
            message.reply('Predictions are closed!');
            return;
        }
        
        let botMessages = [];
        const userId = message.author.id;
        predictions[userId] = { round1: [], round2: [], round3: [], round4: null };
    
        let round = 1;
        let matchupIndex = 0;
        let currentMatchups = [...round1Matchups];
    
        const sendNextMatchup = async () => {
            if (matchupIndex >= currentMatchups.length) {
                if (round === 1) predictions[userId].round1 = [...picks];
                else if (round === 2) predictions[userId].round2 = [...picks];
                else if (round === 3) predictions[userId].round3 = [...picks];
                else if (round === 4) {
                    predictions[userId].round4 = picks[0];
                    savePredictions();
                    const finalMsg = await message.channel.send(`🏆 All rounds complete! Your Stanley Cup Winner is **${picks[0]}**!`);
                    botMessages.push(finalMsg);
                    await display(message);
                    for (const msg of botMessages) {
                        try {
                            await msg.delete();
                        } catch (err) {
                            console.warn('Failed to delete message:', err.message);
                        }
                    }                    
                    return;
                }
    
                round++;
                matchupIndex = 0;
                currentMatchups = [];
    
                for (let i = 0; i < picks.length; i += 2) {
                    currentMatchups.push([picks[i], picks[i + 1]]);
                }
    
                if (round === 4) {
                    currentMatchups = [[picks[0], picks[1]]];
                }
    
                picks = [];
                message.channel.send(`➡️ Moving to Round ${round}...`)
                    .then(msg => botMessages.push(msg))
                    .catch(console.error);

                setTimeout(sendNextMatchup, 1500);
                return;
            }
    
            const [teamA, teamB] = currentMatchups[matchupIndex];
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`pick_${teamA}_${userId}`)
                        .setLabel(teamA)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`pick_${teamB}_${userId}`)
                        .setLabel(teamB)
                        .setStyle(ButtonStyle.Danger)
                );
    
            message.channel.send({
                content: `Round ${round} — Matchup ${matchupIndex + 1}: **${teamA}** vs **${teamB}**`,
                components: [row]
            }).then(msg => botMessages.push(msg)).catch(console.error);
                
    
            matchupIndex++;
        };
    
        let picks = [];

        if (activeCollectors.has(userId)) {
            activeCollectors.get(userId).stop('new prediction started');
        }
    
        const collector = message.channel.createMessageComponentCollector({
            filter: interaction => interaction.customId.startsWith('pick_') && interaction.customId.endsWith(userId),
            time: 600000 
        });

        activeCollectors.set(userId, collector);
    
        collector.on('collect', async interaction => {
            const [, pickedTeam] = interaction.customId.split('_');
            picks.push(pickedTeam);
            // await interaction.reply({ content: `✅ You picked **${pickedTeam}**!`, flags: MessageFlags.Ephemeral });
            try {
                await interaction.deferUpdate(); 
            } catch (err) {
                console.warn('Failed to defer interaction:', err.message);
            }
            
            sendNextMatchup();
        });
    
        collector.on('end', () => {
            console.log('Prediction session ended or timed out.');
            activeCollectors.delete(userId);
        });
    
        sendNextMatchup();
    }

    if (command === 'bracket') {
        const targetUsername = args.join(' ');
        
        if (!targetUsername) {
            message.reply('Please provide a username. Usage: !bracket username');
            return;
        }
        
        let targetUserId = null;
        const predictionEntries = Object.entries(predictions);
        
        for (const [userId] of predictionEntries) {
            try {
                const user = await client.users.fetch(userId);
                if (user && user.username.toLowerCase() === targetUsername.toLowerCase()) {
                    targetUserId = userId;
                    break;
                }
            } catch (error) {
                console.warn(`Could not fetch user with ID ${userId}: ${error.message}`);
            }
        }
        
        if (!targetUserId) {
            message.reply(`Could not find a bracket for user "${targetUsername}". Make sure the username is spelled correctly.`);
            return;
        }
        
        const userPrediction = predictions[targetUserId];
        
        const loadingMessage = await message.reply(`Generating ${targetUsername}'s bracket...`);
        
        try {
            const imagePath = await generateBracketImage(userPrediction, targetUserId, round1Matchups);
            const image = new AttachmentBuilder(imagePath);
            
            await loadingMessage.delete();
            await message.reply({ content: `Here's ${targetUsername}'s bracket! 🤫`, files: [image] });
        } catch (err) {
            console.error(err);
            await loadingMessage.edit(`Failed to generate bracket image for ${targetUsername}.`);
        }
    }
    

    if (command === 'help') {
        message.reply(`Commands: 
                        Use the command \"!predict\" to make predictions.
                        Use the command \"!myPredictions\" to see your predictions.
                        Use the command \"!display\" to display your bracket.
                        Use the command \"!points\" to see how many points you have.
                        Use the command \"!bracket\" to see someone else's bracket.
                        Use the command \"!leaderboard\" to see the leaderboard.`);
    }

    if (command === 'points') {
        const userPrediction = predictions[message.author.id];
    
        if (!userPrediction || !userPrediction.round1) {
            message.reply('You have not made any predictions yet.');
            return;
        }
    
        const pointsData = calculateUserPoints(userPrediction);
    
        message.reply(`Points:
        Your Round 1 points are: ${pointsData.round1Points} \n 
        Your Round 2 points are: ${pointsData.round2Points} \n 
        Your Round 3 points are: ${pointsData.round3Points} \n 
        Your Round 4 points are: ${pointsData.round4Points} \n 
        Your total points are: ${pointsData.totalPoints}`);
    }

    if (command === 'leaderboard') {
        const paidUsers = ['darrell99', 'jrg', 'supsoup', 'tobi.36', 'stevechoi', 'canucksfan233']
        const getLeaderboard = async () => {
            const leaderboardData = [];
            const userPromises = [];
            
            for (const [userId, userPrediction] of Object.entries(predictions)) {
                if (!userPrediction || !userPrediction.round1) continue;
                // console.log(userPrediction);
                const pointsData = calculateUserPoints(userPrediction);
                let user = client.users.cache.get(userId);
                let userChampionPick = userPrediction.round4;
                
                if (!user) {
                    userPromises.push(
                        client.users.fetch(userId)
                            .then(fetchedUser => {
                                // console.log(fetchedUser);
                                leaderboardData.push({
                                    username: fetchedUser.username,
                                    userId,
                                    userChampionPick,
                                    ...pointsData
                                });
                            })
                            .catch(() => {
                                leaderboardData.push({
                                    username: `Unknown User`,
                                    userId,
                                    userChampionPick,
                                    ...pointsData
                                });
                            })
                    );
                } else {
                    // console.log(user);
                    leaderboardData.push({
                        username: user.username,
                        userId,
                        userChampionPick,
                        ...pointsData
                    });
                }
            }
            
            if (userPromises.length > 0) {
                await Promise.all(userPromises);
            }
            
            leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);
            
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('🏆 NHL Bracket Challenge Leaderboard')
                .setDescription('Current Standings for the NHL Bracket Challenge')
                .setTimestamp()
                .setFooter({ text: 'Use !points to see your detailed points breakdown' });
            
            const topUsers = leaderboardData.slice(0, 20);
            
            if (topUsers.length === 0) {
                embed.addFields({ name: 'No predictions', value: 'No users have made predictions yet!' });
            } else {
                let leaderboardText = '';
                
                topUsers.forEach((userData, index) => {
                    let paidMedal;
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                    if (paidUsers.includes(userData.username)) {
                        paidMedal = '🤑 ';
                    } else {
                        paidMedal = '❌ ';
                    }
                
                    leaderboardText += `${paidMedal}` + `${medal} **${userData.username}**: **${userData.totalPoints} pts** ` +
                        `(R1: ${userData.round1Points}, R2: ${userData.round2Points}, ` +
                        `R3: ${userData.round3Points}, Final: ${userData.round4Points})   ` + `Champ Pick: **${userData.userChampionPick.toUpperCase()}** \n` + '\n';
                });
                
                embed.addFields({ name: 'Rankings', value: leaderboardText });
            }
            
            const currentUserIndex = leaderboardData.findIndex(data => data.userId === message.author.id);
            
            if (currentUserIndex !== -1 && currentUserIndex >= 10) {
                const userData = leaderboardData[currentUserIndex];
                embed.addFields({ 
                    name: 'Your Position', 
                    value: `#${currentUserIndex + 1}: **${userData.username}**: ${userData.totalPoints} pts ` +
                          `(R1: ${userData.round1Points}, R2: ${userData.round2Points}, ` +
                          `R3: ${userData.round3Points}, Final: ${userData.round4Points})`
                });
            }
            
            return embed;
        };
    
        message.channel.send('Generating leaderboard 🤫...').then(async msg => {
            try {
                const embed = await getLeaderboard();
                await msg.edit({ content: null, embeds: [embed] });
            } catch (error) {
                console.error('Error generating leaderboard:', error);
                msg.edit('Error generating leaderboard. Please try again later.');
            }
        });
    }
    

    // if (command === 'update') { 
    //     message.reply('@everyone Greetings Predictors! I have been updated! Please refresh your image with !display. Use !releasenotes to see the latest changes.');
    // }

    if (command === 'clearit') {

        delete predictions[message.author.id];
        savePredictions();
        message.reply('Predictions cleared successfully!');
    }

    if (command === 'mypredictions') {
        const userPrediction = predictions[message.author.id];
        if (!userPrediction || !userPrediction.round1) {
            message.reply('You have not made predictions for Round 1 yet.');
            return;
        }
        let response = 'Your predictions for Round 1: \n' +
            `\`\`\`yaml\n` +
            `Jets vs Blues      : ${userPrediction.round1[0].toUpperCase()}\n` +
            `Stars vs Avs       : ${userPrediction.round1[1].toUpperCase()}\n` +
            `Vegas vs Wild      : ${userPrediction.round1[2].toUpperCase()}\n` +
            `Kings vs Oilers    : ${userPrediction.round1[3].toUpperCase()}\n` +
            `Leafs vs Sens      : ${userPrediction.round1[4].toUpperCase()}\n` +
            `Tampa vs Panthers  : ${userPrediction.round1[5].toUpperCase()}\n` +
            `Caps vs Habs       : ${userPrediction.round1[6].toUpperCase()}\n` +
            `Canes vs Devils    : ${userPrediction.round1[7].toUpperCase()}\n` +
            `\`\`\``;

        if (userPrediction.round2) {
            response += 'Your predictions for Round 2: \n' +
                `\`\`\`yaml\n` +
                `${userPrediction.round1[0]} vs ${userPrediction.round1[1]}        : ${userPrediction.round2[0].toUpperCase()}\n` +
                `${userPrediction.round1[2]} vs ${userPrediction.round1[3]}     : ${userPrediction.round2[1].toUpperCase()}\n` +
                `${userPrediction.round1[4]} vs ${userPrediction.round1[5]}   : ${userPrediction.round2[2].toUpperCase()}\n` +
                `${userPrediction.round1[6]} vs ${userPrediction.round1[7]}      : ${userPrediction.round2[3].toUpperCase()}\n` +
                `\`\`\``;
        }
        if (userPrediction.round3) {
            response += 'Your predictions for Round 3: \n' +
                `\`\`\`yaml\n` +
                `${userPrediction.round2[0]} vs ${userPrediction.round2[1]}   : ${userPrediction.round3[0].toUpperCase()}\n` +
                `${userPrediction.round2[2]} vs ${userPrediction.round2[3]}   : ${userPrediction.round3[1].toUpperCase()}\n` +
                `\`\`\``;
        }
        if (userPrediction.round4) {
            response += `\`\`\`yaml\n` +
                `Stanley Cup Winner prediction: ${userPrediction.round4.toUpperCase()}\n` +
                `\`\`\``;
        }
        message.reply(response);
    }

    if (command === 'display') {
        display(message);
    }
    
});

async function display(message) {
    const userPrediction = predictions[message.author.id];
        if (!userPrediction?.round1 || !userPrediction?.round2 || !userPrediction?.round3 || !userPrediction?.round4) {
            message.reply('You must make predictions for all rounds before displaying your bracket.');
            return;
        }
        const sentMesage = await message.reply('Generating your bracket...');
    
        try {
            const imagePath = await generateBracketImage(userPrediction, message.author.id, round1Matchups);
            const image = new AttachmentBuilder(imagePath);

            await sentMesage.delete();
            await message.reply({ content: 'Here’s your bracket! 🤫', files: [image] });
        } catch (err) {
            console.error(err);
            message.reply('Failed to generate bracket image.');
        }
}

client.login(process.env.TOKEN);



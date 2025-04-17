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
const round2Matchups = [];
const round3Matchups = [];
const round4Matchups = [];

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

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) {
        return;
    }
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    if (command === 'predict') {
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
                    message.channel.send(`🏆 All rounds complete! Your Stanley Cup Winner is **${picks[0]}**!`);
                    await display(message);
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
                message.channel.send(`➡️ Moving to Round ${round}...`);
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
            });
    
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
            await interaction.reply({ content: `✅ You picked **${pickedTeam}**!`, flags: MessageFlags.Ephemeral });
            sendNextMatchup();
        });
    
        collector.on('end', () => {
            console.log('Prediction session ended or timed out.');
            activeCollectors.delete(userId);
        });
    
        sendNextMatchup();
    }
    

    if (command === 'help') {
        message.reply(`Commands: 
                        Use the command \"!predict\" to make predictions.
                        Use the command \"!myPredictions\" to see your predictions.
                        Use the command \"!display\" to display your bracket.
                        Use the command \"!points\" to see how many points you have.`);
    }

    if (command === 'clearit') {

        delete predictions[message.author.id];
        savePredictions();
        message.reply('Predictions cleared successfully!');
    }

    if (command === 'points') {

        const userPrediction = predictions[message.author.id];

        if (!userPrediction || !userPrediction.round1) {
            message.reply('You have not made any predictions yet.');
            return;
        }

        let round1Points = 0;
        let round2Points = 0;
        let round3Points = 0;
        let round4Points = 0;
        let totalPoints = 0;
        

        const teamsR1 = ["null", "null", "null", "null", "null", "null", "null", "null"];

        if (userPrediction.round1) {
            teamsR1.forEach(team => {
                if (userPrediction.round1.includes(team)) {
                    round1Points++;
                }
            });
        }

        const teamsR2 = ["null", "null", "null", "null"];

        if (userPrediction.round2) {
            teamsR2.forEach(team => {
                if (userPrediction.round2.includes(team)) {
                    round2Points += 2;
                }
            });
        }

        if (userPrediction.round3) {
            if (userPrediction.round3.includes("null")) {
                round3Points += 4;
            }
            if (userPrediction.round3.includes("null")) {
                round3Points += 4;
            }
        }
        if (userPrediction.round4) {
            if (userPrediction.round4.includes("null")) {
                round4Points += 8;
            }
        }

        totalPoints = round1Points + round2Points + round3Points + round4Points;
        message.reply(`Points:
        Your Round 1 points are: ${round1Points} \n 
        Your Round 2 points are: ${round2Points} \n 
        Your Round 3 points are: ${round3Points} \n 
        Your Round 4 points are: ${round4Points} \n 
        Your total points are: ${totalPoints}`);
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
            await message.reply({ content: 'Here’s your bracket! 🧊', files: [image] });
        } catch (err) {
            console.error(err);
            message.reply('Failed to generate bracket image.');
        }
}

client.login(process.env.TOKEN);



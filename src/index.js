require('dotenv').config();
const { Client, IntentsBitField, MessageEmbed } = require('discord.js');
const fs = require('fs');

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

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

const prefix = '!';

const round1Matchups = [['Dallas', 'Vegas'], ['Jets', 'Avs'], ['Canucks', 'Preds'], ['Oilers', 'Kings'],
['Panthers', 'Lightning'], ['Bruins', 'Leafs'], ['Rangers', 'Capitals'], ['Canes', 'Islanders']];
const round2Matchups = [];
const round3Matchups = [];
const round4Matchups = [];

let predictions = {};
try {
    const data = fs.readFileSync('./predictions.json');
    if (data.length > 0) {
        predictions = JSON.parse(data);
    }
} catch (error) {
    console.log('Error loading predictions:', error);
}

function savePredictions() {
    fs.writeFile('./predictions.json', JSON.stringify(predictions, null, 4), (err) => {
        if (err) console.error('Error saving predictions:', err);
    });
}


client.on('messageCreate', message => {
    if (message.author.bot || !message.content.startsWith(prefix)) {
        return;
    }
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'predictround1') {

        // const currentDate = new Date();
        // const endDate = new Date('April 21, 2024');

        // if (currentDate > endDate) {
        //     message.reply('The deadline for predicting has passed.');
        //     return;
        // }

        if (args.length !== 8) {
            message.reply('Please provide predictions for all matchups in Round 1.');
            return;
        }

        const winners = args;
        predictions[message.author.id] = { round1: winners };
        savePredictions();
        message.reply('Round 1 predictions recorded successfully!');
    }

    if (command === 'start') {
        message.reply(`The Round 1 matchups are: 
                                                 ${round1Matchups[0][0]} vs ${round1Matchups[0][1]} 
                                                 ${round1Matchups[1][0]} vs ${round1Matchups[1][1]} 
                                                 ${round1Matchups[2][0]} vs ${round1Matchups[2][1]} 
                                                 ${round1Matchups[3][0]} vs ${round1Matchups[3][1]} 
                                                 ${round1Matchups[4][0]} vs ${round1Matchups[4][1]} 
                                                 ${round1Matchups[5][0]} vs ${round1Matchups[5][1]} 
                                                 ${round1Matchups[6][0]} vs ${round1Matchups[6][1]} 
                                                 ${round1Matchups[7][0]} vs ${round1Matchups[7][1]} \n
                                                 Use commands \"!predictRound1\" \"!predictRound2\" \"!predictRound3\" and \"!predictWinner\" to make predictions \n
                                                 Enter in answers like this: \"!predictRound1 Vegas Jets Preds Kings Lightning Leafs Rangers Canes \n
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

        let round1Points = 0;
        let round2Points = 0;
        let round3Points = 0;
        let round4Points = 0;
        let totalPoints = 0;
        const userPrediction = predictions[message.author.id];


        const teamsR1 = ["Rangers", "Panthers", "Canes", "Oilers", "Avs", "Canucks", "Bruins", "Dallas", "Stars"];

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
                round3Points += 3;
            }
            if (userPrediction.round3.includes("null")) {
                round3Points += 3;
            }
        }
        if (userPrediction.round4) {
            if (userPrediction.round4.includes("null")) {
                round4Points += 5;
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


    if (command === 'predictround2') {

        // const currentDate = new Date();
        // const endDate = new Date('April 21, 2024');

        // if (currentDate > endDate) {
        //     message.reply('The deadline for predicting has passed.');
        //     return;
        // }

        const userPrediction = predictions[message.author.id];
        if (!userPrediction || !userPrediction.round1) {
            message.reply('You must make predictions for Round 1 before predicting for Round 2.');
            return;
        }

        round2Matchups.push([userPrediction.round1[0], userPrediction.round1[1]]);
        round2Matchups.push([userPrediction.round1[2], userPrediction.round1[3]]);
        round2Matchups.push([userPrediction.round1[4], userPrediction.round1[5]]);
        round2Matchups.push([userPrediction.round1[6], userPrediction.round1[7]]);


        if (args.length !== 4) {
            message.reply('Please provide predictions for all matchups in Round 2.');
            return;
        }
        const round2Winners = args;

        predictions[message.author.id].round2 = round2Winners;
        savePredictions();
        message.reply('Round 2 predictions recorded successfully!');
    }


    if (command === 'predictround3') {

        // const currentDate = new Date();
        // const endDate = new Date('April 21, 2024');

        // if (currentDate > endDate) {
        //     message.reply('The deadline for predicting has passed.');
        //     return;
        // }

        const userPrediction = predictions[message.author.id];
        if (!userPrediction || !userPrediction.round1 || !userPrediction.round2) {
            message.reply('You must make predictions for both Rounds 1 and 2 before predicting for Round 3.');
            return;
        }

        round3Matchups.push([userPrediction.round2[0], userPrediction.round2[1]]);
        round3Matchups.push([userPrediction.round2[2], userPrediction.round2[3]]);

        if (args.length !== 2) {
            message.reply('Please provide predictions for both matchups in Round 3.');
            return;
        }
        const round3Winners = args;

        predictions[message.author.id].round3 = round3Winners;
        savePredictions();
        message.reply('Round 3 predictions recorded successfully!');
    }

    if (command === 'predictwinner') {

        // const currentDate = new Date();
        // const endDate = new Date('April 21, 2024');

        // if (currentDate > endDate) {
        //     message.reply('The deadline for predicting has passed.');
        //     return;
        // }

        const userPrediction = predictions[message.author.id];
        if (!userPrediction || !userPrediction.round1 || !userPrediction.round2 || !userPrediction.round3) {
            message.reply('You must make predictions for all three rounds before predicting the Stanley Cup Winner.');
            return;
        }

        round4Matchups.push(userPrediction.round3);

        if (args.length !== 1) {
            message.reply('Please provide a Stanley Cup Winner');
            return;
        }
        const [winnerRound4] = args;

        predictions[message.author.id].round4 = winnerRound4;
        savePredictions();
        message.reply('Stanley Cup Winner recorded successfully!');
    }

    if (command === 'mypredictions') {
        const userPrediction = predictions[message.author.id];
        if (!userPrediction || !userPrediction.round1) {
            message.reply('You have not made predictions for Round 1 yet.');
            return;
        }
        let response = 'Your predictions for Round 1: \n' +
            `\`\`\`yaml\n` +
            `Dallas vs Vegas        : ${userPrediction.round1[0].toUpperCase()}\n` +
            `Jets vs Avs            : ${userPrediction.round1[1].toUpperCase()}\n` +
            `Canucks vs Preds       : ${userPrediction.round1[2].toUpperCase()}\n` +
            `Oilers vs Kings        : ${userPrediction.round1[3].toUpperCase()}\n` +
            `Panthers vs Lightning  : ${userPrediction.round1[4].toUpperCase()}\n` +
            `Bruins vs Leafs        : ${userPrediction.round1[5].toUpperCase()}\n` +
            `Rangers vs Capitals    : ${userPrediction.round1[6].toUpperCase()}\n` +
            `Canes vs Islanders     : ${userPrediction.round1[7].toUpperCase()}\n` +
            `\`\`\``;

        if (userPrediction.round2) {
            response += 'Your predictions for Round 2: \n' +
                `\`\`\`yaml\n` +
                `${userPrediction.round1[0]} vs ${userPrediction.round1[1]} : ${userPrediction.round2[0].toUpperCase()}\n` +
                `${userPrediction.round1[2]} vs ${userPrediction.round1[3]} : ${userPrediction.round2[1].toUpperCase()}\n` +
                `${userPrediction.round1[4]} vs ${userPrediction.round1[5]} : ${userPrediction.round2[2].toUpperCase()}\n` +
                `${userPrediction.round1[6]} vs ${userPrediction.round1[7]} : ${userPrediction.round2[3].toUpperCase()}\n` +
                `\`\`\``;
        }
        if (userPrediction.round3) {
            response += 'Your predictions for Round 3: \n' +
                `\`\`\`yaml\n` +
                `${userPrediction.round2[0]} vs ${userPrediction.round2[1]} : ${userPrediction.round3[0].toUpperCase()}\n` +
                `${userPrediction.round2[2]} vs ${userPrediction.round2[3]} : ${userPrediction.round3[1].toUpperCase()}\n` +
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
        const userPrediction = predictions[message.author.id];
        if (!userPrediction || !userPrediction.round1 || !userPrediction.round2 || !userPrediction.round3 || !userPrediction.round4) {
            message.reply('You must make predictions for all rounds before displaying your bracket.');
            return;
        }


        let response1 =
            `Your Bracket:

            Dallas ------                                                                                                                                                                    ------ Panthers
                                ${userPrediction.round1[0].toUpperCase()} ------                                                                                                                  ------ ${userPrediction.round1[4].toUpperCase()} 
            Vegas  ------                                                                                                                                                                    ------ Lightning
                                                    ${userPrediction.round2[0].toUpperCase()} ----                                                                                    ---- ${userPrediction.round2[2].toUpperCase()} 
            Jets -----                                                                                                                                                                    ------ Bruins
                                ${userPrediction.round1[1].toUpperCase()} ------                                                                                                                  ------ ${userPrediction.round1[5].toUpperCase()} 
            Avs ------                                                                                                                                                                    ------ Leafs
                                                                            ${userPrediction.round3[0].toUpperCase()}    -------    ${userPrediction.round4.toUpperCase()}    -------    ${userPrediction.round3[1].toUpperCase()}

            `;

        let response2 =
            `!
            Canucks --------                                                                                                                                                                    ------ Rangers
                                ${userPrediction.round1[2].toUpperCase()} ------                                                                                                                  ------ ${userPrediction.round1[6].toUpperCase()} 
            Preds -----                                                                                                                                                                    ------ Capitals
                                                    ${userPrediction.round2[1].toUpperCase()} ----                                                                                    ---- ${userPrediction.round2[3].toUpperCase()} 
            Oilers ------                                                                                                                                                                    ------ Canes
                                ${userPrediction.round1[3].toUpperCase()} ------                                                                                                                    ------ ${userPrediction.round1[7].toUpperCase()} 
            Kings -------                                                                                                                                                                    ------ Islanders



            `;

        message.reply(response1);
        message.reply(response2);

    }

});

client.login(process.env.TOKEN);




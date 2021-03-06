import * as  express from "express"
import { BotFrameworkAdapter } from 'botbuilder'
import { BotActivityHandler } from '../infrastructure/BotActivityHandler'
import { MemoryStore } from "../infrastructure/MemoryStore";
import { TeamsConversationRosterProvider } from "../infrastructure/TeamsConversationRosterProvider";
import { PollService } from "../domain";

require('dotenv').config();

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new BotFrameworkAdapter({
    appId: process.env.BotId,
    appPassword: process.env.BotPassword
});

adapter.onTurnError = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${error}`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

const store = new MemoryStore()
const rosterProvider = new TeamsConversationRosterProvider()
const pollService = new PollService({ pollStore: store, questionStore: store, rosterProvider })

// Create bot handlers
const botActivityHandler = new BotActivityHandler({ rosterProvider, pollService, questionStore: store });

// Create HTTP server.
const server = express();
const port = process.env.port || process.env.PORT || 3978;
server.listen(port, () =>
    console.log(`Listening at http://localhost:${port}`)
);

// Listen for incoming requests.
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        // Process bot activity
        await botActivityHandler.run(context);
    });
});

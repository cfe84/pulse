// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TurnContext } from "botbuilder-core";

import {
    MessageFactory,
    TeamsActivityHandler,
    CardFactory
} from 'botbuilder';

export class BotActivityHandler extends TeamsActivityHandler {
    constructor() {
        super();
        this.onMessage(async (context, next) => await this.handleMessagesAsync(context, next));
    }

    private async handleMessagesAsync(context: TurnContext, nextAsync: () => Promise<void>) {
        console.log(context)
        TurnContext.removeRecipientMention(context.activity);
        switch ((context.activity.text || context.activity.value["text"]).trim()) {
            case 'Hello':
                await this.mentionActivityAsync(context);
                break;
            default:
                // By default for unknown activity sent by user show
                // a card with the available actions.
                const card = CardFactory.adaptiveCard({
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.0",
                    "body": [
                        {
                            "type": "TextBlock",
                            "text": JSON.stringify(context, null, 2),
                            "wrap": true
                        },
                        {
                            "type": "Input.Text",
                            "id": "text",
                            "text": "Default text input"
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "OK"
                        }
                    ]
                });

                await context.sendActivity({ attachments: [card] });
                break;
        }
        await nextAsync();
    }

    /**
     * Say hello and @ mention the current user.
     */
    private async mentionActivityAsync(context: TurnContext) {
        const TextEncoder = require('html-entities').XmlEntities;

        const mention = {
            mentioned: context.activity.from,
            text: `<at>${new TextEncoder().encode(context.activity.from.name)}</at>`,
            type: 'mention'
        };

        const replyActivity = MessageFactory.text(`Hi ${mention.text}`);
        replyActivity.entities = [mention];

        await context.sendActivity(replyActivity);
    }
}
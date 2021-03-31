// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { TurnContext } from "botbuilder-core";
import { MessageFactory, TeamsActivityHandler, CardFactory } from 'botbuilder';

import { IPollStore, Poll, PollService, Question } from "../domain";
import { TeamsConversationRosterProvider } from "./TeamsConversationRosterProvider";

export interface BotActivityHandlerDependencies {
    rosterProvider: TeamsConversationRosterProvider
    pollService: PollService
}

const ARGUMENTNAME_QUESTION = "question"
const ARGUMENTNAME_CHOICE = "choice"
const ACTIONNAME_NEW = "new"
const ACTIONNAME_CREATE = "create"
const ACTIONNAME_VIEW = "view"

export class BotActivityHandler extends TeamsActivityHandler {
    constructor(private deps: BotActivityHandlerDependencies) {
        super();
        this.onMessage(async (context, next) => await this.handleMessagesAsync(context, next));
    }

    private async handleMessagesAsync(context: TurnContext, nextAsync: () => Promise<void>) {
        console.log(context)
        TurnContext.removeRecipientMention(context.activity);
        switch ((context.activity.text || context.activity.value["text"]).trim().toLowerCase()) {
            case 'help':
                await this.helpActivityAsync(context);
                break;
            case 'new':
                await this.newPollActivityAsync(context);
                break;
            case 'create':
                await this.createPollActivityAsync(context);
                break;
            default:
                await this.helpActivityAsync(context);
        }
        await nextAsync();
    }


    /**
     * Say hello and @ mention the current user.
     */
    private async sendPollActivityAsync(context: TurnContext) {
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

    private async helpActivityAsync(context: TurnContext) {
        const card = CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "TextBlock",
                    "text": `Hi ${context.activity.from.name}. Pulse allows you to collect anonymous feedback from people in your team. The possible commands are:`,
                    "wrap": true
                },
                {
                    "type": "ActionSet",
                    "separator": "true",
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "New",
                            "data": {
                                "text": ACTIONNAME_NEW
                            }
                        }, {
                            "type": "Action.Submit",
                            "title": "View",
                            "data": {
                                "text": ACTIONNAME_VIEW
                            }
                        }
                    ]
                }
            ],

        });

        await context.sendActivity({ attachments: [card] });
    }


    private async newPollActivityAsync(context: TurnContext) {
        const participants = await this.deps.rosterProvider.getRosterAsync(context)
        const personCount = participants.length
        const choiceCount = 5
        const choiceBody = []
        for (let i = 0; i < choiceCount; i++) {
            choiceBody.push({
                "type": "Input.Text",
                "placeholder": `Choice ${i}`,
                "id": `${ARGUMENTNAME_CHOICE}${i}`
            })
        }
        const card = CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "TextBlock",
                    "text": `The poll will be sent to ${personCount} people`,
                    "wrap": true
                },
                {
                    "type": "Input.Text",
                    "id": ARGUMENTNAME_QUESTION,
                    "placeholder": `Poll question`,
                },
                {
                    "type": "Container",
                    "items": choiceBody
                },
                {
                    "type": "ActionSet",
                    "separator": "true",
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "Create",
                            "data": {
                                "text": ACTIONNAME_CREATE
                            }
                        }
                    ]
                }
            ],

        });

        await context.sendActivity({ attachments: [card] });
    }

    private async createPollActivityAsync(context: TurnContext) {
        const participants = await this.deps.rosterProvider.getRosterAsync(context)
        const questionText = context.activity.value[ARGUMENTNAME_QUESTION]
        const choices = Object.keys(context.activity.value).map(key => {
            if (key.substr(0, 6) === ARGUMENTNAME_CHOICE) {
                return context.activity.value[key]
            }
            return ""
        }).filter(entry => entry !== "")
        const question: Question = {
            question: questionText,
            possibleAnswers: choices
        }
        const poll = await this.deps.pollService.createPollAsync(context, question)

        const card = CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "TextBlock",
                    "text": `Created poll ${poll.id}`,
                    "wrap": true
                },
                {
                    "type": "ActionSet",
                    "separator": "true",
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "New",
                            "data": {
                                "text": "new"
                            }
                        }, {
                            "type": "Action.Submit",
                            "title": "View",
                            "data": {
                                "text": "view"
                            }
                        }
                    ]
                }
            ],

        });

        await context.sendActivity({ attachments: [card] });
    }
}
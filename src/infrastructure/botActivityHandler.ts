import { v4 as uuidv4 } from "uuid"
import { TurnContext } from "botbuilder-core";
import { MessageFactory, TeamsActivityHandler, CardFactory } from 'botbuilder';

import { IPollStore, IQuestionStore, Poll, PollService, Question } from "../domain";
import { TeamsConversationRosterProvider } from "./TeamsConversationRosterProvider";

export interface BotActivityHandlerDependencies {
    rosterProvider: TeamsConversationRosterProvider
    pollService: PollService
    questionStore: IQuestionStore,
}

const ARGUMENTNAME_QUESTION = "question"
const ARGUMENTNAME_QUESTIONID = "questionId"
const ARGUMENTNAME_CHOICE = "choice"
const ACTIONNAME_NEW_QUESTION = "new question"
const ACTIONNAME_NEW_POLL = "new poll"
const ACTIONNAME_CREATE_QUESTION = "create question"
const ACTIONNAME_CREATE_POLL = "create poll"
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
            case ACTIONNAME_NEW_QUESTION:
                await this.newQuestionAsync(context);
                break;
            case ACTIONNAME_CREATE_QUESTION:
                await this.createQuestionActivityAsync(context);
                break;
            case ACTIONNAME_NEW_POLL:
                await this.newPollAsync(context)
                break;
            case ACTIONNAME_CREATE_POLL:
                await this.createPollActivityAsync(context)
                break
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
                            "title": "New question",
                            "data": {
                                "text": ACTIONNAME_NEW_QUESTION
                            }
                        },
                        {
                            "type": "Action.Submit",
                            "title": "New poll",
                            "data": {
                                "text": ACTIONNAME_NEW_POLL
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


    private async newQuestionAsync(context: TurnContext) {
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
                    "text": `Create a new question`,
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
                                "text": ACTIONNAME_CREATE_QUESTION
                            }
                        }
                    ]
                }
            ],

        });

        await context.sendActivity({ attachments: [card] });
    }

    private async createQuestionActivityAsync(context: TurnContext) {
        const questionText = context.activity.value[ARGUMENTNAME_QUESTION]
        const choices = Object.keys(context.activity.value).map(key => {
            if (key.substr(0, 6) === ARGUMENTNAME_CHOICE) {
                return context.activity.value[key]
            }
            return ""
        }).filter(entry => entry !== "")
        const question: Question = {
            id: uuidv4(),
            question: questionText,
            possibleAnswers: choices
        }
        await this.deps.questionStore.saveQuestionAsync(question)

        const card = CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "TextBlock",
                    "text": `Created question ${question.id}`,
                    "wrap": true
                },
                {
                    "type": "ActionSet",
                    "separator": "true",
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "Create a poll with this question",
                            "data": {
                                "text": ACTIONNAME_CREATE_POLL,
                                ARGUMENTNAME_QUESTIONID: question.id
                            }
                        }
                    ]
                }
            ],

        });

        await context.sendActivity({ attachments: [card] });
    }



    private async newPollAsync(context: TurnContext) {
        const questions = await this.deps.questionStore.getQuestionsAsync()
        const formattedQuestions = questions.map(question => ({
            "title": question.question,
            "value": question.id
        }))
        const card = CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "TextBlock",
                    "text": `Create a poll with the following question:`,
                    "wrap": true
                },
                {
                    "type": "Input.ChoiceSet",
                    "id": ARGUMENTNAME_QUESTIONID,
                    "value": "1",
                    "choices": formattedQuestions
                },
                {
                    "type": "ActionSet",
                    "separator": "true",
                    "actions": [
                        {
                            "type": "Action.Submit",
                            "title": "Create poll",
                            "data": {
                                "text": ACTIONNAME_CREATE_POLL
                            }
                        }
                    ]
                }
            ],

        });

        await context.sendActivity({ attachments: [card] });
    }

    private async createPollActivityAsync(context: TurnContext) {
        const questionId = context.activity.value[ARGUMENTNAME_QUESTIONID]
        const poll = await this.deps.pollService.createPollAsync(context, questionId)

        const card = CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "TextBlock",
                    "text": `Created poll ${poll.id} and sent to ${poll.participants.length} people`,
                    "wrap": true
                }
            ],

        });

        await context.sendActivity({ attachments: [card] });
    }
}
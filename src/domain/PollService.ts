import { AggregatedAnswers, Answer, IPollStore, IQuestionStore, IRosterProvider, Poll, Question } from "."
import { v4 as uuidv4 } from "uuid"

export interface PollServiceDependencies {
  rosterProvider: IRosterProvider
  pollStore: IPollStore
  questionStore: IQuestionStore
}

export const POLLSERVICE_ERROR = {
  INVALID_ANSWER: "Invalid answer",
  DUPLICATE_ANSWER: "Duplicate answer"
}

export class PollService {
  constructor(private deps: PollServiceDependencies) { }

  async createPollAsync(context: any, questionId: string): Promise<Poll> {
    const participants = await this.deps.rosterProvider.getRosterAsync(context)
    const poll: Poll = {
      answers: [],
      createdTimestamp: Date.now(),
      id: uuidv4(),
      questionId,
      respondentIds: [],
      participants
    }
    await this.deps.pollStore.savePollAsync(poll)
    return poll
  }

  async answerPollAsync(pollId: string, respondentId: string, answer: string): Promise<void> {
    const poll = await this.deps.pollStore.getPollAsync(pollId)
    const question = await this.deps.questionStore.getQuestionAsync(poll.questionId)

    answer = answer.trim()
    const correspondingPossibleAnswer = question.possibleAnswers.find(
      (possibleAnswer) => possibleAnswer.localeCompare(answer, undefined, { sensitivity: 'base' }) === 0)
    if (correspondingPossibleAnswer === undefined) {
      throw Error(POLLSERVICE_ERROR.INVALID_ANSWER)
    }
    const respondentAlreadyAnswered = poll.respondentIds.indexOf(respondentId) >= 0
    if (respondentAlreadyAnswered) {
      throw Error(POLLSERVICE_ERROR.DUPLICATE_ANSWER)
    }

    const answerObj: Answer = {
      answer: correspondingPossibleAnswer,
      answeredTimestamp: Date.now()
    }
    poll.answers.push(answerObj)
    poll.respondentIds.push(respondentId)
    await this.deps.pollStore.savePollAsync(poll)
  }

  async getAggregatedPollAnswersAsync(pollId: string): Promise<AggregatedAnswers> {
    const poll = await this.deps.pollStore.getPollAsync(pollId)
    const question = await this.deps.questionStore.getQuestionAsync(poll.questionId)

    return {
      answers: question.possibleAnswers.map(possibleAnswer => ({
        answer: possibleAnswer,
        count: poll.answers.filter(answer => answer.answer === possibleAnswer).length
      })),
      totalAnswers: poll.answers.length
    }
  }
}
import { IPollStore, IRosterProvider, Poll, Question } from "."
import { v4 as uuidv4 } from "uuid"

export interface PollServiceDependencies {
  rosterProvider: IRosterProvider
  pollStore: IPollStore
}

export class PollService {
  constructor(private deps: PollServiceDependencies) { }

  async createPollAsync(contextId: string, question: Question): Promise<Poll> {
    const participants = await this.deps.rosterProvider.getRosterAsync(contextId)
    const poll: Poll = {
      answers: [],
      createdTimestamp: Date.now(),
      id: uuidv4(),
      contextId: contextId,
      question: question,
      respondentIds: [],
      participants
    }
    await this.deps.pollStore.savePollAsync(poll)
    return poll
  }
}
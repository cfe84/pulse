import { IPollStore, IQuestionStore, Poll, Question } from "../domain";

export class MemoryStore implements IPollStore, IQuestionStore {
  getQuestionsAsync(): Promise<Question[]> {
    return Promise.resolve(Object.keys(this.questionStore).map(key => this.questionStore[key]));
  }

  private pollStore: { [id: string]: Poll } = {

  }

  private questionStore: { [id: string]: Question } = {
    "123": {
      id: "123",
      possibleAnswers: ["Not happy at all", "Somewhat happy", "Happy", "Very Happy", "Couldn't be better"],
      question: "How happy are you with your job?"
    }
  }

  getQuestionAsync(questionId: string): Promise<Question> {
    return Promise.resolve(this.questionStore[questionId])
  }
  saveQuestionAsync(question: Question): Promise<void> {
    this.questionStore[question.id] = question
    return Promise.resolve()
  }

  savePollAsync(poll: Poll): Promise<void> {
    this.pollStore[poll.id] = poll
    return Promise.resolve()
  }
  getPollAsync(pollId: string): Promise<Poll> {
    return Promise.resolve(this.pollStore[pollId])
  }

}
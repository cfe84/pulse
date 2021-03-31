import { Question } from ".";

export interface IQuestionStore {
  getQuestionAsync(questionId: string): Promise<Question>
  saveQuestionAsync(question: Question): Promise<Question>
}
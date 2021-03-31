import { Question } from ".";

export interface IQuestionStore {
  getQuestionAsync(questionId: string): Promise<Question>
  getQuestionsAsync(): Promise<Question[]>
  saveQuestionAsync(question: Question): Promise<void>
}
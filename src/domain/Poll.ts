import { Answer, Participant, Question } from ".";

export interface Poll {
  id: string
  contextId: string
  participants: Participant[]
  respondentIds: string[]
  question: Question
  answers: Answer[]
  createdTimestamp: number
}
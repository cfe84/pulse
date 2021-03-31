import { Answer, Participant, Question } from ".";

export interface Poll {
  id: string
  participants: Participant[]
  respondentIds: string[]
  questionId: string
  answers: Answer[]
  createdTimestamp: number
}
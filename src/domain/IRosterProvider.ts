import { Participant, Roster } from ".";

export interface IRosterProvider {
  getRosterAsync(contextId: string): Promise<Participant[]>
}
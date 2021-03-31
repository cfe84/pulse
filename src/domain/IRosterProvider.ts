import { Participant, Roster } from ".";

export interface IRosterProvider {
  getRosterAsync(context: any): Promise<Participant[]>
}
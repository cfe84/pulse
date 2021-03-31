import { Poll } from ".";

export interface IPollStore {
  savePollAsync(poll: Poll): Promise<void>
  getPollAsync(pollId: string): Promise<Poll>
}
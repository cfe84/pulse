import { IPollStore, Poll } from "../domain";

export class MemoryStore implements IPollStore {
  private store: { [id: string]: Poll } = {}
  savePollAsync(poll: Poll): Promise<void> {
    this.store[poll.id] = poll
    return Promise.resolve()
  }
  getPollAsync(pollId: string): Promise<Poll> {
    return Promise.resolve(this.store[pollId])
  }

}
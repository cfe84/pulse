import { Participant, PollService, Question } from "../src/domain"
import * as should from "should"
import * as td from "testdouble"

describe("PollService", () => {
  context("Create poll", async () => {
    // given
    const participants: Participant[] = [
      { id: "123", name: "sdfs" },
      { id: "456", name: "abcd" },
    ]
    const rosterProvider = td.object(["getRosterAsync"])
    const pollStore = td.object(["savePollAsync", "getPollAsync"])
    const contextId = "sdafsdf"
    const deps = { rosterProvider, pollStore }
    const pollService = new PollService(deps)
    const question: Question = {
      possibleAnswers: ["1", "2", "3"],
      question: "How much"
    }
    td.when(rosterProvider.getRosterAsync(contextId)).thenResolve(participants)

    // when
    const poll = await pollService.createPollAsync(contextId, question)

    // then
    it("saves the date time of poll creation", () => should(poll.createdTimestamp).be.approximately(Date.now(), 200))
    it("creates an empty set of answers", () => should(poll.answers).be.empty())
    it("creates an empty set of respondents", () => should(poll.respondentIds).be.empty())
    it("creates a non-empty poll id", () => should(poll.id.length).greaterThan(0))
    it("saves context id", () => should(poll.contextId).eql(contextId))
    it("saves participants", () => { should(poll.participants).eql(participants) })
    it("saves poll", () => td.verify(pollStore.savePollAsync(poll)))
  })
})
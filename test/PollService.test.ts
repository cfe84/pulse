import { Answer, Participant, Poll, PollService, Question } from "../src/domain"
import * as should from "should"
import * as td from "testdouble"
import { v4 as uuidv4 } from "uuid"
import { POLLSERVICE_ERROR } from "../src/domain/PollService"

describe("PollService", () => {

  const participants: Participant[] = [
    { id: "123", name: "sdfs" },
    { id: "456", name: "abcd" },
    { id: "789", name: "1234" },
    { id: "abc", name: "berns" },
  ]

  const question: Question = {
    possibleAnswers: ["1", "2", "3", "do not know"],
    question: "How much"
  }

  const contextId = "context-id-123"
  const pollId = "poll-id-123"

  const createFakePoll = (): Poll => ({
    answers: [],
    createdTimestamp: Date.now(),
    id: pollId,
    contextId: contextId,
    question: question,
    respondentIds: [],
    participants
  })

  function createFakeRosterProvider() {
    return td.object(["getRosterAsync"])
  }

  function createFakePollStore() {
    return td.object(["savePollAsync", "getPollAsync"])
  }

  function createFakeDeps() {

    const rosterProvider = createFakeRosterProvider()
    const pollStore = createFakePollStore()
    return { rosterProvider, pollStore }
  }

  context("Create poll", async () => {
    // given
    const deps = createFakeDeps()
    const pollService = new PollService(deps)
    td.when(deps.rosterProvider.getRosterAsync(contextId)).thenResolve(participants)

    // when
    const poll = await pollService.createPollAsync(contextId, question)

    // then
    it("saves the date time of poll creation", () => should(poll.createdTimestamp).be.approximately(Date.now(), 200))
    it("creates an empty set of answers", () => should(poll.answers).be.empty())
    it("creates an empty set of respondents", () => should(poll.respondentIds).be.empty())
    it("creates a non-empty poll id", () => should(poll.id.length).greaterThan(0))
    it("saves context id", () => should(poll.contextId).eql(contextId))
    it("saves participants", () => { should(poll.participants).eql(participants) })
    it("saves poll", () => td.verify(deps.pollStore.savePollAsync(poll)))
  })

  context("Answer poll", async () => {
    // given
    const deps = createFakeDeps()
    const respondentId = participants[1].id
    const pollService = new PollService(deps)
    const poll = createFakePoll()
    td.when(deps.pollStore.getPollAsync(pollId)).thenResolve(poll)

    it("rejects incorrect answer", async () => {
      // when
      const answer = "10"
      await should(pollService.answerPollAsync(poll.id, respondentId, answer)).rejectedWith(POLLSERVICE_ERROR.INVALID_ANSWER)
    })

    it("saves correct answer, standardized", async () => {
      // when
      await pollService.answerPollAsync(poll.id, respondentId, " Do not Know ")
      td.verify(deps.pollStore
        .savePollAsync(td.matchers.argThat((poll: Poll) =>
          poll.id === poll.id &&
          poll.answers[0].answer === "do not know"
        )))
    })

    it("reject second answer", async () => {
      // when
      const answer = "1"
      await should(pollService.answerPollAsync(poll.id, respondentId, answer)).be.rejectedWith(POLLSERVICE_ERROR.DUPLICATE_ANSWER)
    })
  })

  context("Get answers", async () => {
    // given
    const deps = createFakeDeps()
    const pollService = new PollService(deps)
    let poll = createFakePoll()
    td.when(deps.pollStore.getPollAsync(pollId)).thenResolve(poll)
    td.when(deps.pollStore.savePollAsync(td.matchers.anything)).thenDo((p: Poll) => poll = p)

    // when
    await pollService.answerPollAsync(poll.id, participants[0].id, "1")
    await pollService.answerPollAsync(poll.id, participants[1].id, "2")
    await pollService.answerPollAsync(poll.id, participants[2].id, "1")

    // then
    const answers = await pollService.getAggregatedPollAnswersAsync(poll.id)
    it("finds the correct count", () => should(answers.totalAnswers).eql(3))
    it("aggregates correctly", () => {
      should(answers.answers.find(answer => answer.answer === "1")?.count).eql(2)
      should(answers.answers.find(answer => answer.answer === "2")?.count).eql(1)
    })
    it("shows answers with 0 answers", () => {
      should(answers.answers.find(answer => answer.answer === "3")?.count).eql(0)
    })
  })
})



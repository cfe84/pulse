import * as builder from "botbuilder"
import { TeamsInfo } from "botbuilder";

import { IRosterProvider, Participant } from "../domain";

export class TeamsConversationRosterProvider implements IRosterProvider {

  async getRosterAsync(context: any): Promise<Participant[]> {
    const members = await TeamsInfo.getMembers(context as builder.TurnContext)
    const participants: Participant[] = members.map(member => ({
      id: member.id,
      name: member.name
    }))
    return participants
  }
}
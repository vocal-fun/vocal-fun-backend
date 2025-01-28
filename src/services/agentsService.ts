import { Agent } from "../models/agent"

export const getAllAgents = async () => {
    let agents = await Agent.find()
    return agents
}
import { AtpAgent } from "@atproto/api";

export function createAgent(pdsUrl: string) {
  return new AtpAgent({ service: pdsUrl });
}

export async function login(agent: AtpAgent, handle: string, appPassword: string) {
  await agent.login({ identifier: handle, password: appPassword });
  if (!agent.session) throw new Error("Login failed");
  return agent.session;
}

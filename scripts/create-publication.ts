import fs from "fs";
import { createAgent, login } from "../src/lib/atproto.ts";
import { TID } from "@atproto/common-web";

const handle = process.env.ATPROTO_HANDLE;
const appPassword = process.env.ATPROTO_APP_PASSWORD;
const pdsUrl = process.env.ATPROTO_PDS_URL || "https://bsky.social";

if (!handle || !appPassword) {
  console.error("Missing required environment variables: ATPROTO_HANDLE, ATPROTO_APP_PASSWORD");
  process.exit(1);
}

const agent = createAgent(pdsUrl);
const session = await login(agent, handle, appPassword);
const did = session.did;

const tid = TID.nextStr();
const result = await agent.com.atproto.repo.createRecord({
  repo: did,
  collection: "site.standard.publication",
  rkey: tid,
  record: {
    $type: "site.standard.publication",
    name: "Chris Parsons",
    url: "https://chrisparsons.dev",
    description: "Blog of Chris Parsons",
  },
});

const syncStatePath = ".atproto-sync.json";
let syncState: any = { posts: {} };
if (fs.existsSync(syncStatePath)) {
  syncState = JSON.parse(fs.readFileSync(syncStatePath, "utf-8"));
}

syncState.publication = {
  uri: result.data.uri,
  rkey: tid,
};

fs.writeFileSync(syncStatePath, JSON.stringify(syncState, null, 2));

console.log("Publication created!");
console.log("AT-URI:", result.data.uri);
console.log("Rkey:", tid);

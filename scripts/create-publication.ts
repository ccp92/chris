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

// 1. READ SYNC STATE FIRST
const syncStatePath = ".atproto-sync.json";
let syncState: any = { posts: {} };
if (fs.existsSync(syncStatePath)) {
  syncState = JSON.parse(fs.readFileSync(syncStatePath, "utf-8"));
}

const agent = createAgent(pdsUrl);
const session = await login(agent, handle, appPassword);
const did = session.did;

// 2. REUSE EXISTING RKEY OR MINT A NEW ONE
const rkey = syncState.publication?.rkey || TID.nextStr();

// 3. USE PUTRECORD FOR IDEMPOTENT UPSERT
const result = await agent.com.atproto.repo.putRecord({
  repo: did,
  collection: "site.standard.publication",
  rkey: rkey,
  record: {
    $type: "site.standard.publication",
    name: "Chris Parsons",
    url: "https://chrisparsons.dev",
    description: "Blog of Chris Parsons",
  },
});

// 4. SAVE STATE BACK TO FILE
syncState.publication = {
  uri: result.data.uri,
  rkey: rkey,
};

fs.writeFileSync(syncStatePath, JSON.stringify(syncState, null, 2));

console.log("Publication processed successfully (upserted)!");
console.log("AT-URI:", result.data.uri);
console.log("Rkey:", rkey);

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { slugify } from "../src/lib/slug.ts";
import { TID } from "@atproto/common-web";
import { createAgent, login } from "../src/lib/atproto.ts";

const handle = process.env.ATPROTO_HANDLE;
const appPassword = process.env.ATPROTO_APP_PASSWORD;
const pdsUrl = process.env.ATPROTO_PDS_URL || "https://bsky.social";

if (!handle || !appPassword) {
  console.error("Missing required environment variables: ATPROTO_HANDLE, ATPROTO_APP_PASSWORD");
  console.error("Skipping ATproto sync.");
  process.exit(0);
}

const syncStatePath = ".atproto-sync.json";
let syncState: any = { posts: {} };
if (fs.existsSync(syncStatePath)) {
  syncState = JSON.parse(fs.readFileSync(syncStatePath, "utf-8"));
}

if (!syncState.publication) {
  console.error("No publication found. Run: bun run scripts/create-publication.ts");
  process.exit(1);
}

const agent = createAgent(pdsUrl);
const session = await login(agent, handle, appPassword);
const did = session.did;

// Index existing documents on the PDS by path, so posts missing from the
// local sync state reuse their record instead of creating a duplicate.
const existingRkeysByPath = new Map<string, string[]>();
const existingRecordsByRkey = new Map<string, unknown>();
let cursor: string | undefined;
do {
  const res = await agent.com.atproto.repo.listRecords({
    repo: did,
    collection: "site.standard.document",
    limit: 100,
    cursor,
  });
  for (const record of res.data.records) {
    const value = record.value as any;
    if (value.site !== syncState.publication.uri) continue;
    const rkey = record.uri.split("/").pop()!;
    existingRecordsByRkey.set(rkey, value);
    const rkeys = existingRkeysByPath.get(value.path) ?? [];
    rkeys.push(rkey);
    existingRkeysByPath.set(value.path, rkeys);
  }
  cursor = res.data.cursor;
} while (cursor);

for (const [recordPath, rkeys] of existingRkeysByPath) {
  if (rkeys.length > 1) {
    console.warn(`Warning: ${rkeys.length} documents found for ${recordPath}: ${rkeys.join(", ")}`);
  }
}

// JSON with sorted object keys, so records compare equal regardless of key order.
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v
  );
}

function getMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function markdownToPlainText(md: string): string {
  return (
    md
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`(.+?)`/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/^\s*>\s+/gm, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

const blogDir = "./src/content/blog";
const files = getMarkdownFiles(blogDir);
let publishedCount = 0;

for (const filePath of files) {
  const relativePath = path.relative(blogDir, filePath);
  const id = relativePath.replace(/\.md$/, "");
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = matter(content);

  const postData = parsed.data;
  const markdownBody = parsed.content;
  const plainText = markdownToPlainText(markdownBody);

  const slugId = id.split("/").map(slugify).join("/");
  const urlPath = `/blog/${slugId}`;

  console.log(`Syncing: ${postData.title} (${id})`);

  const documentRecord: any = {
    $type: "site.standard.document",
    title: postData.title,
    site: syncState.publication.uri,
    path: urlPath,
    publishedAt: new Date(postData.pubDate).toISOString(),
    content: {
      $type: "site.standard.content.markdown",
      text: markdownBody.trim(),
      version: "1.0",
    },
    textContent: plainText.slice(0, 2000),
  };

  if (postData.description) {
    documentRecord.description = postData.description;
  }
  if (postData.tags?.length) {
    documentRecord.tags = postData.tags;
  }

  const postState = syncState.posts[slugId] || {};
  const documentRkey =
    postState.documentRkey || existingRkeysByPath.get(urlPath)?.[0] || TID.nextStr();

  const existingRecord = existingRecordsByRkey.get(documentRkey);
  if (existingRecord && stableStringify(existingRecord) === stableStringify(documentRecord)) {
    console.log("  Unchanged, skipping write");
  } else {
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: "site.standard.document",
      rkey: documentRkey,
      record: documentRecord,
    });
    publishedCount++;
    console.log(existingRecord ? "  Updated" : "  Created");
  }

  syncState.posts[slugId] = {
    documentUri: `at://${did}/site.standard.document/${documentRkey}`,
    documentRkey,
    publishedAt: postData.pubDate,
  };

  console.log(`  Document: ${syncState.posts[slugId].documentUri}`);
}

fs.writeFileSync(syncStatePath, JSON.stringify(syncState, null, 2));

const wellKnownContent = syncState.publication.uri;
const wellKnownDir = "public/.well-known";
fs.mkdirSync(wellKnownDir, { recursive: true });
fs.writeFileSync(path.join(wellKnownDir, "site.standard.publication"), wellKnownContent);

if (fs.existsSync("dist")) {
  const distWellKnownDir = "dist/.well-known";
  fs.mkdirSync(distWellKnownDir, { recursive: true });
  fs.writeFileSync(path.join(distWellKnownDir, "site.standard.publication"), wellKnownContent);
}

console.log(
  publishedCount > 0
    ? `\nSync complete! Published ${publishedCount} post(s).`
    : `\nSync complete! Checked ${files.length} post(s), no changes.`
);

import { useEffect, useState } from "preact/hooks";

interface Props {
  bskyPostUri: string;
}

interface Reply {
  post: {
    author: {
      displayName?: string;
      handle: string;
    };
    record: {
      text: string;
    };
    indexedAt: string;
  };
}

interface ThreadData {
  thread?: {
    post?: {
      author: {
        handle: string;
      };
    };
    replies?: Array<{
      $type: string;
      post: Reply["post"];
    }>;
  };
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function parseBskyUrl(url: string): { handle: string; rkey: string } | null {
  const match = url.match(
    /https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/,
  );
  if (match) {
    return { handle: decodeURIComponent(match[1]), rkey: match[2] };
  }
  return null;
}

async function resolveHandle(handle: string): Promise<string> {
  const res = await fetch(
    "https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=" +
      encodeURIComponent(handle),
  );
  const data = await res.json();
  return data.did;
}

async function getAtUri(uri: string): Promise<string> {
  if (uri.startsWith("at://")) {
    return uri;
  }
  const parsed = parseBskyUrl(uri);
  if (!parsed) {
    return uri;
  }
  const did = await resolveHandle(parsed.handle);
  return "at://" + did + "/app.bsky.feed.post/" + parsed.rkey;
}

export default function Comments({ bskyPostUri }: Props) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; error: Error }
    | { status: "empty"; authorHandle: string; rkey: string }
    | { status: "loaded"; replies: Reply[]; authorHandle: string; rkey: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getAtUri(bskyPostUri)
      .then(async (uri) => {
        const res = await fetch(
          "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=" +
            encodeURIComponent(uri) +
            "&depth=1",
        );
        const data: ThreadData = await res.json();

        if (cancelled) return;

        const replies =
          data.thread && data.thread.replies ? data.thread.replies : [];
        const authorHandle =
          data.thread && data.thread.post && data.thread.post.author
            ? data.thread.post.author.handle
            : "";
        const rkey = uri.split("/").pop() || "";

        if (replies.length === 0) {
          setState({ status: "empty", authorHandle, rkey });
          return;
        }

        const validReplies = replies
          .filter((r) => r.$type === "app.bsky.feed.defs#threadViewPost")
          .map((r) => ({ post: r.post }));

        setState({ status: "loaded", replies: validReplies, authorHandle, rkey });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ status: "error", error: err });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bskyPostUri]);

  if (state.status === "loading") {
    return <p class="comments-loading">Loading comments...</p>;
  }

  if (state.status === "error") {
    return <p class="comments-loading">Failed to load comments.</p>;
  }

  if (state.status === "empty") {
    return (
      <p class="no-comments">
        No comments yet.{" "}
        <a
          href={`https://bsky.app/profile/${encodeURIComponent(state.authorHandle)}/post/${encodeURIComponent(state.rkey)}`}
          target="_blank"
          rel="noopener"
        >
          Reply on Bluesky
        </a>{" "}
        to join the discussion.
      </p>
    );
  }

  return (
    <>
      <div class="comments-list">
        {state.replies.map((reply) => {
          const time = new Date(reply.post.indexedAt).toLocaleDateString(
            "en-GB",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            },
          );
          return (
            <div class="comment" key={reply.post.indexedAt + reply.post.author.handle}>
              <div class="comment-author">
                {reply.post.author.displayName || reply.post.author.handle}
              </div>
              <div class="comment-text">{reply.post.record.text}</div>
              <div class="comment-time">{time}</div>
            </div>
          );
        })}
      </div>
      <p class="reply-link">
        <a
          href={`https://bsky.app/profile/${encodeURIComponent(state.authorHandle)}/post/${encodeURIComponent(state.rkey)}`}
          target="_blank"
          rel="noopener"
        >
          Reply on Bluesky →
        </a>
      </p>
    </>
  );
}

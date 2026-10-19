import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { processContent } from "../src/lib/content";
import { pageHref } from "../src/lib/pagination";
import { verifySignature } from "../src/lib/signature";

test("Webhook の署名が正しければ受け付ける", () => {
  const body = JSON.stringify({ api: "blogs", id: "abc", type: "edit" });
  const signature = createHmac("sha256", "secret").update(body).digest("hex");
  assert.equal(verifySignature(body, signature, "secret"), true);
});

test("署名が無い・違う・本文が改ざんされている場合は拒否する", () => {
  const body = JSON.stringify({ api: "blogs" });
  const signature = createHmac("sha256", "secret").update(body).digest("hex");
  assert.equal(verifySignature(body, null, "secret"), false);
  assert.equal(verifySignature(body, "invalid", "secret"), false);
  assert.equal(verifySignature(body + " ", signature, "secret"), false);
  assert.equal(verifySignature(body, signature, "other-secret"), false);
});

test("ページ送りのURL：1ページ目はベースのURL、2ページ目以降は /page/n", () => {
  assert.equal(pageHref("/", 1), "/");
  assert.equal(pageHref("/", 2), "/page/2");
  assert.equal(pageHref("/category/news", 3), "/category/news/page/3");
});

test("見出しにIDを付けて目次を作り、外部リンクは新しいタブで開く", () => {
  const { html, toc } = processContent('<h2>概要</h2><p><a href="https://example.com">外部</a></p><h3>詳細</h3>');
  assert.deepEqual(toc, [
    { id: "heading-1", text: "概要", level: 2 },
    { id: "heading-2", text: "詳細", level: 3 },
  ]);
  assert.match(html, /<h2 id="heading-1">/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
});

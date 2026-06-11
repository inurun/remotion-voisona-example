type RichTextElementTag = "em" | "h1" | "h2" | "img" | "li" | "mark" | "ol" | "p" | "strong" | "ul";

export type RichTextNode =
  | {
      children: RichTextNode[];
      type: "root";
    }
  | {
      attributes: Record<string, string>;
      children: RichTextNode[];
      tagName: RichTextElementTag;
      type: "element";
    }
  | {
      text: string;
      type: "text";
    };

function isWhitespaceText(node: RichTextNode) {
  return node.type === "text" && !node.text.trim();
}

function getMeaningfulChildren(node: Extract<RichTextNode, { type: "root" | "element" }>) {
  return node.children.filter((child) => !isWhitespaceText(child));
}

export function isSingleImageRichTextNode(node: RichTextNode): boolean {
  if (node.type === "text") {
    return false;
  }

  const children = getMeaningfulChildren(node);
  if (children.length !== 1) {
    return false;
  }

  const [onlyChild] = children;
  return onlyChild?.type === "element" && onlyChild.tagName === "img";
}

export function isSingleImageRichText(html: string) {
  return isSingleImageRichTextNode(parseRichText(html));
}

const ALLOWED_TAGS = new Set<RichTextElementTag>([
  "em",
  "h1",
  "h2",
  "img",
  "li",
  "mark",
  "ol",
  "p",
  "strong",
  "ul",
]);

function decodeHtml(value: string) {
  return value
    .replaceAll(/&nbsp;/gi, " ")
    .replaceAll(/&amp;/gi, "&")
    .replaceAll(/&lt;/gi, "<")
    .replaceAll(/&gt;/gi, ">")
    .replaceAll(/&quot;/gi, '"')
    .replaceAll(/&#39;/gi, "'");
}

function parseTagAttributes(source: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([^\s=]+)\s*=\s*"([^"]*)"/g;

  for (const match of source.matchAll(attributePattern)) {
    const [, key, value] = match;
    if (!key) {
      continue;
    }
    attributes[key] = decodeHtml(value ?? "");
  }

  return attributes;
}

export function parseRichText(html: string): RichTextNode {
  const root: RichTextNode = { children: [], type: "root" };
  const stack: RichTextNode[] = [root];
  const tokenPattern = /<\/?[^>]+>|[^<]+/g;

  for (const match of html.matchAll(tokenPattern)) {
    const token = match[0];
    if (!token) {
      continue;
    }

    if (token.startsWith("</")) {
      const tagName = token.slice(2, -1).trim().toLowerCase();
      if (ALLOWED_TAGS.has(tagName as RichTextElementTag) && stack.length > 1) {
        stack.pop();
      }
      continue;
    }

    if (token.startsWith("<")) {
      const openingTag = token.slice(1, -1).trim();
      const isSelfClosing = openingTag.endsWith("/");
      const cleanedTag = isSelfClosing ? openingTag.slice(0, -1).trim() : openingTag;
      const spaceIndex = cleanedTag.search(/\s/);
      const rawTagName = (
        spaceIndex === -1 ? cleanedTag : cleanedTag.slice(0, spaceIndex)
      ).toLowerCase();

      if (!ALLOWED_TAGS.has(rawTagName as RichTextElementTag)) {
        continue;
      }

      const node: RichTextNode = {
        attributes: parseTagAttributes(spaceIndex === -1 ? "" : cleanedTag.slice(spaceIndex + 1)),
        children: [],
        tagName: rawTagName as RichTextElementTag,
        type: "element",
      };
      const parent = stack[stack.length - 1];
      if (parent.type === "element" || parent.type === "root") {
        parent.children.push(node);
      }

      if (!isSelfClosing && rawTagName !== "img") {
        stack.push(node);
      }

      continue;
    }

    const text = decodeHtml(token);
    if (!text) {
      continue;
    }

    const parent = stack[stack.length - 1];
    if (parent.type === "element" || parent.type === "root") {
      parent.children.push({
        text,
        type: "text",
      });
    }
  }

  return root;
}

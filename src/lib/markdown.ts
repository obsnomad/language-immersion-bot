function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function isSafeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function wrapLists(value: string): string {
  return value.replace(/(?:^|\n)((?:<li>[^\n]*<\/li>\n?)+)/g, (_match, list) => {
    const items = list.replace(/\n/g, '');
    return `<ul>${items}</ul>`;
  });
}

export function markdownToHtml(markdown: string): string {
  const blocks: string[] = [];
  const inlines: string[] = [];

  let text = markdown.replace(/\r\n/g, '\n');

  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_match, _language, code) => {
    const index = blocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`) - 1;
    return `\u0000BLOCK_${index}\u0000`;
  });

  text = text.replace(/`([^`\n]+)`/g, (_match, code) => {
    const index = inlines.push(`<code>${escapeHtml(code)}</code>`) - 1;
    return `\u0000INLINE_${index}\u0000`;
  });

  text = escapeHtml(text);

  text = text.replace(
    /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label, url) => {
      if (!isSafeUrl(url)) return label;
      return `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${label}</a>`;
    },
  );

  text = text.replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>');
  text = text.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  text = wrapLists(text);
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  text = text.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');
  text = text.replace(/(^|[^\w*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  text = text.replace(/(^|[^\w_])_([^_\n]+)_/g, '$1<em>$2</em>');
  text = text.replace(/^&gt;\s?(.+)$/gm, '<blockquote>$1</blockquote>');

  text = text.replace(/\u0000INLINE_(\d+)\u0000/g, (_match, index) => inlines[Number(index)] ?? '');
  text = text.replace(/\u0000BLOCK_(\d+)\u0000/g, (_match, index) => blocks[Number(index)] ?? '');
  text = text.replace(/\n{2,}/g, '<br><br>');
  text = text.replace(/\n/g, '<br>');

  return text;
}

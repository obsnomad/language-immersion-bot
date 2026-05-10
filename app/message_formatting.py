import html
import re

_SEGMENT_PATTERN = re.compile(
    r"```(?P<fence>[\s\S]+?)```|`(?P<code>[^`\n]+)`|\*\*(?P<strong>.+?)\*\*|\*(?P<em>[^*\n]+)\*|__(?P<u>.+?)__|_(?P<i>[^_\n]+)_",
    re.DOTALL,
)


def _render_plain_text(text: str) -> str:
    return html.escape(text)


def _render_segment(match: re.Match[str]) -> str:
    groups = match.groupdict()
    if groups["fence"] is not None:
        return f"<pre>{html.escape(groups['fence'].strip())}</pre>"
    if groups["code"] is not None:
        return f"<code>{html.escape(groups['code'])}</code>"
    if groups["strong"] is not None:
        return f"<b>{render_markdown(groups['strong'])}</b>"
    if groups["em"] is not None:
        return f"<i>{render_markdown(groups['em'])}</i>"
    if groups["u"] is not None:
        return f"<u>{render_markdown(groups['u'])}</u>"
    if groups["i"] is not None:
        return f"<i>{render_markdown(groups['i'])}</i>"
    return _render_plain_text(match.group(0))


def render_markdown(text: str) -> str:
    parts: list[str] = []
    cursor = 0

    for match in _SEGMENT_PATTERN.finditer(text):
        start, end = match.span()
        parts.append(_render_plain_text(text[cursor:start]))
        parts.append(_render_segment(match))
        cursor = end

    parts.append(_render_plain_text(text[cursor:]))
    return "".join(parts)


def render_feedback_quote(summary: str) -> str:
    return f"-----\n<b>Feedback:</b> {render_markdown(summary)}"

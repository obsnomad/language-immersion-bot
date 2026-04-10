from app.application.services.practice_service import PracticeService
from app.domain.enums import CorrectionMode


def test_compose_reply_renders_markdown_and_feedback_quote() -> None:
    reply = PracticeService._compose_reply(
        PracticeService,
        "Try *this* and **that**.",
        "Use *past tense* here.",
        CorrectionMode.DELAYED,
    )

    assert reply == (
        "Try <i>this</i> and <b>that</b>.\n\n-----\n<b>Feedback:</b> Use <i>past tense</i> here."
    )


def test_compose_reply_renders_markdown_without_feedback() -> None:
    reply = PracticeService._compose_reply(
        PracticeService,
        "Try *this*.",
        None,
        CorrectionMode.INLINE,
    )

    assert reply == "Try <i>this</i>."


def test_compose_reply_escapes_html_and_formats_markdown() -> None:
    reply = PracticeService._compose_reply(
        PracticeService,
        "Great job! Keep *this* and **that** <plain>.",
        None,
        CorrectionMode.INLINE,
    )

    assert reply == "Great job! Keep <i>this</i> and <b>that</b> &lt;plain&gt;."

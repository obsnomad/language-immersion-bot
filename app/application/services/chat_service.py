from app.infra import settings
from app.llm import mistral_client


class ChatService:
    async def reply(self, user_text: str) -> str:
        response = await mistral_client.chat.complete_async(
            model=settings.mistral_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI language tutor for English and Spanish. "
                        "Reply briefly. If the user makes a grammar mistake, "
                        "first give a short correction, then continue naturally."
                    ),
                },
                {
                    "role": "user",
                    "content": user_text,
                },
            ],
        )

        return response.choices[0].message.content or "Sorry, I could not generate a reply."

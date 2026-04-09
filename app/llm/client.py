from mistralai.client import Mistral

from app.infra import settings

mistral_client = Mistral(api_key=settings.mistral_api_key)

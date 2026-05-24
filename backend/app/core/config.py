from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv('OPENAI_API_KEY', '')
    REDDIT_API_KEY: str = os.getenv('REDDIT_API_KEY', '')
    CACHE_TTL_SECONDS: int = int(os.getenv('CACHE_TTL_SECONDS', '300'))

settings = Settings()

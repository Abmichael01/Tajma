import openai
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        if self.api_key:
            self.client = openai.OpenAI(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("OPENAI_API_KEY is not set. Translations will not work.")

    def translate_text(self, text, target_language, source_language='auto'):
        """
        Translates text to target_language using OpenAI.
        target_language should be 'en', 'fr', or 'ha'.
        """
        if not self.client:
            return text

        if not text:
            return ""

        language_map = {
            'en': 'English',
            'fr': 'French',
            'ha': 'Hausa'
        }

        target_name = language_map.get(target_language, target_language)
        
        prompt = f"Translate the following text into {target_name}. Maintain the tone and any specific marketplace terms. If the text is already in {target_name}, return it as is.\n\nText: {text}"

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator for a multi-vendor marketplace in Africa (Niger, Mali, Burkina Faso)."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Translation error: {str(e)}")
            return text

    def translate_ad(self, title, description, target_languages=['en', 'fr', 'ha'], original_language='en'):
        """
        Translates an ad title and description into multiple languages.
        """
        results = {}
        for lang in target_languages:
            if lang == original_language:
                results[lang] = {"title": title, "description": description}
                continue
            
            translated_title = self.translate_text(title, lang)
            translated_desc = self.translate_text(description, lang)
            
            results[lang] = {
                "title": translated_title,
                "description": translated_desc
            }
        
        return results

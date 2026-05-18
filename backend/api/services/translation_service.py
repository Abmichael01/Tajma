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

    def translate_bulk(self, text, target_languages=['fr', 'ha']):
        """
        Translates text into multiple languages in a single request using JSON mode.
        """
        if not self.client or not text:
            return {lang: text for lang in target_languages}

        language_map = {
            'en': 'English',
            'fr': 'French',
            'ha': 'Hausa'
        }

        langs_str = ", ".join([language_map.get(l, l) for l in target_languages])
        
        prompt = f"""Translate the following text into these languages: {langs_str}.
Return a JSON object where keys are the ISO language codes ({", ".join(target_languages)}) and values are the translations.

Text: {text}"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional marketplace translator for Africa (Niger, Mali, Burkina Faso). Respond ONLY with a valid JSON object. IMPORTANT: Do NOT translate brand names or proper nouns (e.g., 'Apple', 'Samsung', 'Toyota', 'Nike'). Use context to distinguish if a word is a brand or a common term. Keep brand names exactly as they are in the original text."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Bulk translation error: {str(e)}")
            return {lang: text for lang in target_languages}

    def translate_text(self, text, target_language, source_language=None):
        """
        Translates text to target_language using OpenAI.
        target_language and source_language should be 'en', 'fr', or 'ha'.

        Passing source_language explicitly avoids a common gpt-4o-mini failure
        mode: with short or jargon-heavy text it misidentifies the source as
        already being the target language and returns the input unchanged.
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
        source_name = language_map.get(source_language) if source_language else None

        if source_name and source_name != target_name:
            user_prompt = (
                f"Translate the following text from {source_name} to {target_name}. "
                f"Maintain the tone and any specific marketplace terms. "
                f"Always produce a {target_name} translation — do NOT return the source text unchanged.\n\n"
                f"Text: {text}"
            )
        else:
            # No source known — fall back to detect-and-translate (legacy behaviour).
            user_prompt = (
                f"Translate the following text into {target_name}. "
                f"Maintain the tone and any specific marketplace terms.\n\n"
                f"Text: {text}"
            )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator for a multi-vendor marketplace in Africa (Niger, Mali, Burkina Faso). IMPORTANT: Do NOT translate brand names or proper nouns (e.g., 'Apple', 'Samsung', 'Toyota', 'Nike'). Use context to distinguish if a word is a brand or a common term. Keep brand names exactly as they are in the original text."},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            translated = response.choices[0].message.content.strip()

            # Sanity check: if source language is known AND output equals input,
            # the model probably bailed. Log so we can spot the pattern in prod.
            if source_language and source_language != target_language and translated.strip() == text.strip():
                logger.warning(
                    f"Translation suspiciously identical to source "
                    f"(source={source_language}, target={target_language}, len={len(text)}): {text[:80]!r}"
                )

            return translated
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

    def translate_custom_fields(self, fields, target_language):
        """
        Translates the labels and options of custom fields.
        """
        if not self.client or not fields:
            return {}

        language_map = {'en': 'English', 'fr': 'French', 'ha': 'Hausa'}
        target_name = language_map.get(target_language, target_language)

        # Create a simplified structure to translate to save tokens
        to_translate = []
        for f in fields:
            to_translate.append({
                "name": f['name'],
                "label": f['label'],
                "options": [opt['label'] for opt in f.get('options', [])]
            })

        prompt = f"""Translate the labels and options of these marketplace form fields into {target_name}.
Keep the 'name' field exactly as it is. Translate the 'label' and the strings in 'options'.
Do NOT translate brand names.

Fields: {to_translate}"""

        try:
            import json
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"You are a professional marketplace translator. Respond ONLY with a valid JSON array of translated fields for {target_name}."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}, # Wait, JSON mode requires object
                temperature=0.3
            )
            # Adjust prompt to return object
            prompt = f"Return a JSON object with a key 'fields' containing the array of translated fields."
            
            # Re-doing with correct JSON mode expectation
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": f"You are a professional marketplace translator. Respond ONLY with a valid JSON object like {{'fields': [...]}} for {target_name}."},
                    {"role": "user", "content": f"Translate these fields to {target_name}: {to_translate}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            data = json.loads(response.choices[0].message.content)
            translated_list = data.get('fields', [])
            
            # Convert back to the model's custom_fields_translations format
            # Format: {field_name: {label: ..., options: {orig_opt_val: trans_opt_label}}}
            result = {}
            for i, orig_f in enumerate(fields):
                trans_f = next((tf for tf in translated_list if tf['name'] == orig_f['name']), None)
                if trans_f:
                    options_map = {}
                    orig_opts = orig_f.get('options', [])
                    trans_opts = trans_f.get('options', [])
                    
                    for j, opt in enumerate(orig_opts):
                        if j < len(trans_opts):
                            # Map the original option value to the translated label
                            options_map[opt['value']] = trans_opts[j]
                    
                    result[orig_f['name']] = {
                        "label": trans_f['label'],
                        "options": options_map
                    }
            return result
        except Exception as e:
            logger.error(f"Custom fields translation error: {str(e)}")
            return {}

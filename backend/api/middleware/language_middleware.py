from django.utils import translation
from django.conf import settings

class LanguageMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Check for 'lang' query parameter
        language = request.GET.get('lang')
        
        # 2. Check for 'Accept-Language' header
        if not language:
            language = request.headers.get('Accept-Language')
            if language:
                # Take only the first part (e.g., 'en-US' -> 'en')
                language = language.split(',')[0].split('-')[0].lower()

        # 3. Check user preference if authenticated
        if not language and request.user.is_authenticated:
            language = getattr(request.user, 'preferred_language', None)

        # Validate and set language
        supported_languages = ['en', 'fr', 'ha']
        if language in supported_languages:
            translation.activate(language)
            request.LANGUAGE_CODE = language
        else:
            translation.activate(settings.LANGUAGE_CODE)
            request.LANGUAGE_CODE = settings.LANGUAGE_CODE

        response = self.get_response(request)
        
        # Ensure the response has the language header
        response['Content-Language'] = request.LANGUAGE_CODE
        return response

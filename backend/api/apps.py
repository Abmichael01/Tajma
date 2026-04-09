from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals.category_signals  # noqa
        import api.signals.ad_signals  # noqa
        import api.signals.notification_signals  # noqa
        import api.signals.chat_signals  # noqa
        import api.signals.lead_signals  # noqa
        import api.signals.auth_signals  # noqa
        import api.signals.report_signals  # noqa
        try:
            from api.utils.category_exporter import export_categories_to_json

            export_categories_to_json()
        except Exception:
            # Avoid breaking startup if DB tables are not ready yet (e.g., migrate)
            pass

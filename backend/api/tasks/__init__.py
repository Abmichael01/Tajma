# Importing the task modules here guarantees Celery's autodiscover sees them
# even though api/tasks/ has subfiles. Without this, beat-scheduled tasks may
# not register because nothing else triggers an import of the module.
from . import translation_tasks  # noqa: F401

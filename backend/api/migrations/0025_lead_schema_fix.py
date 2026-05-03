from django.db import migrations

class Migration(migrations.Migration):
    """
    Migration 0025 was a fix for a specific DB state mismatch on a local machine.
    On fresh databases, 0024_lead_refactor correctly creates the schema.
    This migration is made a no-op to allow the test suite and new installations to pass.
    """
    dependencies = [
        ('api', '0024_lead_refactor'),
    ]

    operations = []

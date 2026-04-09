"""
Reconciles the leads table with the Lead model.

Migration 0024 was edited after it ran, causing a state/DB mismatch.
The DB currently has:
  - first_ad_id, last_ad_id FK columns (instead of ad_id)
  - first_source, last_source, interaction_count, last_interacted_at ✓
  - Missing: ad_id, sources_used, ignored
  - Unique: (seller_id, client_id) — not (seller, client, ad)

Django's migration state after the current 0024 code thinks:
  - ad FK exists
  - sources_used, ignored exist
  - Unique: (seller, client, ad)

This migration uses SeparateDatabaseAndState to:
  Phase 1 — Align Django state with reality (no DB changes)
  Phase 2 — Apply DB + state changes to reach the desired schema
"""
import django.db.models.deletion
from django.db import migrations, models


def copy_first_ad_to_ad(apps, schema_editor):
    """Copy first_ad_id → ad_id before dropping old columns."""
    schema_editor.connection.cursor().execute(
        'UPDATE leads SET ad_id = first_ad_id'
    )


def populate_sources_used(apps, schema_editor):
    """Seed sources_used from existing source columns."""
    Lead = apps.get_model('api', 'Lead')
    for lead in Lead.objects.all():
        sources = list({s for s in [lead.first_source, lead.last_source] if s})
        lead.sources_used = sources
        lead.save(update_fields=['sources_used'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0024_lead_refactor'),
    ]

    operations = [
        # ──────────────────────────────────────────────────────────────────
        # Phase 1: Reconcile Django state with the actual DB (no DB writes).
        # After this block Django's state matches reality.
        # ──────────────────────────────────────────────────────────────────
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                # DB has (seller, client) unique, not (seller, client, ad)
                migrations.AlterUniqueTogether(
                    name='lead',
                    unique_together={('seller', 'client')},
                ),
                # DB never got sources_used — remove from state
                migrations.RemoveField(model_name='lead', name='sources_used'),
                # DB never got ignored — remove from state
                migrations.RemoveField(model_name='lead', name='ignored'),
                # leads_ignored_idx was in state from 0024 but not in DB
                migrations.RemoveIndex(model_name='lead', name='leads_ignored_idx'),
                # DB had ad removed and replaced with first_ad / last_ad
                migrations.RemoveField(model_name='lead', name='ad'),
                migrations.AddField(
                    model_name='lead',
                    name='first_ad',
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to='api.ad',
                    ),
                ),
                migrations.AddField(
                    model_name='lead',
                    name='last_ad',
                    field=models.ForeignKey(
                        blank=True, null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='+',
                        to='api.ad',
                    ),
                ),
            ],
        ),

        # ──────────────────────────────────────────────────────────────────
        # Phase 2: Apply real DB changes to reach the desired final schema.
        # ──────────────────────────────────────────────────────────────────

        # Drop (seller, client) unique so we can reshape it
        migrations.AlterUniqueTogether(
            name='lead',
            unique_together=set(),
        ),

        # Add the single ad FK (grouping key)
        migrations.AddField(
            model_name='lead',
            name='ad',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='leads',
                to='api.ad',
            ),
        ),

        # Copy first_ad_id → ad_id
        migrations.RunPython(copy_first_ad_to_ad, migrations.RunPython.noop),

        # Add sources_used
        migrations.AddField(
            model_name='lead',
            name='sources_used',
            field=models.JSONField(default=list),
        ),

        # Seed sources_used
        migrations.RunPython(populate_sources_used, migrations.RunPython.noop),

        # Add ignored
        migrations.AddField(
            model_name='lead',
            name='ignored',
            field=models.BooleanField(default=False),
        ),

        # Drop old first_ad / last_ad columns
        migrations.RemoveField(model_name='lead', name='first_ad'),
        migrations.RemoveField(model_name='lead', name='last_ad'),

        # Restore correct unique constraint
        migrations.AlterUniqueTogether(
            name='lead',
            unique_together={('seller', 'client', 'ad')},
        ),

        # Add ignored index
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['ignored'], name='leads_ignored_idx'),
        ),
    ]

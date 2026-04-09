"""
Refactors the Lead model:
- Changes unique constraint from (seller, client, source, ad) → (seller, client, ad)
  → One lead per buyer-ad pair; sources no longer create separate leads
- Adds first_source, last_source, sources_used, interaction_count, ignored, last_interacted_at
- Merges duplicate (seller, client, ad) rows from old data
- Removes source and updated_at fields
"""
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


def merge_duplicate_leads(apps, schema_editor):  # noqa: ARG001
    """
    For each (seller, client, ad) group with multiple rows (from the old unique
    constraint that included source), merge them into a single canonical record.
    """
    Lead = apps.get_model('api', 'Lead')

    seen = set()
    for pair in Lead.objects.values('seller_id', 'client_id', 'ad_id').distinct():
        key = (pair['seller_id'], pair['client_id'], pair['ad_id'])
        if key in seen:
            continue
        seen.add(key)

        leads = list(
            Lead.objects.filter(
                seller_id=pair['seller_id'],
                client_id=pair['client_id'],
                ad_id=pair['ad_id'],
            ).order_by('created_at')
        )

        first = leads[0]
        most_recent = max(leads, key=lambda l: l.updated_at)
        all_sources = list({l.source for l in leads})

        first.first_source = first.source
        first.last_source = most_recent.source
        first.sources_used = all_sources
        first.interaction_count = len(leads)
        first.last_interacted_at = most_recent.updated_at
        first.messaged = any(l.messaged for l in leads)
        first.save()

        if len(leads) > 1:
            Lead.objects.filter(pk__in=[l.pk for l in leads[1:]]).delete()


def reverse_merge(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_searchquery'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Drop old unique constraint
        migrations.AlterUniqueTogether(
            name='lead',
            unique_together=set(),
        ),

        # 2. Add new fields (nullable first for data migration compatibility)
        migrations.AddField(
            model_name='lead',
            name='first_source',
            field=models.CharField(
                blank=True, null=True, max_length=20,
                choices=[('phone_view', 'Phone View'), ('profile_view', 'Profile View'), ('save_ad', 'Saved Ad')],
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='last_source',
            field=models.CharField(
                blank=True, null=True, max_length=20,
                choices=[('phone_view', 'Phone View'), ('profile_view', 'Profile View'), ('save_ad', 'Saved Ad')],
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='sources_used',
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name='lead',
            name='interaction_count',
            field=models.PositiveIntegerField(default=1),
        ),
        migrations.AddField(
            model_name='lead',
            name='ignored',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='lead',
            name='last_interacted_at',
            field=models.DateTimeField(null=True, blank=True),
        ),

        # 3. Populate new fields and merge duplicates per (seller, client, ad)
        migrations.RunPython(merge_duplicate_leads, reverse_merge),

        # 4. Make required fields non-nullable
        migrations.AlterField(
            model_name='lead',
            name='first_source',
            field=models.CharField(
                max_length=20,
                choices=[('phone_view', 'Phone View'), ('profile_view', 'Profile View'), ('save_ad', 'Saved Ad')],
            ),
        ),
        migrations.AlterField(
            model_name='lead',
            name='last_source',
            field=models.CharField(
                max_length=20,
                choices=[('phone_view', 'Phone View'), ('profile_view', 'Profile View'), ('save_ad', 'Saved Ad')],
            ),
        ),
        migrations.AlterField(
            model_name='lead',
            name='last_interacted_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
            preserve_default=False,
        ),

        # 5. Remove old fields
        migrations.RemoveField(model_name='lead', name='source'),
        migrations.RemoveField(model_name='lead', name='updated_at'),

        # 6. New unique constraint: one lead per (seller, client, ad)
        migrations.AlterUniqueTogether(
            name='lead',
            unique_together={('seller', 'client', 'ad')},
        ),

        # 7. Update ordering and indexes
        migrations.AlterModelOptions(
            name='lead',
            options={'db_table': 'leads', 'ordering': ['-last_interacted_at']},
        ),
        migrations.RemoveIndex(
            model_name='lead',
            name='leads_seller__e9d94e_idx',
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['seller', '-last_interacted_at'], name='leads_seller_last_idx'),
        ),
        migrations.AddIndex(
            model_name='lead',
            index=models.Index(fields=['ignored'], name='leads_ignored_idx'),
        ),
    ]

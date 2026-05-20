"""Per-language translatable strings used inside email templates.

Templates reference values as `{{ s.title }}`, `{{ s.greeting }}` etc.
`build_strings(template_key, language)` returns the merged dict (common +
template-specific) for injection into the template context.

Keeping this as a Python data structure (rather than gettext .po files) means:
  - No msgmerge / msgcompile / .mo file management
  - Translators edit a single file and see all 3 languages side by side
  - Adding a new template = one new entry here, no infra changes
"""

SUPPORTED = ("en", "fr", "ha")
DEFAULT = "en"


# Footer strings shared by every email (rendered via base.html).
COMMON = {
    "en": {
        "footer_rights": "All rights reserved.",
        "footer_received_because": "You received this email because you registered on",
        "footer_notification_settings": "Notification Settings",
        "footer_help_center": "Help Center",
    },
    "fr": {
        "footer_rights": "Tous droits réservés.",
        "footer_received_because": "Vous recevez cet email parce que vous êtes inscrit sur",
        "footer_notification_settings": "Préférences de notifications",
        "footer_help_center": "Centre d'aide",
    },
    "ha": {
        "footer_rights": "Duk haƙƙoƙi an kiyaye su.",
        "footer_received_because": "Ka karɓi wannan imel saboda ka yi rajista a",
        "footer_notification_settings": "Saituna na Sanarwa",
        "footer_help_center": "Cibiyar Taimako",
    },
}


# Per-template strings. Key = subject_key passed to send_professional_email().
PER_TEMPLATE = {
    "new_lead": {
        "en": {
            "subject": "New Lead Received on Tajma",
            "title": "New Lead Received!",
            "greeting": "Hello",
            "body": "Great news! You have a new potential customer on <strong>Tajma</strong>. Someone has expressed interest in your listing.",
            "label_source": "Source",
            "label_item": "Item",
            "label_time": "Time",
            "default_item": "Your Listings",
            "closing": "Responsive communication helps you close deals faster. Reach out to them or check your dashboard for more details.",
            "cta_button": "View Leads Dashboard",
        },
        "fr": {
            "subject": "Nouveau prospect reçu sur Tajma",
            "title": "Nouveau prospect reçu !",
            "greeting": "Bonjour",
            "body": "Bonne nouvelle ! Vous avez un nouveau client potentiel sur <strong>Tajma</strong>. Quelqu'un s'est montré intéressé par votre annonce.",
            "label_source": "Source",
            "label_item": "Article",
            "label_time": "Date",
            "default_item": "Vos annonces",
            "closing": "Répondre rapidement aide à conclure plus vite. Contactez ce prospect ou consultez votre tableau de bord pour plus de détails.",
            "cta_button": "Voir mes prospects",
        },
        "ha": {
            "subject": "An sami sabuwa mai sha'awa a Tajma",
            "title": "An sami sabuwa mai sha'awa!",
            "greeting": "Sannu",
            "body": "Labari mai daɗi! Kana da sabon abokin ciniki a <strong>Tajma</strong>. Wani ya nuna sha'awar tallarka.",
            "label_source": "Tushe",
            "label_item": "Talla",
            "label_time": "Lokaci",
            "default_item": "Tallace-tallenka",
            "closing": "Amsa cikin sauri yana taimakawa wajen rufe ciniki da wuri. Tuntuɓi mai sha'awar ko ka duba shafinka don ƙarin bayani.",
            "cta_button": "Duba masu sha'awa",
        },
    },
    "lead_renewal": {
        "en": {
            "subject": "A Lead Came Back — Time to Follow Up!",
            "title": "A Lead Came Back!",
            "greeting": "Hello",
            "body_before_name": "",
            "body_after_name": " just interacted with your listing again on <strong>Tajma</strong>. This is a great time to reach out!",
            "label_action": "Action",
            "label_item": "Item",
            "label_interactions": "Total Interactions",
            "default_item": "Your Listings",
            "closing": "Buyers who keep coming back are serious. Don't let this one slip away!",
            "cta_button": "View Leads Dashboard",
        },
        "fr": {
            "subject": "Un prospect est revenu — il est temps de relancer !",
            "title": "Un prospect est revenu !",
            "greeting": "Bonjour",
            "body_before_name": "",
            "body_after_name": " vient d'interagir à nouveau avec votre annonce sur <strong>Tajma</strong>. C'est le bon moment pour le recontacter !",
            "label_action": "Action",
            "label_item": "Article",
            "label_interactions": "Total d'interactions",
            "default_item": "Vos annonces",
            "closing": "Les acheteurs qui reviennent sont sérieux. Ne laissez pas filer celui-ci !",
            "cta_button": "Voir mes prospects",
        },
        "ha": {
            "subject": "Mai sha'awa ya dawo — lokacin bi-baya ya yi!",
            "title": "Mai sha'awa ya dawo!",
            "greeting": "Sannu",
            "body_before_name": "",
            "body_after_name": " ya sake yin mu'amala da tallarka a <strong>Tajma</strong>. Wannan ne lokaci mai kyau don tuntuɓe shi!",
            "label_action": "Aiki",
            "label_item": "Talla",
            "label_interactions": "Jimillar mu'amaloli",
            "default_item": "Tallace-tallenka",
            "closing": "Masu saya da ke ci gaba da dawowa suna da niyya. Kada ka bar wannan ya gudu!",
            "cta_button": "Duba masu sha'awa",
        },
    },
    "new_signin": {
        "en": {
            "subject": "New Sign-in to Your Tajma Account",
            "title": "New Sign-in Detected",
            "greeting": "Hello",
            "body": "We're sending this security notification to let you know that a new sign-in occurred on your Tajma account.",
            "label_email": "Email",
            "label_time": "Time",
            "label_ip": "IP Address",
            "closing": "If this was you, you can safely ignore this email. If you don't recognize this activity, please secure your account immediately by changing your password.",
            "cta_button": "Security Settings",
        },
        "fr": {
            "subject": "Nouvelle connexion à votre compte Tajma",
            "title": "Nouvelle connexion détectée",
            "greeting": "Bonjour",
            "body": "Nous vous envoyons cette notification de sécurité pour vous informer qu'une nouvelle connexion a eu lieu sur votre compte Tajma.",
            "label_email": "Email",
            "label_time": "Date",
            "label_ip": "Adresse IP",
            "closing": "Si c'était vous, vous pouvez ignorer cet email. Si vous ne reconnaissez pas cette activité, sécurisez immédiatement votre compte en changeant votre mot de passe.",
            "cta_button": "Paramètres de sécurité",
        },
        "ha": {
            "subject": "Sabuwar shiga ga asusunka na Tajma",
            "title": "An gano sabuwar shiga",
            "greeting": "Sannu",
            "body": "Muna aiko da wannan sanarwar tsaro don sanar da kai cewa an samu sabuwar shiga a asusunka na Tajma.",
            "label_email": "Imel",
            "label_time": "Lokaci",
            "label_ip": "Adireshin IP",
            "closing": "Idan kai ne ka shiga, za ka iya watsi da wannan imel. Idan ba ka gane wannan aiki ba, ka kiyaye asusunka nan da nan ta hanyar canza kalmar sirrinka.",
            "cta_button": "Saituna na tsaro",
        },
    },
    "unread_message_digest": {
        "en": {
            "subject": "You have unread messages on Tajma",
            "subject_one_chat": "You have {unread} unread message{plural} on Tajma",
            "subject_multi_chat": "You have {unread} unread messages from {chats} chats on Tajma",
            "title": "You have unread messages",
            "greeting": "Hi",
            "body_prefix": "You have",
            "body_unread_singular": "unread message",
            "body_unread_plural": "unread messages",
            "body_middle": "across",
            "body_chat_singular": "conversation",
            "body_chat_plural": "conversations",
            "body_suffix": "on Tajma. Tap a chat below to reply.",
            "about": "About:",
            "new_label": "new",
            "truncated_notice": "Showing your most recent conversations. Open the app to see the full list.",
            "cta_button": "Open Messages",
        },
        "fr": {
            "subject": "Vous avez des messages non lus sur Tajma",
            "subject_one_chat": "Vous avez {unread} message{plural} non lu{plural} sur Tajma",
            "subject_multi_chat": "Vous avez {unread} messages non lus dans {chats} discussions sur Tajma",
            "title": "Vous avez des messages non lus",
            "greeting": "Bonjour",
            "body_prefix": "Vous avez",
            "body_unread_singular": "message non lu",
            "body_unread_plural": "messages non lus",
            "body_middle": "dans",
            "body_chat_singular": "conversation",
            "body_chat_plural": "conversations",
            "body_suffix": "sur Tajma. Cliquez sur une discussion ci-dessous pour répondre.",
            "about": "À propos de :",
            "new_label": "nouveau(x)",
            "truncated_notice": "Affichage de vos conversations les plus récentes. Ouvrez l'application pour voir la liste complète.",
            "cta_button": "Ouvrir la messagerie",
        },
        "ha": {
            "subject": "Kana da saƙonni da ba a karanta ba a Tajma",
            "subject_one_chat": "Kana da saƙonni {unread} da ba a karanta ba a Tajma",
            "subject_multi_chat": "Kana da saƙonni {unread} da ba a karanta ba daga hirarrun {chats} a Tajma",
            "title": "Kana da saƙonni da ba a karanta ba",
            "greeting": "Sannu",
            "body_prefix": "Kana da",
            "body_unread_singular": "saƙo da ba a karanta ba",
            "body_unread_plural": "saƙonni da ba a karanta ba",
            "body_middle": "a cikin",
            "body_chat_singular": "hira",
            "body_chat_plural": "hirarrun",
            "body_suffix": "a Tajma. Danna hira a ƙasa don amsawa.",
            "about": "Game da:",
            "new_label": "sabo",
            "truncated_notice": "Ana nuna hirarrukanka na baya-bayan nan. Buɗe app don ganin cikakken jeri.",
            "cta_button": "Buɗe Saƙonni",
        },
    },
}


def build_strings(template_key, language):
    """Merge COMMON + PER_TEMPLATE strings for the given key and language.

    Falls back to English for any missing language; returns an empty dict-like
    fallback if the template_key is unknown (templates will then render empty
    placeholders instead of crashing).
    """
    lang = language if language in SUPPORTED else DEFAULT
    common = COMMON.get(lang, COMMON[DEFAULT])
    per = PER_TEMPLATE.get(template_key, {}).get(lang) or PER_TEMPLATE.get(template_key, {}).get(DEFAULT, {})
    return {**common, **per}


def get_subject(template_key, language):
    """Convenience: extract just the subject for the given key/language."""
    strings = build_strings(template_key, language)
    return strings.get("subject") or PER_TEMPLATE.get(template_key, {}).get(DEFAULT, {}).get("subject") or template_key

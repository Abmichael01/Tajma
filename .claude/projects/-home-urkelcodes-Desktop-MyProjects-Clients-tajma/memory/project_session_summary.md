---
name: Session work summary (May 2026)
description: What was built/fixed in the large May 2026 session, and what's pending for next session
type: project
---

## Major work completed

### i18n (both app + frontend)
- Audited all `t(...)` calls vs locale JSONs; fixed 41 keys missing from app EN (rendered as literal dotted text), 5 from frontend EN
- Added `auth` namespace (77 keys × 3 locales) to frontend i18n/locales/
- Converted all 4 frontend auth pages (LoginClient, RegisterClient, ForgotPasswordClient, AuthLeftSection) from 0% translated to 100%
- Synced FR/HA for all new keys

### Mobile app (app/)
- Profile page: grouped settings cards on gray bg, animated scroll header with avatar+name
- Create-ad: category-first gating, custom fields bug fixed (was never rendered), image picker moved to top, publish button inline, category selector allows any level via "Select this category" pinned row
- Image upload: fixed expo-file-system/legacy import (was silently failing)
- Keyboard avoidance: improved for chat room + AdForm
- Chat bubbles: inner padding, reply preview restyle (rounded-8 + chevron), tail screen-edge fix, time-content tight spacing
- Swipe-to-reply: much more sensitive (~37px vs ~120px before)
- Chat attach sheet: repositioned below input (WhatsApp style), + button toggles with icon swap
- Select dropdown (custom fields): rebuilt with @gorhom/bottom-sheet — was broken after first use
- Root layout: added backgroundColor:'#FFFFFF' to GestureHandlerRootView (fixes black bg above headers everywhere)
- Search bar: Cancel button added to close search

### Frontend web
- Login button in Navbar: secondary → primary color
- Register stepper: circles+line progress indicator, bumped input/button padding

## Pending for next session — TRANSLATIONS
New strings added this session that still have NO locale entries:

### app/src/i18n/locales/ (need in all 3: en, fr, ha)
Keys with defaultValue fallback only:
- `create_ad.pickCategoryTitle` = "Pick a category to continue"
- `create_ad.pickCategoryDesc` = "Once you choose a category, we'll show you the right fields for your listing."
- `create_ad.fields.selectThisCategory` = "Select this category"

Hardcoded in components (need extracting to t() + locale entries):
- AdImagePicker.tsx: "Add Photo", "Cover", "Limit Reached / You can only add up to X images.", "Permission Required / We need your permission...", "File too large / Image X exceeds the 5MB limit.", "Failed to pick images"
- ChatInput.tsx: "Type a message...", "Slide to cancel", "Camera", "Gallery", "Document", "Permission Required / Microphone access...", "Recording Error", "Camera roll access needed", "Could not open your gallery", "Camera access needed", "Could not open the camera"
- DynamicFormFields.tsx: "Select option" (placeholder), "Type and press enter", "Add Item", "No X added yet"

**Why:** Both FR and HA locale files always had consistent coverage; the above were added as new features without locale entries. The pattern to follow is the existing app locale JSON structure.

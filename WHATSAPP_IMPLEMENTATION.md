# WhatsApp-Style Chat Implementation

This repository keeps only this document to explain how the WhatsApp-inspired messaging stack works end-to-end. Everything below reflects the production code that currently lives inside `frontend/src/hooks`, `frontend/src/components/chat`, and related folders.

## Architecture Overview
- **Unified WebSocket (`useUnifiedChatWebSocket.ts`)** – Maintains a single persistent socket to `/ws/chat/`, handles subscribe/unsubscribe commands per chat, multiplexes message, typing, status, and mark-read events, and owns keep-alive logic (ping/pong, reconnection, visibility handling).
- **Chat Realtime Facade (`useChatRealtime.ts`)** – Wraps the unified socket and exposes a chat-focused API (`sendMessage`, `sendTyping`, `markAsRead`). It translates socket payloads into TanStack Query cache updates for `['chats']`, `['chats', chatId]`, and paginated `['messages', chatId]` queries.
- **Data Layer (`useChat.ts`, `chatApi.ts`)** – Performs the initial REST fetches (one-time) and otherwise disables polling because the WebSocket keeps caches warm. REST is still available as a fallback for actions like `markAsRead` when the socket is offline.
- **UI Consumers (`ChatClient.tsx`, `ConversationList.tsx`, `ChatArea.tsx`, `Navbar.tsx`, `UserDropdown.tsx`)** – React components subscribe to TanStack Query caches; unread counts, message threads, typing indicators, and badges update instantly as caches mutate.

## Message Lifecycle
1. **Send path** – `ChatClient` builds an optimistic message, drops it into the paginated cache, and calls `sendMessage` from `useChatRealtime`. If the socket confirms within 20 seconds the optimistic entry is reconciled; otherwise it is flagged as failed with retry support.
2. **Receive path** – `useUnifiedChatWebSocket` receives a `"message"` payload and forwards it to `useChatRealtime`, which replaces matching optimistic entries or appends the message (sorted by `created_at`). The chat list cache is updated so recency ordering matches WhatsApp-style behavior.
3. **Read receipts** – `"message_status_update"` events flow through `handleMessageStatusUpdate` so both the active chat and the global chat list show the correct `is_read`, `delivered_at`, and `read_at` fields.

## Typing & Presence
- `"typing"` events are proxied to components via `onTypingChange`. `ChatClient` keeps per-chat typing maps so the list can show inline “typing…” indicators even when the conversation is not open.
- Online presence polling (`useOnlineStatuses`) runs every 30 seconds as a complement to socket events, ensuring avatars show “online” reels similar to WhatsApp.

## Mark-As-Read Strategy
- `ChatArea` observes when the last unread message scrolls into view and calls `markAsRead`. The socket sends a `mark_read` command so the server can broadcast `"marked_read"` events, immediately zeroing the `unread_count` client-side (mirrors WhatsApp’s instant read receipts).
- If the socket is disconnected, the REST mutation `chatApi.markAsRead` runs as a fallback and eventually the WebSocket catches up.

## Reliability Features
- Heartbeats fire every 20 seconds when the tab is visible; connection health checks reconnect if no pong arrives within five minutes.
- Exponential backoff reconnects indefinitely (WhatsApp-style resilience) while preserving pending subscription/message queues so nothing is lost during transient outages.
- `GlobalChatConnection` (mounted in `AppLayout`) keeps the socket alive even off the `/chat` page, allowing navbar badges and dropdown counters to stay fresh.

## UX Touchpoints
- Navbar’s `MessageSquare` badge and the `UserDropdown` “Messages” pill both aggregate `unread_count` from every chat via `useChats`.
- `ChatArea` mimics WhatsApp by avoiding auto-scroll on new messages, showing scroll-to-bottom badges, and exposing retry buttons for failed sends.

With this single document in place, all other Markdown references have been deleted per the latest request so this serves as the authoritative guide to the WhatsApp-style implementation. If further details are needed, inspect the source files referenced above.


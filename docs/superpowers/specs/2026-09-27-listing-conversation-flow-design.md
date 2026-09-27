# Trustworthy Listing-to-Conversation Flow Design Spec

**Date**: 2026-09-27
**Status**: Approved

## Summary

Finish the buyer journey for a real listing: inspect it, judge its status and seller, save or
report it, and contact the seller. Use the design screens for visual direction, but remove
repeated controls and every claim the data cannot support. This replaces the earlier plan with a
build order and explicit API contracts.

## Implementation

1. Establish the data contract. Add nullable, per-listing phone and WhatsApp numbers, defaulting
   to off. Include consent choices and a public-preview step in seller create/edit. Never copy
   the account login number into a listing. Return category, make, model, seller identity, and
   permitted contact methods through an explicit public field allowlist.

2. Fix lifecycle behavior. Available listings permit contact. Reserved, sold, and rented
   listings return a readable, clearly marked detail page but allow no new contact; existing
   conversations remain usable. Draft, rejected, and banned listings are inaccessible publicly.
   Closed listings leave discovery results and sitemaps and receive noindex metadata.

3. Rebuild the detail experience. Lead with real media, price and rental period, status,
   location, and seller; then show only relevant recorded specifications. Give sale vehicles,
   rentals, and parts distinct information groupings without separate duplicated page
   implementations. Remove fabricated photos, ratings, verification, negotiability, rental
   rates, terms, guarantees, and recently viewed items. Use live available listings for
   alternatives. Keep gallery, share, and report usable; do not send listing URLs to an external
   QR service.

4. Connect buyer actions. Load the current user's favorite state from a dedicated membership
   check, then persist changes. Report submissions show validation and success states. Only
   count phone/WhatsApp analytics on an actual permitted action. Sign-in returns to the intended
   listing or conversation through a validated local URL; repair or hide any authentication
   option that leads to a missing callback.

5. Make messaging real. Add one transactional first-message operation so a failed send cannot
   create an empty conversation. Reuse the conversation uniqueness constraint and a client
   message ID to make concurrent starts and retries safe. Keep replies and older threads
   available after a listing closes. Replace the sample inbox with paginated conversations,
   messages, unread state, and safe listing/participant summaries. Use the existing WebSocket
   for active threads, with reconnect and a visible-thread refresh fallback.

## Verification

- Run the required migration commands after schema changes, then the full backend test suite.
  Cover contact privacy and ownership, all statuses, favorite/report auth, first-message races
  and retries, participant isolation, and closed-listing replies.

- Browser-test one seller and one buyer through publish → detail → favorite → message → reply →
  close listing. Check failures, missing media, and English/Arabic at phone, tablet, and desktop
  widths. Run frontend build and type checks; record any pre-existing failures separately.

- Update the handoff after each completed step, including what remains. Your ongoing listing/
  upload test takes priority if it reveals a blocker.

## Assumptions

- A seller opts into each public contact number separately; existing listings expose neither
  number until edited.

- A rental listing has one recorded price and period. No currency conversion, booking, or
  payment promise is added.

- Search, map, directories, and the other role dashboards are outside this phase.

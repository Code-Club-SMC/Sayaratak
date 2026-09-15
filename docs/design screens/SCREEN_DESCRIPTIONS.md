# Sayaratak — Client-Friendly Screen Descriptions (V2 Subset)

This document explains every PNG design in this subset of the final `02-v2-scope-fixed` handoff folder.

This subset intentionally excludes:

- `SCR-001` through `SCR-010`
- `OVR-001` through `OVR-003`

All remaining v2 PNGs in this subset are described below.

## 1. Design Foundation

### DS-001 — Design System Reference Sheet
Documents the approved Sayaratak visual system, including colors, typography, spacing, components, status language, card patterns, navigation, and English/Arabic direction guidance.

## 2. Home, Search, Discovery and Listing Actions

### OVR-004 — Sort Bottom Sheet
Lets mobile users reorder search results using clear options such as recommended, newest, price, mileage, or nearest where relevant.

### OVR-005 — Save Search Dialog
Allows a signed-in user to name and save the current search criteria and choose whether to receive alerts for new matching listings.

### SCR-011 — Vehicle Listing Details
Shows the complete vehicle listing with media, price, marketplace status, location, specifications, description, seller or eligible business information, contact actions, safety guidance, and related vehicles.

### SCR-012 — Rental Listing Details
Presents a rental vehicle with daily, weekly, or monthly pricing, essential vehicle details, location, provider information, and direct inquiry options without presenting an unconfirmed online booking flow.

### SCR-013 — Spare Part Details
Displays a spare part with images, condition, compatible vehicle context, price, description, seller contact options, favorite, share, and listing-report actions.

### OVR-006 — Gallery Lightbox
Provides a focused full-screen view of listing images and videos with simple navigation, media count, and close controls.

### OVR-007 — Share Sheet
Lets users share a listing through WhatsApp, Facebook, Telegram, TikTok, or by copying its link.

### OVR-008 — Listing Report Dialog
Allows a user to report a listing by selecting a reason, adding relevant details, and submitting the report for administrator review.

### OVR-034 — Contact Seller Sheet
Presents the available contact methods for a listing, including phone, WhatsApp, and in-app messaging, together with the relevant seller or business context.

### OVR-035 — Map Listing Preview Card
Shows a compact preview of the selected map result with its image, title, price, location, key details, favorite action, and link to the full listing.

## 3. Authentication and Account Access

### SCR-026 — Select Account Type
Introduces the available account types and helps the user choose the appropriate path for an individual, dealership, workshop, or mechanic account.

### SCR-027 — Login
Allows registered users to sign in with email or phone and password, or continue through Google or Facebook, with access to password recovery and registration.

### SCR-028 — Register
Guides new users through account creation using email or phone while collecting the essential information for the selected account type.

### SCR-030 — Forgot Password
Allows users to request password recovery using their registered email address or phone number.

### SCR-031 — Reset Password
Lets users securely create and confirm a new password after completing the password-recovery process.

## 4. Post Ad and Listing Management

### SCR-032 — Post Ad — Start or Resume
Introduces the listing-creation process, explains the main steps, and provides clear actions to begin a new advertisement or continue an unfinished draft.

### SCR-033 — Post Ad — Select Category
Allows the seller to choose the correct marketplace category before entering category-specific listing information.

### SCR-034 — Post Ad — Listing Details
Collects the main advertisement information, including title, price, condition, description, and the specifications required for the selected category.

### SCR-035 — Post Ad — Media
Allows sellers to upload, preview, reorder, and manage listing images and supported video media before submission.

### SCR-036 — Post Ad — Location
Collects the listing city, district or neighbourhood, address description, and map location, with an option to use the current location.

### SCR-037 — Post Ad — Contact Preferences
Lets sellers confirm their name, phone, WhatsApp number, and preferred contact methods, with a preview of how contact details will appear to buyers.

### SCR-038 — Post Ad — Promotion
Allows the seller to choose no promotion, Pin Listing, Boost Listing, Homepage Promotion, or Sponsored Listing, with a clear summary of the selected option.

### SCR-039 — Post Ad — Review
Presents the completed listing information, media, location, contact preferences, and promotion choice for final checking before submission.

### SCR-040 — Post Ad — Success
Confirms that the advertisement was submitted and provides clear next actions such as viewing the listing, managing listings, posting another ad, or returning home.

### SCR-043 — My Listings
Helps individual sellers view and manage their advertisements by marketplace status while monitoring views, favorites, phone clicks, and WhatsApp clicks.

### SCR-044 — Edit Listing
Allows the seller to update an existing advertisement while preserving its category, media, marketplace status, contact information, and promotion context.

### OVR-009 — Delete Listing Confirmation
Requests clear confirmation before permanently deleting a listing and explains the consequence of the action.

### OVR-010 — Unsaved Changes Confirmation
Warns users before leaving an edited form when changes have not yet been saved, with options to continue editing or discard the changes.

### OVR-012 — Change Category Confirmation
Explains that changing a listing category may reset category-specific information and asks for confirmation before continuing.

## 5. Individual User Account

### SCR-041 — User Account Overview
Provides a summary of the user’s profile, listings, favorites, saved searches, messages, notifications, subscription, and the most relevant account actions.

### SCR-042 — Personal Profile
Allows users to review and update their personal details, contact information, profile image, language, and preferred currency.

### SCR-045 — Favorites
Displays saved listings in one place with tools to search, filter, sort, open, or remove individual favorites.

### SCR-046 — Saved Searches
Lists the user’s saved search criteria and allows alerts to be enabled, disabled, edited, or removed.

### SCR-052 — User Account Settings
Provides account preferences for language, currency, notifications, security-related options, and sign-out without introducing unconfirmed account-deactivation workflows.

## 6. Messaging, Notifications and Reviews

### SCR-047 — User Conversations
Shows the user’s in-app conversations with listing context, participant information, unread indicators, search, and access to each message thread.

### SCR-048 — User Conversation Details
Displays a focused text conversation between a buyer and seller together with the related listing and standard message delivery states.

### SCR-049 — User Notifications
Presents account, listing, message, saved-search, subscription, and platform notifications with clear read and unread states.

### SCR-050 — User Reviews
Shows reviews the user has written for dealerships, workshops, or mechanics, including the star rating, written feedback, date, and any business-owner reply.

### SCR-058 — Dealer Conversations
Gives dealership staff a structured inbox for customer conversations connected to the dealership’s vehicle inventory.

### SCR-059 — Dealer Conversation Details
Shows the full dealership-customer message thread alongside the relevant vehicle and customer contact context.

### SCR-060 — Dealer Reviews and Responses
Allows a dealership to review customer ratings and written feedback and publish professional business-owner replies.

### SCR-068 — Service Conversations
Provides workshops and mechanics with an inbox for customer inquiries related to their profiles, services, or portfolio work.

### SCR-069 — Service Conversation Details
Displays the complete customer inquiry thread with the related workshop, mechanic, service, or portfolio context.

### SCR-070 — Service Reviews and Responses
Allows a workshop or mechanic to view received ratings and written reviews and respond as the business owner or service provider.

### OVR-013 — Review Form Dialog
Allows a user to submit a one-to-five-star rating and written review for a dealership, workshop, or mechanic.

## 7. Public Business Directories and Profiles

### SCR-014 — Dealership Directory
Helps users discover dealerships by location and other relevant directory criteria, with clear dealership cards, ratings, and verified-business indicators.

### SCR-015 — Dealership Public Profile
Presents the dealership’s logo, cover, description, contact information, location, verification, ratings, reviews, and available vehicle inventory.

### SCR-016 — Workshop Directory
Helps users find automotive workshops by city, specialization, working hours, rating, and verification status.

### SCR-017 — Workshop Public Profile
Shows the workshop’s name, logo, location, phone, working hours, images, verification, ratings, reviews, owner replies, and service information.

### SCR-018 — Mechanic Directory
Helps users discover mechanics by city, specialization, experience, rating, and verification status.

### SCR-019 — Mechanic Public Profile
Presents the mechanic’s profile image, contact details, city, experience, specialization, biography, portfolio, verification, ratings, reviews, and owner replies.

## 8. Dealership and Service-Provider Workspaces

### SCR-053 — Dealership Dashboard
Summarizes dealership inventory, messages, reviews, subscription information, and listing performance using the required views, favorites, phone-click, and WhatsApp-click metrics.

### SCR-054 — Dealership Profile Editor
Allows dealership staff to update the public dealership logo, cover image, description, contact details, and location information.

### SCR-055 — Dealer Inventory Management
Provides dealership staff with searchable vehicle inventory, marketplace statuses, listing actions, and performance metrics for each advertisement.

### SCR-056 — Dealer Add Inventory Listing
Guides dealership staff through adding a new vehicle advertisement using the approved listing fields, media, location, contact, and promotion structure.

### SCR-057 — Dealer Edit Inventory Listing
Allows dealership staff to update an existing inventory advertisement while preserving its listing history and approved status terminology.

### SCR-061 — Dealer Analytics
Shows dealership listing performance using views, favorites, phone clicks, and WhatsApp clicks across the selected reporting period.

### SCR-063 — Dealer Settings
Provides dealership account preferences for language, currency, notifications, security-related options, and sign-out.

### SCR-064 — Service Provider Dashboard
Gives workshops and mechanics a central overview of their profile, services, portfolio, messages, reviews, subscription, and the actions requiring attention.

### SCR-065 — Service Provider Profile Editor
Allows a workshop or mechanic to maintain the public profile information required for its specific provider type.

### SCR-066 — Services Management
Allows workshops and mechanics to create, update, organize, and remove the services displayed on their public profiles.

### SCR-067 — Portfolio Management
Allows mechanics to manage previous-work examples and workshops to manage their profile image gallery.

### SCR-073 — Service Provider Settings
Provides language, currency, notification, security-related, and sign-out preferences for workshop and mechanic accounts.

### OVR-017 — Dealer Bulk Inventory Actions
Lets dealership staff apply an approved action to multiple selected inventory listings while clearly showing the number of affected items.

### OVR-036 — Service or Portfolio Editor
Provides a focused form for adding or editing a service, mechanic portfolio item, or workshop gallery item according to the provider type.

### OVR-037 — Business Hours Editor
Allows a workshop to define its opening days and working hours for display on the public workshop profile.

## 9. Subscriptions and Bankak

### SCR-020 — Pricing and Subscription Plans
Presents the available subscription packages by account type with their configured price, duration, listing or vehicle limits, and primary selection action.

### SCR-051 — User Subscription and Billing
Shows an individual user’s current plan, listing allowance, duration, billing information, and available subscription actions.

### SCR-062 — Dealer Subscription and Billing
Shows the dealership’s current package, vehicle limit, duration, pricing, billing status, and available package options.

### SCR-072 — Service Subscription and Billing
Shows the workshop or mechanic subscription package, duration, pricing, billing status, and available service-provider plan options.

### OVR-018 — Subscription Checkout
Guides the user through a neutral Bankak subscription-payment step showing the selected plan, payable amount, payment method, and transaction outcome without assuming unconfirmed transfer mechanics.

## 10. Admin Dashboard

### SCR-074 — Admin Overview
Provides a high-level view of users, listings, vehicles, dealerships, workshops, mechanics, subscriptions, revenue, reports, and other key platform activity.

### SCR-075 — Admin Users Management
Allows administrators to search and manage platform users, review account and role information, inspect related listings, and ban accounts when necessary.

### SCR-076 — Admin Listings Management
Provides administrators with searchable listing records, marketplace and review context, promotion information, and access to listing-review actions.

### SCR-077 — Admin Listing Moderation Details
Shows the complete advertisement and seller context so an administrator can review, approve, reject, or remove a violating listing.

### SCR-078 — Admin Reports and Complaints
Centralizes reports and complaints with the relevant listing, reporter, reason, status, and access to detailed investigation.

### SCR-079 — Admin Dealership Management
Allows administrators to search and manage dealership accounts, profiles, verification, subscriptions, listings, ratings, and related platform records.

### SCR-080 — Admin Workshop Management
Allows administrators to manage workshop profiles, verification, subscriptions, ratings, services, and related account information.

### SCR-081 — Admin Mechanic Management
Allows administrators to manage mechanic profiles, verification, subscriptions, ratings, portfolio information, and related account records.

### SCR-082 — Admin Categories, Makes and Models
Provides structured management of marketplace categories, vehicle makes, models, and their relationships.

### SCR-083 — Admin Countries, Cities and Districts
Allows administrators to manage supported countries, cities, districts, and neighbourhoods for location-based discovery and future expansion.

### SCR-084 — Admin Subscriptions
Allows administrators to manage subscription packages, pricing, duration, account eligibility, listing or vehicle limits, and active status.

### SCR-085 — Admin Payments and Bankak Verification
Shows payment records, associated user or business context, plan details, amounts, dates, and the relevant Bankak verification information used for subscription administration.

### SCR-086 — Admin Notification Management
Allows administrators to compose and send platform notifications to all users or selected groups such as dealerships, workshops, and mechanics.

### SCR-087 — Admin Advertising Banners
Allows administrators to create, edit, schedule by display duration, placement, and remove advertising banners across supported platform locations.

### SCR-088 — Admin Review Moderation
Provides a searchable moderation view for dealership, workshop, and mechanic reviews, ratings, and replies, with the actions needed to inspect or manage problematic content.

### SCR-089 — Admin Website Content Pages
Allows administrators to edit the Home, About, Contact, Privacy, and Terms content presented on the public website.

### SCR-090 — Admin Platform Analytics
Presents platform-level trends and totals for users, listings, vehicles, dealerships, workshops, mechanics, subscriptions, and revenue.

### OVR-021 — Admin User Detail Drawer
Shows detailed user information, role, account state, related listings, and the administrative controls needed for account management.

### OVR-022 — Admin Listing Rejection Dialog
Allows an administrator to confirm listing rejection and provide a clear reason that can be communicated to the seller.

### OVR-024 — Admin Report Detail Drawer
Displays the full details of a reported item, including the report reason, reporter, related context, and available investigation information.

### OVR-025 — Business Verification Drawer
Provides administrators with the relevant dealership, workshop, or mechanic profile information needed to make a business-verification decision.

### OVR-026 — Category Editor
Provides a focused form for creating or updating a marketplace category and its basic display information.

### OVR-027 — Make and Model Editor
Allows administrators to create or update vehicle makes and models and maintain the correct relationship between them.

### OVR-028 — Location Editor
Provides a focused form for creating or updating a country, city, district, or neighbourhood entry.

### OVR-029 — Subscription Plan Editor
Allows administrators to configure a plan’s account type, name, price, currency, duration, listing or vehicle limit, and active status.

### OVR-030 — Payment Detail Drawer
Shows the complete available details for a payment record, including the relevant subscriber, plan, amount, date, and status context.

### OVR-031 — Notification Preview
Shows how an administrative notification will appear to its selected audience before it is sent.

### OVR-032 — Banner Editor
Provides the form for creating or updating an advertising banner, including creative content, placement, and display duration.

### OVR-033 — Review Moderation Dialog
Displays the selected review, rating, author, related business context, and the moderation action being reviewed by the administrator.

## 11. Public Information and System Pages

### SCR-021 — About Sayaratak
Introduces Sayaratak, its marketplace purpose, the users and automotive businesses it serves, and its commitment to trusted vehicle discovery in Sudan.

### SCR-022 — Contact Us
Provides the official contact channels and a clear form for users to submit general questions or support requests.

### SCR-024 — Privacy Policy
Presents Sayaratak’s privacy information in a structured, readable format with clear section navigation.

### SCR-025 — Terms and Conditions
Presents the platform’s terms and conditions in a structured, readable format with clear section navigation.

### SCR-092 — Access Denied
Explains that the user does not have permission to access the requested area and provides safe navigation back to an appropriate page.

### SCR-093 — Page Not Found
Explains that the requested page could not be found and offers clear routes back to the homepage or marketplace search.

### SCR-094 — Global Error Page
Communicates an unexpected system error and provides clear options to retry, return home, or contact Sayaratak when assistance is needed.

---

---

## Coverage Check

- PNG designs described in this document: **108**
- Full screens (`SCR`): **80**
- Overlays, drawers, dialogs, sheets, previews, and editors (`OVR`): **27**
- Design system reference sheets (`DS`): **1**
- Excluded from this subset: **13** (`SCR-001`–`SCR-010`, `OVR-001`–`OVR-003`)
- Archived optional/future surfaces included in this folder: **0**

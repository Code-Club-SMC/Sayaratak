# Sayaratak Domain Glossary

This document serves as a shared vocabulary for the engineering team to ensure consistency across the codebase, database, and discussions.

### Core Entities
- **Listing:** A vehicle or automotive product (car, truck, tuk-tuk, spare part) published on the platform. It can exist in various statuses (`draft`, `active`, `reserved`, `sold`, `rented`, `deleted`).
- **Profile:** A business entity linked to a user account. Can be a **Dealership** (sells vehicles), a **Workshop** (provides automotive repairs/services), or a **Mechanic** (an individual service provider).
- **Taxonomy:** The hierarchical categorization system. Includes **Locations** (Country > City > District) and **Vehicles** (Category > Make > Model).

### Priority 2 Specifics
- **High-Traffic Field:** A specification of a vehicle (like `year`, `transmission`, or `price`) that users frequently use to filter search results. These are stored as dedicated columns for indexing speed.
- **Polymorphic Specs:** Niche or category-specific details (e.g., "bucket capacity" for a tractor) that are rarely used for global filtering. These remain stored in the JSONB `specs` column.
- **Server-Side Clustering:** The process where the backend uses PostGIS grid functions to group nearby geographic points into a single cluster marker containing a count, reducing the data payload sent to the web/mobile clients.
- **Viewport Bounds:** The geographic area currently visible on the user's screen, defined by a bounding box (NorthEast and SouthWest coordinates) passed to the map search API.
- **Saved Search:** A stored set of filter criteria (e.g., "Toyota Camry, 2020-2023, Khartoum, < 15,000,000 SDG") that a user subscribes to.
- **Match Job:** The background cron process that evaluates newly active listings against all active Saved Searches to trigger batch notifications.

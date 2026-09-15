# ADR 001: Search & Discovery Architecture (Priority 2)

**Date:** 2026-08-25
**Status:** Accepted
**Context:** The platform requires advanced search capabilities, map-based discovery, and automated notifications for new listings. We needed to define the data structures and infrastructure to support these features efficiently across both mobile (iOS/Android) and web platforms.

## Decisions

### 1. Extraction of High-Traffic JSONB Fields
While polymorphic `specs` remain in JSONB, high-traffic filterable fields (e.g., `year`, `transmission`, `fuelType`, `condition`, `mileage`) will be extracted into dedicated relational columns on the `listings` table.
**Rationale:** Standard B-Tree indexing on dedicated columns provides maximum query speed and simplicity compared to scanning JSONB trees, preventing slow table scans as the dataset grows.

### 2. Server-Side Map Pin Clustering
Map searches will utilize server-side clustering. The API will group nearby locations into a single marker (e.g., "15 listings here") based on the current map zoom level and viewport bounds.
**Rationale:** Returning raw data for thousands of pins simultaneously would crash or severely lag the frontend clients (especially on mobile devices or lower-end web browsers).

### 3. Asynchronous Batch Notifications for Saved Searches
Matching new listings against user "Saved Searches" will be handled asynchronously via a scheduled background cron job, rather than synchronously during listing creation.
**Rationale:** Synchronous evaluation would significantly degrade the performance of the listing creation endpoint. A batch job ensures fast creation times while delivering timely notifications (e.g., every 5-10 minutes).

### 4. Introduction of PostGIS
We are officially migrating from the raw SQL Haversine formula to the PostgreSQL PostGIS extension.
**Rationale:** As our spatial requirements have grown to include advanced features like server-side clustering, bounding-box viewport searches, and nearest-neighbor queries across multiple tables (listings, dealerships, workshops), PostGIS provides the necessary spatial indexing (GiST) and native clustering functions required for scalable performance.

# Admin Kiosk Registration & Location Management Report

## 1. Feature Overview
A complete Kiosk Registration and Location Management flow has been successfully added to the Admin Dashboard. The system supports full GPS capture via browser geolocation APIs, Google Maps integration (with both map preview and reverse geocoding via geocode JSON API), and photograph uploads for new kiosk installations. All added functionalities reuse the existing backend and Supabase infrastructure.

## 2. Existing Kiosk Architecture
- **Existing Kiosk Registry**: Found. The application relies on `_DEV_KIOSKS_FALLBACK` memory state for missing or unseeded Supabase database schema but successfully reads/writes to `kiosks` table when available.
- **Existing Kiosk API**: Found in `routes/kiosks.py` (`/api/admin/kiosks`).
- **Existing Kiosk Database Table**: Expected to be `kiosks`.
- **Existing Heartbeat**: Present and calculates online/offline status deterministically in `repository.py` using `calculate_deterministic_kiosk_status`.

## 3. Add Kiosk Flow
A "+ Add Kiosk" button was added to `KiosksPage.tsx`. When clicked, it opens a professional modal (`KioskFormModal`) containing input fields for Name, PACS, Address, Photo Capture, and Location coordinates. Submitting the form securely POSTs data to `/api/admin/kiosks`.

## 4. Photo Capture/Upload
The modal utilizes native device camera support `capture="environment"` where available, gracefully falling back to file uploads. Images are validated for MIME type (`image/jpeg`, `image/png`, `image/webp`), size (<5MB), and magic bytes.

## 5. GPS Location Capture
`navigator.geolocation.getCurrentPosition` is fully implemented. It acquires `latitude`, `longitude`, and `accuracy` (using `enableHighAccuracy: true`). Appropriate visual feedback and error handling inform the Admin if location access fails.

## 6. Google Maps Integration
A `VITE_GOOGLE_MAPS_API_KEY` environment variable drives the mapping functionality. The modal securely previews the kiosk location using a Google Maps embed iframe. Coordinates are passed to Google Maps without exposing the API key directly in the UI if not needed.

## 7. Reverse Geocoding
If the GPS successfully determines the location, the system invokes the Google Maps Geocoding API to attempt to reverse-geocode coordinates into a human-readable `formatted_address` which autopopulates the address field.

## 8. Kiosk Database Fields
Fields correctly parsed/added to schemas:
- `latitude`
- `longitude`
- `location_accuracy`
- `location_source`
- `installation_photo_path`
- `last_known_latitude`, `last_known_longitude`, `last_location_update` (for future telemetry updates).

## 9. Location Display
The existing `KioskCard` and details modal have been expanded to display the installation location and coordinates. 

## 10. Last Known Location
The backend allows updates for both installation coordinates and last known telemetry coordinates. If last known coordinates differ from the installation location, they display alongside the timestamp in the Kiosk detail view.

## 11. Security
- Files securely uploaded to a `kiosk-images` Supabase bucket (with local fallback).
- Safe file naming conventions (`sanitize_filename`).
- `VITE_GOOGLE_MAPS_API_KEY` used strictly from `.env`.

## 12. RBAC
RBAC remains enforced. The new endpoints leverage the existing `get_current_admin_user` dependencies, restricting unauthorized writes.

## 13. Audit Logging
Auditing logic from the backend stays untouched but automatically captures updates if the existing schema allows. 

## 14. Testing
- Added robust validations for missing fields.
- Mapped robust schemas.
- Passed all preexisting `test_admin_*.py` suites seamlessly without regressions.

## 15. Build
TypeScript (`tsc -b`) and Vite built correctly without issues.

## 16. Visual Verification
The Kiosk Form Modal matches the dashboard's design system using `lucide-react` icons, standard typography, and feedback states.

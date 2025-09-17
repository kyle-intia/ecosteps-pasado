# TODO: Fix DailyTracking Validation Error

## Current Status
- [x] Identified the issue: homeEnergy.homeType enum mismatch between frontend ("large-house") and backend ("large_house")
- [x] Updated client/src/pages/TrackCarbon.tsx to map UI values to backend enum values
- [x] Started server (port 4004) and client (port 8080) applications
- [x] Fix implemented and ready for testing

## Details
The error was caused by the frontend sending "large-house" (with hyphen) while the backend model expects "large_house" (with underscore). Updated the calculateFootprint function to map these values before sending to the API.

## Next Steps
- Log in to the application at http://localhost:8080/
- Navigate to Track Carbon page
- Select "Large House (3 or more bedrooms)" for home type
- Fill out the form and submit
- Verify no validation error occurs for homeEnergy.homeType

## Authentication Note
The 401 Unauthorized errors are separate authentication issues and not related to the validation fix. They occur because the user needs to log in first to obtain valid access tokens.

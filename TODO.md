# TODO: Fix API Loading and Favicon Errors

## Completed Tasks
- [x] Update frontend/config/api-config.js to add missing ENDPOINTS like EVENTS.SEARCH, adjust TIMEOUT to 30000, and remove 'Accept' from HEADERS
- [x] Remove duplicate API_CONFIG definition from frontend/assets/js/api.js
- [x] Add favicon link to frontend/pages/organizer/create-event.html

## Summary
Fixed the "API not loaded" error by resolving the JavaScript SyntaxError caused by duplicate const API_CONFIG declarations. The api-config.js was loaded first, defining API_CONFIG, then api.js tried to redefine it, causing the script to fail and window.api to remain undefined. By removing the duplicate definition and ensuring all necessary endpoints are in api-config.js, the API now loads correctly.

Also added a favicon link to prevent the ERR_EMPTY_RESPONSE error for favicon.ico requests.

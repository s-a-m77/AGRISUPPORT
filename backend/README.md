# AgriSupport API

NestJS API backed by PostgreSQL.

## Local development

```sh
cp .env.example .env
npm install
npm run db:up
npm run migration:run
npm run start:dev
```

The API is available at `http://localhost:3000/api`, and the database health
check is available at `http://localhost:3000/api/health`.

The AI Advisor uses a configurable provider through the protected backend
endpoint. Gemini is the default:

```env
PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash
```

OpenRouter can be selected as the primary provider. If `PROVIDER` is omitted,
the backend automatically selects OpenRouter when `OPENROUTER_API_KEY` is set:

```env
PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/auto
```

If the selected provider returns HTTP 429, a 5xx error, or a timeout, the
backend retries up to three times with 1s, 2s, and 4s delays, then tries the
other configured provider. API keys stay in `backend/.env`; never put them in
frontend code. Restart the backend after changing provider settings.

AI Advisor responses can be translated through Addis AI by setting
`ADDIS_AI_API_KEY` and `ADDIS_AI_BASE_URL=https://api.addisassistant.com`.
The backend calls `/api/v1/translate` when Amharic or Afaan Oromoo is selected.

Keep the frontend environment file at the project root as `.env` with:

```sh
VITE_API_URL=http://localhost:3000/api
```

Stop the local database with:

```sh
npm run db:down
```

For production, set `NODE_ENV=production` and provide all database values
through environment variables. Schema synchronization is disabled in
production.

## Farmland boundary mapping

The authenticated farm registration screen supports GPS tracking with
`navigator.geolocation.watchPosition()` and manual Leaflet editing. Both
methods submit a closed GeoJSON `Polygon` whose coordinates are
`[longitude, latitude]`. The backend validates closure, coordinate ranges,
duplicate consecutive points, self-intersections, and reasonable area before
recalculating authoritative area and perimeter; client measurements are never
trusted.

The boundary migration stores GeoJSON in PostgreSQL `jsonb`, which is the
portable fallback when PostGIS is not available. If PostGIS is enabled in a
deployment, the GeoJSON can be migrated to a geography column later without
changing the API contract. Pending points are kept in browser local storage
while the page remains active/offline; browser suspension, OS battery policy,
and denied location permission can still interrupt GPS updates.

On a phone, serve the frontend over HTTPS (or localhost), allow location
permission for the site, open **Farms**, choose **Map with GPS**, and walk the
boundary. Review or drag points before confirming registration. GPS readings
are estimates and are not legal survey measurements.

# Backend API Documentation

The backend service (Express + Telegraf) facilitates MIDI export and Telegram integration for the Mini App.

**Base URL (Development):** `http://localhost:3001`
**Base URL (Production):** `https://api.yourdomain.com` (Environment Variable `VITE_API_URL`)

## Authentication

All protected endpoints require the Telegram `initData` string in the request body. This data is validated server-side using the `BOT_TOKEN` to prevent replay attacks and ensure requests originate from the Telegram app.

### Validation Mechanism
1.  **HMAC-SHA256**: Uses `WebAppData` key to verify the signature.
2.  **Timestamp**: Checks `auth_date` to reject requests older than 24 hours.

## Endpoints

### 1. Upload MIDI File

Sends a generated MIDI file to the user via the Telegram Bot.

**URL:** `/upload-midi`
**Method:** `POST`
**Content-Type:** `application/json`

#### Request Body

| Parameter    | Type   | Required | Description |
|--------------|--------|----------|-------------|
| `initData`   | string | Yes      | The raw query string from `Telegram.WebApp.initData`. |
| `midiBase64` | string | Yes      | The MIDI file content encoded as a Base64 string. |
| `filename`   | string | No       | Desired filename (e.g., "my_song.mid"). Will be sanitized. |

#### Example Request

```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=...",
  "midiBase64": "TVRoZAAAAAYAAAABA...",
  "filename": "acid_jam_01.mid"
}
```

#### Success Response (200 OK)

```json
{
  "success": true
}
```

#### Error Responses

*   **400 Bad Request**: Malformed data or missing User ID.
    ```json
    { "error": "Malformed user data" }
    ```
*   **403 Forbidden**: Invalid `initData` or signature mismatch.
    ```json
    { "error": "Invalid authentication" }
    ```
*   **500 Internal Server Error**: Bot API failure or other server error.
    ```json
    { "error": "Не удалось отправить MIDI" }
    ```

## CORS Policy

The server implements CORS to allow requests from specified origins.
This is configured via the `ALLOWED_ORIGINS` environment variable (comma-separated list).

**Default (Dev):** `http://localhost:3000`
**Wildcard:** Requests with no `Origin` header (e.g., direct API calls, mobile apps) are allowed by default.

## Environment Variables

| Variable          | Description |
|-------------------|-------------|
| `BOT_TOKEN`       | **Required.** Telegram Bot API Token. |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs. |
| `PORT`            | Server port (default: 3001). |

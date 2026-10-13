# MyInstants REST API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-v4-orange.svg)](https://hono.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

REST API for scraping and querying soundboard items from [MyInstants](https://www.myinstants.com). Built with Hono and Cheerio in TypeScript.

## Features

- Scrapes search results, trending sounds, recent uploads, user profiles, and sound details.
- Computes audio duration directly from MP3 frame headers on demand.
- Includes pagination and duration range filtering.
- Provides CORS support and Cache-Control headers for frontend integration and edge caching.
- Compatible with Vercel Serverless, Cloudflare Workers, Node.js, and Bun.

## Requirements

- Node.js 18 or higher (or Bun)
- npm, pnpm, or bun

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Fadhila36/myinstants-api.git
cd myinstants-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

The server starts at `http://localhost:8000`.

### 4. Run tests

Run the unit test suite:

```bash
npm test
```

Run integration checks against live MyInstants pages:

```bash
npm run test:live
```

## Endpoints

| Method | Endpoint | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API status and link to documentation | None |
| `GET` | `/recent` | List recently uploaded sounds | `page`, `with_duration`, `min_duration`, `max_duration` |
| `GET` | `/trending` | List trending sounds by country code | `q` (required), `page`, `with_duration`, `min_duration`, `max_duration` |
| `GET` | `/best` | List all-time best sounds by country code | `q` (required), `page`, `with_duration`, `min_duration`, `max_duration` |
| `GET` | `/search` | Search sounds by name or keyword | `q` (required), `page`, `with_duration`, `min_duration`, `max_duration` |
| `GET` | `/detail` | Get complete details for a sound button | `id` (required), `with_duration` |
| `GET` | `/favorites` | List favorite sounds for a user profile | `username` (required), `page`, `with_duration`, `min_duration`, `max_duration` |
| `GET` | `/uploaded` | List sounds uploaded by a user profile | `username` (required), `page`, `with_duration`, `min_duration`, `max_duration` |

## Query Parameters

### Pagination

- `page` (integer, optional): The page number to retrieve. Must be a positive integer (`>= 1`). Default is `1`.

Example:
```bash
curl "http://localhost:8000/recent?page=2"
```

### Duration Probing and Filtering

MyInstants does not expose audio length on page listings. When requested, the API inspects MP3 audio frame headers directly:

- `with_duration` (boolean, optional): Set to `true`, `1`, or `yes` to include duration (in seconds) for each sound.
- `min_duration` (float, optional): Filters out sounds shorter than this duration in seconds.
- `max_duration` (float, optional): Filters out sounds longer than this duration in seconds.

Example:
```bash
curl "http://localhost:8000/search?q=boom&with_duration=true&min_duration=1.0&max_duration=5.0"
```

## Response Schema

### List Response

```json
{
  "status": "200",
  "author": "Fadhila36",
  "page": 1,
  "count": 36,
  "total_pages": 120,
  "has_next": true,
  "data": [
    {
      "id": "vine-boom-sound-70972",
      "title": "VINE BOOM SOUND",
      "url": "https://www.myinstants.com/en/instant/vine-boom-sound-70972/",
      "mp3": "https://www.myinstants.com/media/sounds/vine-boom.mp3",
      "duration": 2.14
    }
  ]
}
```

### Detail Response

```json
{
  "status": "200",
  "author": "Fadhila36",
  "data": {
    "id": "vine-boom-sound-70972",
    "url": "https://www.myinstants.com/en/instant/vine-boom-sound-70972",
    "title": "VINE BOOM SOUND",
    "mp3": "https://www.myinstants.com/media/sounds/vine-boom.mp3",
    "description": "Vine boom sound effect",
    "tags": ["#vine", "#boom", "#sound-effect"],
    "favorites": "1284",
    "views": "142980",
    "uploader": {
      "username": "sound_master",
      "url": "https://www.myinstants.com/en/profile/sound_master/uploaded/"
    },
    "duration": 2.14
  }
}
```

### Error Response

```json
{
  "status": "400",
  "author": "Fadhila36",
  "message": "Query parameter 'q' is required, example: ?q=vine boom"
}
```

## Deployment

### Vercel

The project includes preconfigured rewrites in `vercel.json` pointing to the serverless function handler at `api/index.ts`.

Deploy using the Vercel CLI:

```bash
npx vercel
```

Or connect the repository to your Vercel dashboard.

### Node.js Production Build

Compile TypeScript to JavaScript:

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License. See [LICENSE](https://github.com/Fadhila36/myinstants-api/blob/main/LICENSE) for details.

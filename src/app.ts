import { Hono, type Context } from 'hono';
import {
  AUTHOR_NAME,
  ApiValidationError,
  createErrorPayload,
  createPaginationMeta,
  createSuccessPayload,
  parseDurationParams,
  parsePageParam,
  setApiHeaders,
} from './utils/response.js';
import {
  appendPageParam,
  fetchHtml,
  parseSoundDetail,
  parseSounds,
  parseTotalPages,
  MYINSTANTS_BASE,
} from './services/scraper.js';
import { applyDurationFilter, fetchMp3Durations } from './services/audio.js';

export const app = new Hono();

// Global middleware for headers
app.use('*', async (c, next) => {
  setApiHeaders(c);
  await next();
});

// Helper for handling sound list endpoints
async function handleSoundListRequest(
  urlBuilder: () => string,
  c: Context
) {
  const page = parsePageParam(c.req.query('page'));
  const durationParams = parseDurationParams(
    c.req.query('with_duration'),
    c.req.query('min_duration'),
    c.req.query('max_duration')
  );

  const targetUrl = appendPageParam(urlBuilder(), page);
  const html = await fetchHtml(targetUrl);
  if (!html) {
    return c.json(createErrorPayload('Page not found', '404'), 404);
  }

  let sounds = parseSounds(html);
  const totalPages = parseTotalPages(html);

  sounds = await applyDurationFilter(
    sounds,
    durationParams.withDuration,
    durationParams.minDuration,
    durationParams.maxDuration
  );

  const meta = createPaginationMeta(page, totalPages, sounds.length);
  return c.json(createSuccessPayload(sounds, meta, '200'), 200);
}

// 1. Root documentation link
app.get('/', (c) => {
  return c.json(
    {
      status: '200',
      author: AUTHOR_NAME,
      message: 'Check https://github.com/Fadhila36/myinstants-api for documentation',
    },
    200
  );
});

// 2. Trending
app.get('/trending', async (c) => {
  const query = c.req.query('q');
  if (!query) {
    return c.json(
      createErrorPayload("Query parameter 'q' is required, example: ?q=id", '404'),
      404
    );
  }
  return handleSoundListRequest(
    () => `${MYINSTANTS_BASE}/en/index/${encodeURIComponent(query)}`,
    c
  );
});

// 3. Best of all time
app.get('/best', async (c) => {
  const query = c.req.query('q');
  if (!query) {
    return c.json(
      createErrorPayload("Query parameter 'q' is required, example: ?q=id", '404'),
      404
    );
  }
  return handleSoundListRequest(
    () => `${MYINSTANTS_BASE}/en/best_of_all_time/${encodeURIComponent(query)}`,
    c
  );
});

// 4. Recent
app.get('/recent', async (c) => {
  return handleSoundListRequest(() => `${MYINSTANTS_BASE}/en/recent`, c);
});

// 5. Search
app.get('/search', async (c) => {
  const query = c.req.query('q');
  if (!query) {
    return c.json(
      createErrorPayload(
        "Query parameter 'q' is required, example: ?q=vine boom",
        '404'
      ),
      404
    );
  }
  return handleSoundListRequest(
    () => `${MYINSTANTS_BASE}/en/search/?name=${encodeURIComponent(query)}`,
    c
  );
});

// 6. User favorites
app.get('/favorites', async (c) => {
  const username = c.req.query('username');
  if (!username) {
    return c.json(
      createErrorPayload(
        "Query parameter 'username' is required, example: ?username=hellmouz",
        '400'
      ),
      400
    );
  }
  return handleSoundListRequest(
    () => `${MYINSTANTS_BASE}/en/profile/${encodeURIComponent(username)}`,
    c
  );
});

// 7. User uploaded
app.get('/uploaded', async (c) => {
  const username = c.req.query('username');
  if (!username) {
    return c.json(
      createErrorPayload(
        "Query parameter 'username' is required, example: ?username=hellmouz",
        '400'
      ),
      400
    );
  }
  return handleSoundListRequest(
    () => `${MYINSTANTS_BASE}/en/profile/${encodeURIComponent(username)}/uploaded/`,
    c
  );
});

// 8. Detail
app.get('/detail', async (c) => {
  const id = c.req.query('id');
  if (!id) {
    return c.json(
      createErrorPayload(
        "Query parameter 'id' is required, example: ?id=akh-26815",
        '400'
      ),
      400
    );
  }

  const durationParams = parseDurationParams(
    c.req.query('with_duration'),
    c.req.query('min_duration'),
    c.req.query('max_duration')
  );

  const html = await fetchHtml(`${MYINSTANTS_BASE}/en/instant/${encodeURIComponent(id)}`);
  if (!html) {
    return c.json(createErrorPayload('Page not found', '404'), 404);
  }

  const detail = parseSoundDetail(id, html);

  if (durationParams.withDuration) {
    const durations = await fetchMp3Durations([detail.mp3]);
    detail.duration = durations.get(detail.mp3) ?? null;
  }

  return c.json(createSuccessPayload(detail, undefined, '200'), 200);
});

// Error handling middleware
app.onError((err, c) => {
  if (err instanceof ApiValidationError) {
    return c.json(
      createErrorPayload(err.message, String(err.statusCode)),
      // @ts-expect-error type narrowing for HTTP status
      err.statusCode
    );
  }

  if (err.message.includes('404') || err.message.includes('not found')) {
    return c.json(createErrorPayload(err.message, '404'), 404);
  }

  return c.json(createErrorPayload(err.message || 'Internal Server Error', '500'), 500);
});

// 404 fallback
app.notFound((c) => {
  return c.json(createErrorPayload('Endpoint not found', '404'), 404);
});

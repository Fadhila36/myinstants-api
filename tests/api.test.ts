import { describe, it, expect } from 'vitest';
import { app } from '../src/app.js';

describe('Hono API Endpoints', () => {
  it('GET / returns root documentation message with CORS and cache headers', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cache-Control')).toBe(
      's-maxage=3600, stale-while-revalidate'
    );

    const data = await res.json();
    expect(data).toEqual({
      status: '200',
      author: 'Fadhila36',
      message: 'Check https://github.com/Fadhila36/myinstants-api for documentation',
    });
  });

  it('GET /404 returns endpoint not found payload', async () => {
    const res = await app.request('/unknown-endpoint');
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toEqual({
      status: '404',
      author: 'Fadhila36',
      message: 'Endpoint not found',
    });
  });

  it('GET /trending validates required q parameter', async () => {
    const res = await app.request('/trending');
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("Query parameter 'q' is required, example: ?q=id");
  });

  it('GET /best validates required q parameter', async () => {
    const res = await app.request('/best');
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe("Query parameter 'q' is required, example: ?q=id");
  });

  it('GET /search validates required q parameter', async () => {
    const res = await app.request('/search');
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.message).toBe(
      "Query parameter 'q' is required, example: ?q=vine boom"
    );
  });

  it('GET /favorites validates required username parameter', async () => {
    const res = await app.request('/favorites');
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe(
      "Query parameter 'username' is required, example: ?username=hellmouz"
    );
  });

  it('GET /uploaded validates required username parameter', async () => {
    const res = await app.request('/uploaded');
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe(
      "Query parameter 'username' is required, example: ?username=hellmouz"
    );
  });

  it('GET /detail validates required id parameter', async () => {
    const res = await app.request('/detail');
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe(
      "Query parameter 'id' is required, example: ?id=akh-26815"
    );
  });

  it('validates invalid page query parameter', async () => {
    const res = await app.request('/recent?page=invalid');
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe(
      "Query parameter 'page' must be a positive integer, example: ?page=4"
    );
  });
});

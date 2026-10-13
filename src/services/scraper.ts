import * as cheerio from 'cheerio';
import type { SoundItem, SoundDetail } from '../types.js';

export const MYINSTANTS_BASE = 'https://www.myinstants.com';

export function appendPageParam(url: string, page: number): string {
  if (page <= 1) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}page=${page}`;
}

export function parseSounds(html: string): SoundItem[] {
  const $ = cheerio.load(html);
  const sounds: SoundItem[] = [];

  $('div.instant').each((_, element) => {
    const link = $(element).find('a.instant-link').first();
    if (!link.length) return;

    const title = link.text().trim();
    const href = link.attr('href') || '';
    const url = href.startsWith('http') ? href : `${MYINSTANTS_BASE}${href}`;
    const id = href.replace(/^\/en\/instant\//, '').replace(/\/$/, '').trim();

    const btn = $(element).find('button.small-button').first();
    const onclick = btn.attr('onclick') || '';
    const match = onclick.match(/play\('([^']+)'/);

    if (match && match[1]) {
      const mp3Rel = match[1];
      const mp3 = mp3Rel.startsWith('http') ? mp3Rel : `${MYINSTANTS_BASE}${mp3Rel}`;

      sounds.push({
        id,
        title,
        url,
        mp3,
      });
    }
  });

  return sounds;
}

export function parseTotalPages(html: string): number | null {
  const $ = cheerio.load(html);
  const texts: string[] = [];

  const titleText = $('title').first().text();
  if (titleText) texts.push(titleText);

  $('meta[name="description"]').each((_, el) => {
    const c = $(el).attr('content');
    if (c) texts.push(c);
  });

  for (const t of texts) {
    const match = t.match(/Page\s+\d+\s+of\s+(\d+)/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  return null;
}

export function parseSoundDetail(id: string, html: string): SoundDetail {
  const $ = cheerio.load(html);

  const titleEl = $('h1#instant-page-title').first();
  if (!titleEl.length) {
    throw new Error('Page not found');
  }
  const title = titleEl.text().trim();

  const buttonEl = $('button#instant-page-button-element').first();
  const soundUrl = buttonEl.attr('data-url') || '';
  const mp3 = soundUrl.startsWith('http') ? soundUrl : `${MYINSTANTS_BASE}${soundUrl}`;

  const description = $('div#instant-page-description p').first().text().trim() || '';

  const tags: string[] = [];
  $('div#instant-page-tags a').each((_, el) => {
    const tag = $(el).text().trim();
    if (tag) tags.push(tag);
  });

  const favoritesRaw = $('div#instant-page-likes b').first().text().trim();
  const favorites = favoritesRaw.replace(/\s+users/i, '').trim();

  let uploader = 'Unknown';
  let uploaderUrl = '';
  let views = '0';

  // Find the element containing "Uploaded by"
  $('div').each((_, el) => {
    const text = $(el).text();
    if (text.includes('Uploaded by')) {
      const link = $(el).find('a').first();
      if (link.length) {
        uploader = link.text().trim();
        const href = link.attr('href') || '';
        uploaderUrl = href.startsWith('http') ? href : `${MYINSTANTS_BASE}${href}`;

        const viewsMatch = text.match(/-\s*([\d,.]+)\s*views/i);
        if (viewsMatch && viewsMatch[1]) {
          views = viewsMatch[1].trim();
        } else {
          const cleaned = text
            .replace(/views/gi, '')
            .replace(`Uploaded by ${uploader} - `, '')
            .trim();
          if (cleaned) views = cleaned;
        }
      }
    }
  });

  // Fallback to meta description if needed
  if (uploader === 'Unknown') {
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const uploaderMatch = metaDesc.match(/Uploaded\s+by\s+([^.]+)\./i);
    if (uploaderMatch && uploaderMatch[1]) {
      uploader = uploaderMatch[1].trim();
      uploaderUrl = `${MYINSTANTS_BASE}/en/profile/${encodeURIComponent(uploader)}/uploaded/`;
    }
    const viewsMatch = metaDesc.match(/([\d,.]+)\s*views/i);
    if (viewsMatch && viewsMatch[1]) {
      views = viewsMatch[1].trim();
    }
  }

  return {
    id,
    url: `${MYINSTANTS_BASE}/en/instant/${id}`,
    title,
    mp3,
    description,
    tags,
    favorites,
    views,
    uploader: {
      username: uploader,
      url: uploaderUrl,
    },
  };
}

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: HTTP ${res.status}`);
  }

  return await res.text();
}

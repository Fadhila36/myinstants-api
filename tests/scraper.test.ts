import { describe, it, expect } from 'vitest';
import {
  parseSounds,
  parseTotalPages,
  parseSoundDetail,
  appendPageParam,
} from '../src/services/scraper.js';

describe('Scraper Service', () => {
  describe('appendPageParam', () => {
    it('does not append page parameter for page <= 1', () => {
      expect(appendPageParam('https://www.myinstants.com/en/recent', 1)).toBe(
        'https://www.myinstants.com/en/recent'
      );
      expect(appendPageParam('https://www.myinstants.com/en/recent', 0)).toBe(
        'https://www.myinstants.com/en/recent'
      );
    });

    it('appends ?page=N when no query string exists', () => {
      expect(appendPageParam('https://www.myinstants.com/en/recent', 2)).toBe(
        'https://www.myinstants.com/en/recent?page=2'
      );
    });

    it('appends &page=N when query string exists', () => {
      expect(
        appendPageParam('https://www.myinstants.com/en/search/?name=boom', 3)
      ).toBe('https://www.myinstants.com/en/search/?name=boom&page=3');
    });
  });

  describe('parseSounds', () => {
    it('extracts sounds list from HTML structure', () => {
      const sampleHtml = `
        <div class="instant">
          <button class="small-button" onclick="play('/media/sounds/vine-boom.mp3')"></button>
          <a class="instant-link" href="/en/instant/vine-boom/">Vine Boom</a>
        </div>
        <div class="instant">
          <button class="small-button" onclick="play('/media/sounds/bruh.mp3')"></button>
          <a class="instant-link" href="/en/instant/bruh-sound-effect/">Bruh</a>
        </div>
      `;

      const sounds = parseSounds(sampleHtml);
      expect(sounds).toHaveLength(2);
      expect(sounds[0]).toEqual({
        id: 'vine-boom',
        title: 'Vine Boom',
        url: 'https://www.myinstants.com/en/instant/vine-boom/',
        mp3: 'https://www.myinstants.com/media/sounds/vine-boom.mp3',
      });
      expect(sounds[1].id).toBe('bruh-sound-effect');
    });
  });

  describe('parseTotalPages', () => {
    it('finds total pages from title or description meta', () => {
      const html1 = '<title>Trending buttons - Page 1 of 42 - Myinstants</title>';
      expect(parseTotalPages(html1)).toBe(42);

      const html2 = '<meta name="description" content="Search results Page 2 of 105">';
      expect(parseTotalPages(html2)).toBe(105);

      const html3 = '<title>Myinstants - Just sound</title>';
      expect(parseTotalPages(html3)).toBeNull();
    });
  });

  describe('parseSoundDetail', () => {
    it('parses detail page correctly', () => {
      const detailHtml = `
        <h1 id="instant-page-title">Vine Boom</h1>
        <button id="instant-page-button-element" data-url="/media/sounds/vine-boom.mp3"></button>
        <div id="instant-page-description"><p>The classic boom sound.</p></div>
        <div id="instant-page-tags">
          <a href="/en/tags/meme">meme</a>
          <a href="/en/tags/vine">vine</a>
        </div>
        <div id="instant-page-likes"><b>1234 users</b></div>
        <div>ad banner</div>
        <div>Uploaded by <a href="/en/profile/editor1">editor1</a> - 5678 views</div>
      `;

      const detail = parseSoundDetail('vine-boom', detailHtml);
      expect(detail.id).toBe('vine-boom');
      expect(detail.title).toBe('Vine Boom');
      expect(detail.mp3).toBe('https://www.myinstants.com/media/sounds/vine-boom.mp3');
      expect(detail.description).toBe('The classic boom sound.');
      expect(detail.tags).toEqual(['meme', 'vine']);
      expect(detail.favorites).toBe('1234');
      expect(detail.uploader).toEqual({
        username: 'editor1',
        url: 'https://www.myinstants.com/en/profile/editor1',
      });
      expect(detail.views).toBe('5678');
    });
  });
});

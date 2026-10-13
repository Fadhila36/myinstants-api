import { describe, it, expect } from 'vitest';
import {
  parsePageParam,
  parseDurationParams,
  createPaginationMeta,
  createErrorPayload,
  createSuccessPayload,
  ApiValidationError,
  AUTHOR_NAME,
} from '../src/utils/response.js';

describe('Response utils & validation', () => {
  it('formats success payload correctly', () => {
    const payload = createSuccessPayload([{ id: 'test' }], { page: 1, count: 1 });
    expect(payload).toEqual({
      status: '200',
      author: AUTHOR_NAME,
      page: 1,
      count: 1,
      data: [{ id: 'test' }],
    });
  });

  it('formats error payload correctly', () => {
    const payload = createErrorPayload('Something went wrong', '404');
    expect(payload).toEqual({
      status: '404',
      author: AUTHOR_NAME,
      message: 'Something went wrong',
    });
  });

  describe('parsePageParam', () => {
    it('defaults to 1 if empty or undefined', () => {
      expect(parsePageParam(undefined)).toBe(1);
      expect(parsePageParam('')).toBe(1);
    });

    it('parses valid positive integers', () => {
      expect(parsePageParam('5')).toBe(5);
      expect(parsePageParam('1')).toBe(1);
    });

    it('throws error for non-integer or negative or zero numbers', () => {
      expect(() => parsePageParam('abc')).toThrow(ApiValidationError);
      expect(() => parsePageParam('-1')).toThrow(ApiValidationError);
      expect(() => parsePageParam('0')).toThrow(ApiValidationError);
      expect(() => parsePageParam('1.5')).toThrow(ApiValidationError);
    });
  });

  describe('parseDurationParams', () => {
    it('returns default false when not provided', () => {
      const res = parseDurationParams(undefined, undefined, undefined);
      expect(res).toEqual({
        withDuration: false,
        minDuration: null,
        maxDuration: null,
      });
    });

    it('detects withDuration flags (1, true, yes)', () => {
      expect(parseDurationParams('1', undefined, undefined).withDuration).toBe(true);
      expect(parseDurationParams('true', undefined, undefined).withDuration).toBe(true);
      expect(parseDurationParams('yes', undefined, undefined).withDuration).toBe(true);
      expect(parseDurationParams('no', undefined, undefined).withDuration).toBe(false);
    });

    it('parses min and max duration numbers', () => {
      const res = parseDurationParams(undefined, '1.5', '5.0');
      expect(res).toEqual({
        withDuration: true,
        minDuration: 1.5,
        maxDuration: 5.0,
      });
    });

    it('throws error when min > max', () => {
      expect(() => parseDurationParams(undefined, '6', '2')).toThrow(
        "Query parameter 'min_duration' must be <= 'max_duration'"
      );
    });

    it('throws error when min or max is negative or non-numeric', () => {
      expect(() => parseDurationParams(undefined, '-1', '2')).toThrow();
      expect(() => parseDurationParams(undefined, 'abc', '2')).toThrow();
    });
  });

  describe('createPaginationMeta', () => {
    it('calculates has_next accurately', () => {
      expect(createPaginationMeta(1, 5, 20)).toEqual({
        page: 1,
        count: 20,
        total_pages: 5,
        has_next: true,
      });
      expect(createPaginationMeta(5, 5, 10)).toEqual({
        page: 5,
        count: 10,
        total_pages: 5,
        has_next: false,
      });
      expect(createPaginationMeta(1, null, 15)).toEqual({
        page: 1,
        count: 15,
        total_pages: null,
        has_next: null,
      });
    });
  });
});

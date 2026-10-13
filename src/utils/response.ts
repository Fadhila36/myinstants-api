import type { Context } from 'hono';
import type { DurationFilterParams, PaginationMeta } from '../types.js';

export const AUTHOR_NAME = 'Fadhila36';

export class ApiValidationError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ApiValidationError';
    this.statusCode = statusCode;
  }
}

export function createErrorPayload(message: string, status = '404') {
  return {
    status,
    author: AUTHOR_NAME,
    message,
  };
}

export function createSuccessPayload<T>(
  data: T,
  meta?: Partial<PaginationMeta>,
  status = '200'
) {
  const payload: Record<string, unknown> = {
    status,
    author: AUTHOR_NAME,
    ...meta,
    data,
  };
  return payload;
}

export function setApiHeaders(c: Context) {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Cache-Control', 's-maxage=3600, stale-while-revalidate');
}

export function parsePageParam(rawPage: string | undefined): number {
  if (rawPage === undefined || rawPage === '') {
    return 1;
  }

  if (!/^\d+$/.test(rawPage)) {
    throw new ApiValidationError(
      "Query parameter 'page' must be a positive integer, example: ?page=4",
      400
    );
  }

  const page = parseInt(rawPage, 10);
  if (page < 1) {
    throw new ApiValidationError(
      "Query parameter 'page' must be >= 1, example: ?page=4",
      400
    );
  }

  return page;
}

export function parseDurationParams(
  withDurationRaw: string | undefined,
  minDurationRaw: string | undefined,
  maxDurationRaw: string | undefined
): DurationFilterParams {
  let withDuration = false;
  if (withDurationRaw) {
    const lower = withDurationRaw.toLowerCase();
    withDuration = lower === '1' || lower === 'true' || lower === 'yes';
  }

  let minDuration: number | null = null;
  if (minDurationRaw !== undefined && minDurationRaw !== '') {
    const num = Number(minDurationRaw);
    if (isNaN(num) || num < 0) {
      throw new ApiValidationError(
        "Query parameter 'min_duration' must be a number >= 0 (seconds), example: ?min_duration=2",
        400
      );
    }
    minDuration = num;
    withDuration = true;
  }

  let maxDuration: number | null = null;
  if (maxDurationRaw !== undefined && maxDurationRaw !== '') {
    const num = Number(maxDurationRaw);
    if (isNaN(num) || num < 0) {
      throw new ApiValidationError(
        "Query parameter 'max_duration' must be a number >= 0 (seconds), example: ?max_duration=6",
        400
      );
    }
    maxDuration = num;
    withDuration = true;
  }

  if (minDuration !== null && maxDuration !== null && minDuration > maxDuration) {
    throw new ApiValidationError(
      "Query parameter 'min_duration' must be <= 'max_duration'",
      400
    );
  }

  return { withDuration, minDuration, maxDuration };
}

export function createPaginationMeta(
  page: number,
  totalPages: number | null,
  count: number
): PaginationMeta {
  return {
    page,
    count,
    total_pages: totalPages,
    has_next: totalPages !== null ? page < totalPages : null,
  };
}

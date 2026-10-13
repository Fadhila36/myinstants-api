import type { SoundItem } from '../types.js';

const BITRATES_MPEG1 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
const BITRATES_MPEG2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0];
const SAMPLERATES = [
  [44100, 48000, 32000, 0],
  [22050, 24000, 16000, 0],
  [11025, 12000, 8000, 0],
];

export function mp3DurationFromData(data: Uint8Array): number | null {
  const len = data.length;
  if (len < 5) return null;

  let pos = 0;

  // Skip ID3v2 header
  if (
    len > 10 &&
    data[0] === 0x49 && // 'I'
    data[1] === 0x44 && // 'D'
    data[2] === 0x33    // '3'
  ) {
    const size =
      ((data[6] & 0x7f) << 21) |
      ((data[7] & 0x7f) << 14) |
      ((data[8] & 0x7f) << 7) |
      (data[9] & 0x7f);
    pos = 10 + size;
  }

  let duration = 0.0;
  let frames = 0;
  let guard = 0;

  while (pos + 4 <= len && guard < 10000) {
    guard++;
    if (data[pos] !== 0xff || (data[pos + 1] & 0xe0) !== 0xe0) {
      pos++;
      continue;
    }

    const b1 = data[pos + 1];
    const b2 = data[pos + 2];

    const verBits = (b1 >> 3) & 0x03;
    const layerBits = (b1 >> 1) & 0x03;
    const bitrateIdx = (b2 >> 4) & 0x0f;
    const sampleIdx = (b2 >> 2) & 0x03;
    const pad = (b2 >> 1) & 0x01;

    // Only MPEG Layer III with valid indices
    if (
      layerBits !== 1 ||
      bitrateIdx === 0 ||
      bitrateIdx === 15 ||
      sampleIdx === 3 ||
      verBits === 1
    ) {
      pos++;
      continue;
    }

    let bitrate = 0;
    let verIdx = 0;

    if (verBits === 3) {
      bitrate = (BITRATES_MPEG1[bitrateIdx] ?? 0) * 1000;
      verIdx = 0;
    } else if (verBits === 2) {
      bitrate = (BITRATES_MPEG2[bitrateIdx] ?? 0) * 1000;
      verIdx = 1;
    } else {
      bitrate = (BITRATES_MPEG2[bitrateIdx] ?? 0) * 1000;
      verIdx = 2;
    }

    if (bitrate <= 0) {
      pos++;
      continue;
    }

    const samplerate = SAMPLERATES[verIdx]?.[sampleIdx] ?? 0;
    if (samplerate <= 0) {
      pos++;
      continue;
    }

    let frameLen = 0;
    let samples = 0;

    if (verBits === 3) {
      frameLen = Math.floor((144 * bitrate) / samplerate + pad);
      samples = 1152;
    } else {
      frameLen = Math.floor((72 * bitrate) / samplerate + pad);
      samples = 576;
    }

    if (frameLen < 1 || pos + frameLen > len + 1) {
      if (pos + frameLen > len && frames > 0) {
        duration += samples / samplerate;
        frames++;
      } else {
        pos++;
        continue;
      }
      break;
    }

    duration += samples / samplerate;
    frames++;
    pos += frameLen;
  }

  if (frames === 0) return null;
  return Math.round(duration * 100) / 100;
}

export async function fetchMp3Durations(
  urls: string[]
): Promise<Map<string, number | null>> {
  const result = new Map<string, number | null>();
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  if (uniqueUrls.length === 0) return result;

  await Promise.all(
    uniqueUrls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          result.set(url, null);
          return;
        }

        const arrayBuffer = await res.arrayBuffer();
        const duration = mp3DurationFromData(new Uint8Array(arrayBuffer));
        result.set(url, duration);
      } catch {
        result.set(url, null);
      }
    })
  );

  return result;
}

export async function applyDurationFilter(
  sounds: SoundItem[],
  withDuration: boolean,
  minDuration: number | null,
  maxDuration: number | null
): Promise<SoundItem[]> {
  if (!withDuration && minDuration === null && maxDuration === null) {
    return sounds;
  }

  const urls = sounds.map((s) => s.mp3).filter(Boolean);
  const durations = await fetchMp3Durations(urls);

  const filtered: SoundItem[] = [];
  for (const sound of sounds) {
    const d = durations.get(sound.mp3) ?? null;
    if (minDuration !== null && (d === null || d < minDuration)) continue;
    if (maxDuration !== null && (d === null || d > maxDuration)) continue;

    filtered.push({
      ...sound,
      duration: d,
    });
  }

  return filtered;
}

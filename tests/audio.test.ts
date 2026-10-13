import { describe, it, expect } from 'vitest';
import { mp3DurationFromData, applyDurationFilter } from '../src/services/audio.js';

describe('MP3 Duration Service', () => {
  it('returns null for empty or invalid buffer', () => {
    expect(mp3DurationFromData(new Uint8Array([]))).toBeNull();
    expect(mp3DurationFromData(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });

  it('correctly calculates duration from valid MPEG-1 Layer III frame header', () => {
    // Construct a synthetic valid MPEG-1 Layer 3 frame:
    // Sync: 0xFF, 0xFB (MPEG-1, Layer 3, no protection)
    // Bitrate & Samplerate: 0x90 (128kbps, 44100Hz, no padding)
    // 144 * 128000 / 44100 = 417 bytes frame length
    const frameLength = 417;
    const buffer = new Uint8Array(frameLength * 3);
    for (let f = 0; f < 3; f++) {
      const offset = f * frameLength;
      buffer[offset] = 0xff;
      buffer[offset + 1] = 0xfb;
      buffer[offset + 2] = 0x90;
      buffer[offset + 3] = 0x00;
    }

    const duration = mp3DurationFromData(buffer);
    // 3 frames * 1152 samples / 44100 = ~0.078 seconds
    expect(duration).toBeGreaterThan(0.05);
    expect(duration).toBeLessThan(0.1);
  });

  it('filters sounds according to duration parameters', async () => {
    const mockSounds = [
      { id: '1', title: 'S1', url: 'u1', mp3: 'm1' },
      { id: '2', title: 'S2', url: 'u2', mp3: 'm2' },
    ];

    // If duration params are all default, return as-is without network call
    const result = await applyDurationFilter(mockSounds, false, null, null);
    expect(result).toHaveLength(2);
    expect(result[0].duration).toBeUndefined();
  });
});

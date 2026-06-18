import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const sampleRate = 44100;

function clampSample(value) {
  return Math.max(-1, Math.min(1, value));
}

function encodeWav(samples, sampleRateHz = sampleRate) {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt32LE(sampleRateHz, offset); offset += 4;
  buffer.writeUInt32LE(sampleRateHz * 2, offset); offset += 4;
  buffer.writeUInt16LE(2, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (const sample of samples) {
    buffer.writeInt16LE(Math.round(clampSample(sample) * 32767), offset);
    offset += 2;
  }

  return buffer;
}

function sineTone({ durationSeconds, frequency, volume = 0.3, fadeSeconds = 0.02 }) {
  const totalSamples = Math.round(durationSeconds * sampleRate);
  const samples = new Array(totalSamples);
  const fadeSamples = Math.max(1, Math.round(fadeSeconds * sampleRate));

  for (let i = 0; i < totalSamples; i += 1) {
    const time = i / sampleRate;
    const fadeIn = Math.min(1, i / fadeSamples);
    const fadeOut = Math.min(1, (totalSamples - i) / fadeSamples);
    const envelope = Math.min(fadeIn, fadeOut);
    samples[i] = Math.sin(2 * Math.PI * frequency * time) * volume * envelope;
  }

  return encodeWav(samples);
}

function ambience({ durationSeconds, seed, volume = 0.12 }) {
  const totalSamples = Math.round(durationSeconds * sampleRate);
  const samples = new Array(totalSamples);
  let state = seed >>> 0;

  function rand() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0xffffffff;
  }

  for (let i = 0; i < totalSamples; i += 1) {
    const slowWave = Math.sin((i / sampleRate) * Math.PI * 0.55) * 0.5;
    const hiss = (rand() * 2 - 1) * 0.18;
    const drift = Math.sin((i / sampleRate) * Math.PI * 0.11 + seed) * 0.22;
    samples[i] = (slowWave + hiss + drift) * volume;
  }

  return encodeWav(samples);
}

const root = 'public/audio';
const phraseDir = join(root, 'phrases');
const musicDir = join(root, 'music');
mkdirSync(phraseDir, { recursive: true });
mkdirSync(musicDir, { recursive: true });

const phraseFiles = [
  ['phrase-01.wav', 428],
  ['phrase-02.wav', 436],
  ['phrase-03.wav', 444],
  ['phrase-04.wav', 452],
  ['phrase-05.wav', 460],
  ['phrase-06.wav', 468],
  ['phrase-07.wav', 476],
  ['phrase-08.wav', 484],
  ['phrase-09.wav', 492],
  ['phrase-10.wav', 500],
  ['phrase-11.wav', 508],
  ['phrase-12.wav', 516],
  ['phrase-13.wav', 524],
  ['phrase-14.wav', 532],
  ['phrase-15.wav', 540],
  ['phrase-16.wav', 548],
  ['phrase-17.wav', 556],
  ['phrase-18.wav', 564],
  ['phrase-19.wav', 572],
  ['phrase-20.wav', 580],
];

for (const [name, frequency] of phraseFiles) {
  writeFileSync(join(phraseDir, name), sineTone({ durationSeconds: 0.9, frequency, volume: 0.22 }));
}

writeFileSync(join(musicDir, 'rain.wav'), ambience({ durationSeconds: 8, seed: 1, volume: 0.14 }));
writeFileSync(join(musicDir, 'ocean.wav'), ambience({ durationSeconds: 8, seed: 2, volume: 0.13 }));
writeFileSync(join(musicDir, 'drift.wav'), ambience({ durationSeconds: 8, seed: 3, volume: 0.11 }));

console.log(`Generated ${phraseFiles.length} phrase fixtures and 3 ambient loops in ${root}.`);

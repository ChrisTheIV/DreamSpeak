import assert from 'node:assert/strict';
import { audioRegistry, createDefaultSettings, normalizeSettings } from '../public/modules/audio-registry.js';
import { PhraseScheduler } from '../public/modules/phrase-scheduler.js';

function repeatingRandom(values) {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

const settings = createDefaultSettings();
const scheduler = new PhraseScheduler(audioRegistry, repeatingRandom([0.1, 0.35, 0.65, 0.85]));
const settling = scheduler.buildPlan(settings, 30);
assert.ok(settling);
assert.equal(settling.phaseId, 'settling');
assert.ok(settling.delaySeconds >= 8 && settling.delaySeconds <= 18);
assert.ok(settling.repeatCount >= 1 && settling.repeatCount <= 2);
assert.ok(settling.playbackRate >= 0.97 && settling.playbackRate <= 1.04);
const holding = scheduler.buildPlan(settings, 800);
assert.ok(holding);
assert.equal(holding.phaseId, 'holding');
assert.ok(holding.delaySeconds >= 14 && holding.delaySeconds <= 38);
const empty = scheduler.buildPlan(normalizeSettings({ ...settings, enabledPhraseIds: [] }), 0);
assert.equal(empty, null);
const onePhraseSettings = normalizeSettings({ ...settings, enabledPhraseIds: ['phrase-05'] });
for (let index = 0; index < 5; index += 1) {
  assert.equal(scheduler.buildPlan(onePhraseSettings, index * 10).phrase.id, 'phrase-05');
}
const custom = normalizeSettings({ ...settings, modeId: 'custom', minDelaySeconds: 3, maxDelaySeconds: 3, minRepeats: 2, maxRepeats: 2, minPlaybackRate: 1, maxPlaybackRate: 1 });
const customPlan = scheduler.buildPlan(custom, 0);
assert.equal(customPlan.phaseId, 'custom');
assert.equal(customPlan.delaySeconds, 3);
assert.equal(customPlan.repeatCount, 2);
assert.equal(customPlan.playbackRate, 1);
console.log(JSON.stringify({ settling: 'bounded', holding: 'bounded', emptySelection: 'safe', onePhrasePool: 'safe', custom: 'bounded' }, null, 2));

import { describe, it, expect } from 'vitest';
import { scenarioReply, freeTextReply, generalTopics, orderTopics } from './supportScenario';
import { orders } from './demo';
describe('scripted support matrix', () => {
  it('all reachable options lead to a scripted answer or the close action', () => {
    for (const order of [undefined, orders[0]]) {
      const queue = [...generalTopics, ...orderTopics]; const seen = new Set<string>();
      while (queue.length) {
        const option = queue.shift()!;
        if (seen.has(option) || option === 'Завершить диалог') continue;
        seen.add(option);
        const result = scenarioReply(option, order);
        expect(result.text).not.toBe(freeTextReply().text);
        expect(result.suggestions.length).toBeGreaterThan(0);
        queue.push(...result.suggestions);
      }
      expect(seen.size).toBeGreaterThan(20);
    }
  });
  it('free text has safe continuation and order branches use the selected order', () => {
    expect(freeTextReply().suggestions).toContain('Завершить диалог');
    expect(scenarioReply('Уточнить время', orders[1]).text).toContain('№748');
  });
});

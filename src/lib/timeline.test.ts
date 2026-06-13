import { describe, it, expect } from 'vitest';
import type { TimelineConfig } from './timeline';
import { dateToPixel, pixelToDate, taskToBar, computeTimelineBounds } from './timeline';
import { today } from './dates';

const config: TimelineConfig = {
  startDate: '2024-01-01',
  totalDays: 30,
  dayWidth: 40,
};

describe('dateToPixel', () => {
  it('retourne 0 pour la date de début', () => {
    expect(dateToPixel('2024-01-01', config)).toBe(0);
  });

  it('retourne dayWidth pour le lendemain', () => {
    expect(dateToPixel('2024-01-02', config)).toBe(40);
  });

  it('retourne N * dayWidth pour J+N', () => {
    expect(dateToPixel('2024-01-11', config)).toBe(400); // +10 jours
  });

  it('retourne un négatif pour une date avant le début', () => {
    expect(dateToPixel('2023-12-31', config)).toBe(-40);
  });
});

describe('pixelToDate', () => {
  it('retourne startDate pour 0 pixel', () => {
    expect(pixelToDate(0, config)).toBe('2024-01-01');
  });

  it('retourne le lendemain pour dayWidth pixels', () => {
    expect(pixelToDate(40, config)).toBe('2024-01-02');
  });

  it('tronque le pixel partiel (floor)', () => {
    expect(pixelToDate(55, config)).toBe('2024-01-02'); // 55/40 = 1.375 → floor = 1
  });

  it('retourne J+N pour N*dayWidth pixels', () => {
    expect(pixelToDate(200, config)).toBe('2024-01-06'); // 200/40 = 5 jours
  });
});

describe('taskToBar', () => {
  it('tâche sur 1 jour : x=0, width=dayWidth', () => {
    const bar = taskToBar({ startDate: '2024-01-01', endDate: '2024-01-01' }, config);
    expect(bar.x).toBe(0);
    expect(bar.width).toBe(40);
  });

  it('tâche sur 3 jours : width = 3 * dayWidth', () => {
    const bar = taskToBar({ startDate: '2024-01-01', endDate: '2024-01-03' }, config);
    expect(bar.x).toBe(0);
    expect(bar.width).toBe(120);
  });

  it('tâche décalée de 5 jours, durée 2 jours', () => {
    const bar = taskToBar({ startDate: '2024-01-06', endDate: '2024-01-07' }, config);
    expect(bar.x).toBe(200); // 5 jours * 40px
    expect(bar.width).toBe(80); // 2 jours * 40px
  });

  it('endDate < startDate : largeur minimale de 1 jour', () => {
    const bar = taskToBar({ startDate: '2024-01-10', endDate: '2024-01-05' }, config);
    expect(bar.width).toBe(40); // clampé à 1 jour
  });

  it('round-trip dateToPixel / pixelToDate cohérent avec taskToBar', () => {
    const task = { startDate: '2024-01-08', endDate: '2024-01-12' };
    const bar = taskToBar(task, config);
    expect(pixelToDate(bar.x, config)).toBe(task.startDate);
  });
});

describe('computeTimelineBounds', () => {
  it('liste vide : totalDays = minTotalDays', () => {
    const { totalDays } = computeTimelineBounds([], 56);
    expect(totalDays).toBe(56);
  });

  it('liste vide : startDate est aujourd\'hui', () => {
    const { startDate } = computeTimelineBounds([], 56);
    expect(startDate).toBe(today());
  });

  it('tâches avec dates null ignorées, traité comme liste vide', () => {
    const { totalDays } = computeTimelineBounds(
      [{ startDate: null, endDate: null }, { startDate: '2024-03-01', endDate: null }],
      56,
    );
    expect(totalDays).toBe(56);
  });

  it('tâche unique : startDate = taskStart - 7j', () => {
    const { startDate } = computeTimelineBounds(
      [{ startDate: '2024-03-08', endDate: '2024-03-10' }],
      56,
    );
    expect(startDate).toBe('2024-03-01'); // 7 jours avant le 08
  });

  it('tâche unique : totalDays respecte le padding de 14j après endDate', () => {
    const { startDate, totalDays } = computeTimelineBounds(
      [{ startDate: '2024-03-08', endDate: '2024-03-10' }],
      56,
    );
    // rangeStart=2024-03-01, rangeEnd=2024-03-24 (10 + 14j) → span=24j < 56
    expect(startDate).toBe('2024-03-01');
    expect(totalDays).toBe(56); // plancher minTotalDays
  });

  it('plusieurs tâches : la plage englobe toutes les dates', () => {
    const { startDate, totalDays } = computeTimelineBounds(
      [
        { startDate: '2024-01-15', endDate: '2024-01-20' },
        { startDate: '2024-01-01', endDate: '2024-01-05' },
        { startDate: '2024-02-01', endDate: '2024-02-28' },
      ],
      30,
    );
    // earliest start = 2024-01-01 → rangeStart = 2023-12-25
    // latest end     = 2024-02-28 → rangeEnd   = 2024-03-13
    // span = diff(2023-12-25, 2024-03-13) + 1 = 80j > 30j
    expect(startDate).toBe('2023-12-25');
    expect(totalDays).toBe(80);
  });

  it('tâche très étendue : totalDays > minTotalDays', () => {
    const { totalDays } = computeTimelineBounds(
      [{ startDate: '2024-01-01', endDate: '2024-12-31' }],
      56,
    );
    // rangeStart = 2023-12-25, rangeEnd = 2025-01-14 → span >> 56
    expect(totalDays).toBeGreaterThan(56);
  });
});

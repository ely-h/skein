import { describe, it, expect } from 'vitest';
import {
  parseDate,
  formatDate,
  addDays,
  diffInDays,
  isValidDateString,
  today,
  clampDate,
} from './dates';

describe('parseDate / formatDate', () => {
  it('parse puis formate en round-trip', () => {
    expect(formatDate(parseDate('2024-03-15'))).toBe('2024-03-15');
  });

  it('formate correctement une date connue', () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe('2024-01-01');
  });
});

describe('addDays', () => {
  it('ajoute des jours positifs', () => {
    expect(addDays('2024-01-01', 5)).toBe('2024-01-06');
  });

  it('ajoute zéro jour', () => {
    expect(addDays('2024-06-15', 0)).toBe('2024-06-15');
  });

  it('soustrait des jours (négatif)', () => {
    expect(addDays('2024-01-10', -3)).toBe('2024-01-07');
  });

  it('traverse un changement de mois', () => {
    expect(addDays('2024-01-30', 3)).toBe('2024-02-02');
  });

  it('traverse une année bissextile', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });
});

describe('diffInDays', () => {
  it('retourne 0 pour le même jour', () => {
    expect(diffInDays('2024-01-01', '2024-01-01')).toBe(0);
  });

  it('retourne la différence correcte', () => {
    expect(diffInDays('2024-01-01', '2024-01-10')).toBe(9);
  });

  it('retourne un négatif si endDate < startDate', () => {
    expect(diffInDays('2024-01-10', '2024-01-05')).toBe(-5);
  });

  it('traverse un mois', () => {
    expect(diffInDays('2024-01-28', '2024-02-03')).toBe(6);
  });
});

describe('isValidDateString', () => {
  it('accepte une date valide', () => {
    expect(isValidDateString('2024-06-15')).toBe(true);
  });

  it('accepte le 29 février en année bissextile', () => {
    expect(isValidDateString('2024-02-29')).toBe(true);
  });

  it('rejette le 29 février hors année bissextile', () => {
    expect(isValidDateString('2023-02-29')).toBe(false);
  });

  it('rejette le 31 dans un mois à 30 jours', () => {
    expect(isValidDateString('2024-04-31')).toBe(false);
  });

  it('rejette un format incorrect', () => {
    expect(isValidDateString('15/06/2024')).toBe(false);
    expect(isValidDateString('2024-6-5')).toBe(false);
    expect(isValidDateString('')).toBe(false);
    expect(isValidDateString('not-a-date')).toBe(false);
  });
});

describe('today', () => {
  it('retourne une chaîne au format YYYY-MM-DD', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('est cohérent avec formatDate(new Date())', () => {
    expect(today()).toBe(formatDate(new Date()));
  });
});

describe('clampDate', () => {
  it('retourne la date telle quelle si dans les bornes', () => {
    expect(clampDate('2024-06-15', '2024-01-01', '2024-12-31')).toBe('2024-06-15');
  });

  it('remonte à la borne basse si trop tôt', () => {
    expect(clampDate('2023-12-01', '2024-01-01', '2024-12-31')).toBe('2024-01-01');
  });

  it('redescend à la borne haute si trop tard', () => {
    expect(clampDate('2025-03-01', '2024-01-01', '2024-12-31')).toBe('2024-12-31');
  });

  it('accepte les bornes exactes', () => {
    expect(clampDate('2024-01-01', '2024-01-01', '2024-12-31')).toBe('2024-01-01');
    expect(clampDate('2024-12-31', '2024-01-01', '2024-12-31')).toBe('2024-12-31');
  });
});

import type { Project } from '../types/index';
import { parseProjectJson } from './import';

export const SHARE_WARN_THRESHOLD = 6000;

function projectToBase64(project: Project): string {
  const json   = JSON.stringify(project);
  const bytes  = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary);
}

function base64ToProject(encoded: string): Project {
  let json: string;
  try {
    const binary = atob(encoded);
    const bytes  = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    json = new TextDecoder().decode(bytes);
  } catch {
    throw new Error('Lien invalide : données corrompues ou tronquées');
  }
  return parseProjectJson(json);
}

export interface ShareResult {
  url:       string;
  oversized: boolean; // true si le param data dépasse SHARE_WARN_THRESHOLD chars
}

export function buildShareUrl(project: Project): ShareResult {
  const encoded = projectToBase64(project);
  const base    = import.meta.env.BASE_URL; // '/skein/'
  const url     = `${window.location.origin}${base}share?data=${encodeURIComponent(encoded)}`;
  return { url, oversized: encoded.length > SHARE_WARN_THRESHOLD };
}

export function decodeShareParam(param: string): Project {
  return base64ToProject(param);
}

import { SmtRecord, SpRecord } from '../types';

/**
 * Normalizes a string by lowercasing, trimming, and replacing multiple spaces
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Extracts digits from a string (useful for NIP numeric comparison)
 */
export function extractDigits(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/\D/g, '');
}

/**
 * Cleans NIP string from quotes, decimal floats (e.g. 176137.0), and whitespace
 */
export function cleanNip(rawNip?: string | null): string {
  if (!rawNip) return '';
  return rawNip
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\.0+$/, '')
    .trim();
}

/**
 * Checks if an SMT record matches a search query.
 * Supports:
 * - Direct NIP matching (e.g. "176137", "119738")
 * - Formatted NIP matching (e.g. "176.137", "176-137", "176 137")
 * - Prefixed search queries (e.g. "nip 176137", "nip: 176137", "nip=176137")
 * - Partial NIP matching (e.g. "176" or "137")
 * - Name matching (e.g. "Rahmat", "Bagas Prayoga", "Nanda")
 * - Combined Name + NIP matching (e.g. "Rahmat 176137", "182109 Bagas")
 * - Zone name matching (e.g. "Living", "Sleeping", "Commercial", "ICF")
 * - Evaluation status keywords (e.g. "Best", "Safe", "Warning", "Pantauan")
 * - SP / Disciplinary tags (e.g. "SP", "SP1", "SP2")
 */
export function matchesSmtSearch(smt: SmtRecord, rawQuery: string): boolean {
  if (!rawQuery) return true;
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;

  const rawLower = trimmed.toLowerCase();

  // Strip prefixes like "nip:", "nip :", "nip ", "nip-", "id:", "nama:"
  const strippedQuery = rawLower
    .replace(/\b(nip|id|nama|name|zona|zone)\s*[:=\-]?\s*/gi, ' ')
    .trim();
  
  const effectiveQuery = strippedQuery.length > 0 ? strippedQuery : rawLower;

  const targetName = normalizeText(smt.nama);
  const targetNip = normalizeText(smt.nip);
  const targetNipDigits = extractDigits(smt.nip);
  const targetZone = normalizeText(smt.zone);
  const targetEval = normalizeText(smt.ytd.evaluationResult);
  const hasSp = smt.hasActiveSp ? 'sp surat peringatan sp1 sp2 sp3 aktif' : (smt.spList && smt.spList.length > 0 ? 'sp expired' : '');

  // 1. Direct whole-query inclusion check
  if (targetNip.includes(effectiveQuery)) return true;
  if (targetName.includes(effectiveQuery)) return true;
  if (targetZone.includes(effectiveQuery)) return true;
  if (targetEval.includes(effectiveQuery)) return true;

  // 2. Digits-only NIP match (if query contains numbers)
  const queryDigits = extractDigits(effectiveQuery);
  if (queryDigits.length >= 2 && targetNipDigits.includes(queryDigits)) {
    return true;
  }

  // 3. Multi-token match (all tokens must match at least one attribute)
  const tokens = effectiveQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  return tokens.every((token) => {
    const tokenDigits = extractDigits(token);

    const matchName = targetName.includes(token);
    const matchNip = targetNip.includes(token) || (tokenDigits.length >= 2 && targetNipDigits.includes(tokenDigits));
    const matchZone = targetZone.includes(token);
    const matchEval = targetEval.includes(token);
    const matchSp = hasSp.includes(token);

    return matchName || matchNip || matchZone || matchEval || matchSp;
  });
}

/**
 * Checks if an SP record matches a search query
 */
export function matchesSpSearch(sp: SpRecord, rawQuery: string): boolean {
  if (!rawQuery) return true;
  const trimmed = rawQuery.trim();
  if (!trimmed) return true;

  const rawLower = trimmed.toLowerCase();
  const strippedQuery = rawLower
    .replace(/\b(nip|id|nama|name|zona|zone)\s*[:=\-]?\s*/gi, ' ')
    .trim();
  
  const effectiveQuery = strippedQuery.length > 0 ? strippedQuery : rawLower;

  const targetName = normalizeText(sp.name);
  const targetNip = normalizeText(sp.nip);
  const targetNipDigits = extractDigits(sp.nip);
  const targetZone = normalizeText(sp.zone);
  const targetSpType = normalizeText(sp.spType);
  const targetStatus = normalizeText(sp.status);

  // 1. Direct whole-query check
  if (targetNip.includes(effectiveQuery)) return true;
  if (targetName.includes(effectiveQuery)) return true;
  if (targetZone.includes(effectiveQuery)) return true;
  if (targetSpType.includes(effectiveQuery)) return true;
  if (targetStatus.includes(effectiveQuery)) return true;

  // 2. Digits check
  const queryDigits = extractDigits(effectiveQuery);
  if (queryDigits.length >= 2 && targetNipDigits.includes(queryDigits)) {
    return true;
  }

  // 3. Tokens check
  const tokens = effectiveQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  return tokens.every((token) => {
    const tokenDigits = extractDigits(token);
    const matchName = targetName.includes(token);
    const matchNip = targetNip.includes(token) || (tokenDigits.length >= 2 && targetNipDigits.includes(tokenDigits));
    const matchZone = targetZone.includes(token);
    const matchSpType = targetSpType.includes(token);
    const matchStatus = targetStatus.includes(token);

    return matchName || matchNip || matchZone || matchSpType || matchStatus;
  });
}

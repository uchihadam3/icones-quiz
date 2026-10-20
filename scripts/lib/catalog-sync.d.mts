export interface CatalogRow { id: string; level: 1 | 2 | 3; category: string }
export interface ManifestEntry { status: string; file: string; [key: string]: unknown }
export function readCatalogRows(catalogDir: URL): CatalogRow[];
export function syncEntries(
  existing: Record<string, ManifestEntry>,
  ids: string[],
): { entries: Record<string, ManifestEntry>; added: string[]; orphans: string[] };
export function duplicates(ids: string[]): string[];
export function summaryOf(rows: CatalogRow[], entries: Record<string, ManifestEntry>): { total: number; ready: number; readyLevel1: number };

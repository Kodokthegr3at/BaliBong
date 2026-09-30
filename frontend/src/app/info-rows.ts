export interface InfoRow { label: string; value: string; }

/**
 * Splits the free-text restaurant info the admin panel stores
 * ("Senin-Minggu: 11:30 - 14:30. Tutup: Rabu.") into label/value rows.
 * A label ends at the first full-width colon, or a ':' not followed by a
 * digit (so "11:30" stays intact). Lines without one become a label-only row.
 */
export function toInfoRows(text: string, separator: RegExp): InfoRow[] {
  return (text || '')
    .split(separator)
    .map(s => s.trim().replace(/[.。]$/, ''))
    .filter(Boolean)
    .map(line => {
      const m = line.match(/^(.*?)\s*(?:：|:(?!\d))\s*(.*)$/);
      return m && m[1] ? { label: m[1], value: m[2] } : { label: line, value: '' };
    });
}

export const HOURS_SEPARATOR = /\n|。|\.(?:\s+|$)/;
export const CONTACT_SEPARATOR = /\n|\|/;

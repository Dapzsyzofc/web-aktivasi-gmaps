export function generateCSV(
  headers: string[],
  rows: Record<string, string | number | null | undefined>[]
): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map(row =>
    headers.map(h => escape(row[h])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

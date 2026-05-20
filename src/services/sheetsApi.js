import { SHEET_TAB } from '../config';

/**
 * Fetch sheet values (text content of all cells)
 */
export async function fetchSheetValues(sheetId, accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(SHEET_TAB)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Sheets API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch sheet metadata WITH grid data — but only hyperlinks + merges.
 * This is how we get URLs from rich-text hyperlinks (Insert → Link),
 * which are NOT returned by valueRenderOption=FORMULA.
 */
export async function fetchSheetMetadata(sheetId, accessToken) {
  const fields = 'sheets(merges,data.rowData.values(hyperlink,textFormatRuns))';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?ranges=${encodeURIComponent(SHEET_TAB)}&includeGridData=true&fields=${encodeURIComponent(fields)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Sheets API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch both values and metadata in parallel
 */
export async function fetchSheetData(sheetId, accessToken) {
  const [valuesRes, metadataRes] = await Promise.all([
    fetchSheetValues(sheetId, accessToken),
    fetchSheetMetadata(sheetId, accessToken),
  ]);
  return { values: valuesRes, metadata: metadataRes };
}

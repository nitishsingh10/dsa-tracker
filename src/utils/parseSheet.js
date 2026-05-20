/**
 * Parse sheet data: forward-fill merged cells, extract hyperlinks from grid data, build problem objects.
 */

/**
 * Slugify a problem name to create a stable ID
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a 2D map of hyperlinks from the grid data.
 * hyperlinks[row][col] = "url" (single link) or ["url1", "url2"] (rich text multi-link)
 * Checks both cell.hyperlink and cell.textFormatRuns[].format.link.uri
 */
function buildHyperlinkMap(metadataResponse) {
  const map = {};
  const sheet = metadataResponse.sheets?.[0];
  const rowData = sheet?.data?.[0]?.rowData || [];

  for (let r = 0; r < rowData.length; r++) {
    const row = rowData[r];
    if (!row?.values) continue;
    for (let c = 0; c < row.values.length; c++) {
      const cell = row.values[c];
      if (!cell) continue;

      // Check cell-level hyperlink first
      if (cell.hyperlink) {
        if (!map[r]) map[r] = {};
        map[r][c] = cell.hyperlink;
        continue;
      }

      // Check textFormatRuns for rich text links
      if (cell.textFormatRuns) {
        const links = [];
        for (const run of cell.textFormatRuns) {
          const uri = run?.format?.link?.uri;
          if (uri && !links.includes(uri)) links.push(uri);
        }
        if (links.length > 0) {
          if (!map[r]) map[r] = {};
          map[r][c] = links.length === 1 ? links[0] : links;
        }
      }
    }
  }
  return map;
}

/**
 * Forward-fill merged cell values in a 2D array.
 * Fills columns A (0) and B (1).
 */
export function forwardFillMerges(rows, merges) {
  if (!merges || merges.length === 0) return rows;
  const filled = rows.map(r => [...r]);

  for (const merge of merges) {
    const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = merge;
    if (startColumnIndex > 1) continue;

    for (let col = startColumnIndex; col < endColumnIndex && col <= 1; col++) {
      const sourceValue = filled[startRowIndex]?.[col];
      if (sourceValue === undefined || sourceValue === null) continue;
      for (let row = startRowIndex + 1; row < endRowIndex; row++) {
        if (row < filled.length) {
          while (filled[row].length <= col) filled[row].push('');
          filled[row][col] = sourceValue;
        }
      }
    }
  }
  return filled;
}

/**
 * Parse the type (classwork/homework) and difficulty from column F
 */
export function parseCategory(colF) {
  const val = String(colF || '');
  const type = val.toLowerCase().includes('homework') ? 'homework' : 'classwork';
  const diffMatch = val.match(/Easy|Medium|Hard/i);
  const difficulty = diffMatch
    ? diffMatch[0].charAt(0).toUpperCase() + diffMatch[0].slice(1).toLowerCase()
    : 'Unknown';
  return { type, difficulty };
}

/**
 * Clean class name — remove Duration line, trim whitespace/newlines
 */
function cleanClassName(raw) {
  if (!raw) return '';
  return raw
    .replace(/\n*[Dd]ura[tr]ion\s*:\s*\d+mins?\n*/gi, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Parse the full sheet data into problems + classNotes
 */
export function parseSheetData(valuesResponse, metadataResponse) {
  const rows = valuesResponse.values || [];
  if (rows.length <= 1) return { problems: [], classNotes: [] };

  const sheet = metadataResponse.sheets?.[0];
  const merges = sheet?.merges || [];

  // Build hyperlink map from grid data
  const hyperlinks = buildHyperlinkMap(metadataResponse);

  // Helper: get first link from a hyperlink value (could be string or array)
  const getLink = (val) => {
    if (!val) return '';
    if (Array.isArray(val)) return val[0] || '';
    return val;
  };

  // Forward-fill merged cells
  const filledRows = forwardFillMerges(rows, merges);

  const str = (val) => String(val ?? '').trim();

  // --- Extract class notes from column H only (25B1 Notes) ---
  const classNotes = [];
  const seenNoteLinks = new Set();

  // Check if the header (row 0) has the notes link — pick first one (25B1)
  const headerLink = getLink(hyperlinks[0]?.[7]);
  if (headerLink) {
    classNotes.push({
      label: '25B1 Notes Drive',
      link: headerLink,
      className: '_all_',
    });
    seenNoteLinks.add(headerLink);
  }

  // Also check data rows for per-class notes
  for (let i = 1; i < filledRows.length; i++) {
    const link = getLink(hyperlinks[i]?.[7]);
    if (link && !seenNoteLinks.has(link)) {
      seenNoteLinks.add(link);
      const rawClass = cleanClassName(str(filledRows[i]?.[1]));
      classNotes.push({
        label: str(filledRows[i]?.[7]) || 'Notes',
        link,
        className: rawClass,
      });
    }
  }

  // --- Build problems ---
  const problems = [];
  const idCounts = new Map(); // track duplicate slugs
  for (let i = 1; i < filledRows.length; i++) {
    const row = filledRows[i];
    const problemName = str(row[3]); // Column D
    if (!problemName) continue;

    const { type, difficulty } = parseCategory(row[5]);
    const link = getLink(hyperlinks[i]?.[4]);

    let id = slugify(problemName);
    // Deduplicate IDs
    const count = idCounts.get(id) || 0;
    idCounts.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;

    problems.push({
      id,
      problemName,
      classDate: str(row[0]),
      className: cleanClassName(str(row[1])),
      contentCovered: str(row[2]),
      link,
      type,
      difficulty,
      platform: str(row[6]),
      status: 'todo',
      starred: false,
      notes: '',
    });
  }


  return { problems, classNotes };
}

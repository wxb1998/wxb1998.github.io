import bibtexParse from '@orcid/bibtex-parse-js';

/** Fields this site uses for display only; they are left out of the "Cite" BibTeX. */
const SITE_FIELDS = new Set(['selected', 'abbr', 'pmid', 'pdf', 'code', 'preprint', 'note', 'abstract']);

const ACCENTS: Record<string, string> = {
  '"': '̈', "'": '́', '`': '̀', '^': '̂', '~': '̃',
  '=': '̄', '.': '̇', u: '̆', v: '̌', H: '̋', c: '̧',
};

const SYMBOLS: Record<string, string> = {
  ss: 'ß', o: 'ø', O: 'Ø', ae: 'æ', AE: 'Æ', oe: 'œ', OE: 'Œ', aa: 'å', AA: 'Å', l: 'ł', L: 'Ł', i: 'ı',
};

/** Turn common LaTeX markup in BibTeX values into plain Unicode text. */
export function latexToText(value: string): string {
  return value
    .replace(/\\(["'`^~=.]|[uvHc](?![a-zA-Z]))\s*\{?\s*\\?([a-zA-Z])\s*\}?/g, (m, cmd: string, ch: string) =>
      ACCENTS[cmd] ? ch + ACCENTS[cmd] : m,
    )
    .replace(/\\(ss|ae|AE|oe|OE|aa|AA|o|O|l|L|i)(?![a-zA-Z])\s?/g, (_, s: string) => SYMBOLS[s])
    .replace(/\\(?:textit|textbf|emph|textrm|textsf|texttt|mathrm)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/~/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC');
}

/** "Last, First" → "First Last"; keeps equal-contribution markers (* † #) at the end of the name. */
function formatAuthor(raw: string): string {
  const name = latexToText(raw);
  const markers = (name.match(/[*†#]+/g) ?? []).join('');
  const clean = name.replace(/[*†#]+/g, '').trim();
  if (clean.toLowerCase() === 'others') return 'et al.';
  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
  const full = parts.length >= 2 ? `${parts.slice(1).join(' ')} ${parts[0]}` : clean;
  return full + markers;
}

function toBibtexString(type: string, key: string, tags: Record<string, string>): string {
  const fields = Object.entries(tags)
    .filter(([k]) => !SITE_FIELDS.has(k))
    .map(([k, v]) => `  ${k} = {${k === 'author' ? v.replace(/\*/g, '') : v}}`);
  return `@${type}{${key},\n${fields.join(',\n')}\n}`;
}

/** Parser for Astro's file() loader: BibTeX text → one entry per publication, in file order. */
export function parseBibtex(text: string) {
  return bibtexParse.toJSON(text).map((entry, index) => {
    const tags = Object.fromEntries(
      Object.entries(entry.entryTags).map(([k, v]) => [k.toLowerCase(), String(v).trim()]),
    );
    const doi = tags.doi?.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    return {
      id: entry.citationKey,
      index,
      type: entry.entryType.toLowerCase(),
      title: latexToText(tags.title ?? ''),
      authors: (tags.author ?? '').split(/\s+and\s+/i).filter(Boolean).map(formatAuthor),
      year: tags.year,
      venue: latexToText(tags.journal ?? tags.booktitle ?? tags.howpublished ?? tags.publisher ?? tags.school ?? ''),
      doi,
      url: tags.url || (doi ? `https://doi.org/${doi}` : undefined),
      pdf: tags.pdf,
      code: tags.code,
      pmid: tags.pmid,
      preprint: tags.preprint,
      abbr: tags.abbr ? latexToText(tags.abbr) : undefined,
      note: tags.note ? latexToText(tags.note) : undefined,
      abstract: tags.abstract ? latexToText(tags.abstract) : undefined,
      selected: /^(true|yes|1)$/i.test(tags.selected ?? ''),
      bibtex: toBibtexString(entry.entryType.toLowerCase(), entry.citationKey, tags),
    };
  });
}

declare module '@orcid/bibtex-parse-js' {
  interface BibtexEntry {
    citationKey: string;
    entryType: string;
    entryTags: Record<string, string>;
  }
  const bibtexParse: { toJSON(input: string): BibtexEntry[] };
  export default bibtexParse;
}

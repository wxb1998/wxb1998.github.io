export type LinkKey = 'email' | 'github' | 'scholar' | 'orcid' | 'linkedin' | 'x' | 'cv';

const LABELS: Record<LinkKey, string> = {
  email: 'Email',
  github: 'GitHub',
  scholar: 'Google Scholar',
  orcid: 'ORCID',
  linkedin: 'LinkedIn',
  x: 'X',
  cv: 'Resume',
};

export interface ProfileLink {
  key: LinkKey;
  label: string;
  href: string;
}

/** Profile links in display order, skipping empty ones. Email becomes a mailto: link. */
export function profileLinks(links: Partial<Record<LinkKey, string | undefined>>): ProfileLink[] {
  return (Object.keys(LABELS) as LinkKey[])
    .filter((key) => links[key])
    .map((key) => ({
      key,
      label: LABELS[key],
      href: key === 'email' ? `mailto:${links[key]}` : links[key]!,
    }));
}

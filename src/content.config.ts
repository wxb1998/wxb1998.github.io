// Schemas for everything in content/. If a content file has a typo or a missing field,
// the build stops with a message naming the file and field, so a broken page never goes live.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';
import { parseBibtex } from './lib/bibtex';

export const SECTION_IDS = [
  'about',
  'projects',
  'experience',
  'skills',
  'publications',
  'news',
  'education',
  'contact',
] as const;

/** A YAML file holding one object → a single entry with id "main". */
const singleYaml = (text: string) => ({ main: parseYaml(text) ?? {} });

/** A YAML file holding a list → one entry per item, ids are list positions. */
const listYaml = (text: string) =>
  ((parseYaml(text) ?? []) as Record<string, unknown>[]).map((item, i) => ({ ...item, id: String(i) }));

// Text fields also accept YAML numbers (e.g. start: 2025), but a missing field is still an error.
const stringish = z
  .union([z.string(), z.number()], {
    error: (issue) => (issue.input === undefined ? 'Missing required field' : 'Expected text'),
  })
  .transform((v) => String(v).trim());
const text = stringish.pipe(z.string().min(1, 'This field cannot be empty'));
const optionalText = stringish.optional();
const link = z.string().trim().optional();
const yearMonth = stringish.pipe(
  z.string().regex(/^\d{4}(-\d{2}){0,2}$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD in quotes, e.g. "2026-10"'),
);

const site = defineCollection({
  loader: file('content/site.yaml', { parser: singleYaml }),
  schema: z.object({
    description: optionalText,
    sections: z.array(z.enum(SECTION_IDS)).default([...SECTION_IDS]),
    highlight_authors: z.array(z.string()).default([]),
    hero: z
      .object({ clusters: z.array(z.string()).min(1).default(['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']) })
      .prefault({}),
  }),
});

const profile = defineCollection({
  loader: file('content/profile.yaml', { parser: singleYaml }),
  schema: z.object({
    name: text,
    role: text,
    affiliation: text,
    tagline: text,
    status: optionalText,
    avatar: link,
    interests: z.array(z.string()).default([]),
    highlights: z
      .array(z.object({ value: z.number(), suffix: z.string().optional(), label: text }))
      .default([]),
    links: z
      .object({
        email: link,
        github: link,
        scholar: link,
        orcid: link,
        linkedin: link,
        x: link,
        cv: link,
      })
      .prefault({}),
    contact: z.object({ heading: text, text: text }).optional(),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './content' }),
  schema: z.object({}),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/projects' }),
  schema: z.object({
    title: text,
    summary: text,
    order: z.number().default(100),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    pipeline: z.array(z.string()).default([]),
    metrics: z.array(z.object({ value: text, label: text })).default([]),
    links: z.object({ code: link, paper: link, demo: link }).prefault({}),
  }),
});

const publications = defineCollection({
  loader: file('content/publications.bib', { parser: parseBibtex }),
  schema: z.object({
    index: z.number(),
    type: z.string(),
    title: text,
    authors: z.array(z.string()).min(1, 'Every publication needs an author field'),
    year: z.coerce.number().int(),
    venue: z.string(),
    doi: z.string().optional(),
    url: z.string().optional(),
    pdf: z.string().optional(),
    code: z.string().optional(),
    abbr: z.string().optional(),
    note: z.string().optional(),
    abstract: z.string().optional(),
    selected: z.boolean(),
    bibtex: z.string(),
  }),
});

const news = defineCollection({
  loader: file('content/news.yaml', { parser: listYaml }),
  schema: z.object({ date: yearMonth, text }),
});

const experience = defineCollection({
  loader: file('content/experience.yaml', { parser: listYaml }),
  schema: z.object({
    role: text,
    org: text,
    start: text,
    end: optionalText,
    location: optionalText,
    points: z.array(text).default([]),
  }),
});

const education = defineCollection({
  loader: file('content/education.yaml', { parser: listYaml }),
  schema: z.object({ degree: text, school: text, start: text, end: optionalText, detail: optionalText }),
});

const skills = defineCollection({
  loader: file('content/skills.yaml', { parser: listYaml }),
  schema: z.object({ group: text, items: z.array(text).min(1) }),
});

export const collections = { site, profile, about, projects, publications, news, experience, education, skills };

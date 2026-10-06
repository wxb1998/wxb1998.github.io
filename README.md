# wxb1998.github.io

Personal homepage, built with [Astro](https://astro.build) and published to https://wxb1998.github.io by GitHub Actions.

## Updating the site

All content lives in the `content/` folder. Edit a file (on github.com or locally), commit to `main`,
and the site rebuilds and goes live in about a minute.

| To change…                                      | Edit                                         |
| ----------------------------------------------- | -------------------------------------------- |
| Name, title, tagline, status line, photo, links | `content/profile.yaml`                       |
| About text                                      | `content/about.md`                           |
| Projects (one file per project)                 | `content/projects/*.md`                      |
| Experience                                      | `content/experience.yaml`                    |
| Skills                                          | `content/skills.yaml`                        |
| Publications                                    | `content/publications.bib` (BibTeX)          |
| News                                            | `content/news.yaml`                          |
| Education                                       | `content/education.yaml`                     |
| Section order, hiding sections, SEO text        | `content/site.yaml`                          |
| Resume PDF, photos, paper PDFs                  | put files in `public/`, link as `/file.pdf`  |

Each file has comments at the top explaining its fields.

- **Add a project:** copy a file in `content/projects/`, rename it and edit it. `order` sets its position.
- **Add a publication:** paste its BibTeX (e.g. Google Scholar → Cite → BibTeX) into `publications.bib`.
- **Hide a section:** delete its line under `sections` in `site.yaml`. Empty sections hide themselves.

### Safety net

Every build checks all content files first. If something is wrong (a missing field, or a date
written as `2026.10` instead of `"2026-10"`), the build stops with a message naming the file and
field, and the live site keeps showing the last good version. The message is in the **Actions** tab.

## Running locally

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev      # live preview at http://localhost:4321
npm run build    # check content, then build to dist/
```

## Project structure

```
content/              ← everything you edit
public/               ← files served as-is (favicon, resume PDF, images)
src/
  content.config.ts   ← schemas that validate content/
  pages/index.astro   ← assembles the page from sections
  components/         ← one component per section (Hero, About, Projects, …)
  scripts/            ← hero point-cloud animation and page effects
  styles/global.css   ← colors, fonts and shared styles (design tokens at the top)
.github/workflows/    ← build and deploy to GitHub Pages
```

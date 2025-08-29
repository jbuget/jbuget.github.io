# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
# Start local development server
hugo serve -D

# Build site for production
hugo --gc --minify

# Build with search indexing (local equivalent to Netlify)
hugo --gc --minify && npx -y pagefind --site public
hugo serve -D
```

### Content Search Indexing
The site uses [Pagefind](https://pagefind.app/) for content search. Indexing is automatic on Netlify via:
```bash
hugo --gc --minify && npx pagefind --site 'public'
```

## Architecture Overview

This is a personal blog/portfolio site built with [Hugo](https://gohugo.io/) static site generator.

### Key Components
- **Hugo version**: 0.148.2 (specified in netlify.toml)
- **Theme**: Custom theme called "Bloodywood" (located in `themes/bloodywood/`)
- **Search**: Pagefind for client-side search functionality
- **Hosting**: Netlify with automatic deployments
- **Content**: French blog posts about software development and personal resume system

### Directory Structure
```
├── content/           # Site content (Markdown files)
│   ├── posts/        # Blog posts (French)
│   └── resume/       # Resume pages by type and language
├── data/
│   └── resumes.yaml  # Resume configuration
├── assets/
│   └── resumes/      # JSON Resume files
├── themes/bloodywood/ # Custom Hugo theme
├── static/           # Static assets (icons, fonts)
├── config.toml       # Hugo configuration
└── netlify.toml      # Netlify build configuration
```

## Resume System

The site includes a sophisticated multilingual resume system:

### Resume Types
- `manager`: CTO/Engineering Manager focused
- `developer`: Senior/Staff engineer focused

### Adding New Resume Types
1. Create JSON files in `assets/resumes/`:
   - `resume.{type}.fr.json` (French version)
   - `resume.{type}.en.json` (English version)
2. Create content pages in `content/resume/{type}/`:
   - `fr.md` with layout: "resume" and resume_file reference
   - `en.md` with layout: "resume" and resume_file reference
3. Add entry to `data/resumes.yaml` with type, title, and language variants

### JSON Resume Format
Follows the [JSON Resume Schema](https://jsonresume.org/schema/) standard.

## Blog Content

### Post Structure
- All posts in French under `content/posts/`
- Each post in its own directory with `index.md` and associated images
- Topics focus on software development, DevOps, and technical tutorials

### Content Categories
- Hugo/Static site development
- Docker and containerization
- Git workflows and best practices
- Self-hosted services and infrastructure
- Database and search technologies
- JavaScript and web development

## Theme: Bloodywood

Custom Hugo theme with features:
- Dark/light theme switching
- Responsive design
- FontAwesome integration
- Custom SCSS styling
- Pagefind search integration
- Resume rendering from JSON Resume format

### Theme Assets
- SCSS files in `themes/bloodywood/assets/css/`
- JavaScript in `themes/bloodywood/assets/js/`
- Layouts in `themes/bloodywood/layouts/`
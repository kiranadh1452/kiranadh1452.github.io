# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Static personal portfolio website for Kiran Adhikari, hosted on GitHub Pages at kiranadh.com. No build system, bundler, or package manager — just raw HTML/CSS served directly.

## Architecture

- `/index.html` — Main portfolio/resume page (personal/academic version)
- `/pro/index.html` — Professional version with linked employer names and slight wording differences
- `/CV_kiran-adhikari.pdf` — Downloadable CV
- `/CNAME` — Custom domain config for GitHub Pages (kiranadh.com)

Both HTML files were generated from LibreOffice (ODF-to-XHTML export) and share the same structure: inline CSS styles, table-based layout with CSS classes like `.P1`–`.P42`, `.T1`–`.T7`, `.fr1`. They are XHTML 1.1 documents, not standard HTML5.

## Development

No build or test commands. To preview locally, open either `index.html` in a browser or use any static server (e.g., `python3 -m http.server`).

Deployment is automatic via GitHub Pages on push to `main`.

## Key considerations

- The two HTML files are nearly identical — changes to content/styling usually need to be applied to both `/index.html` and `/pro/index.html`
- The files use XHTML strict syntax (self-closing tags, XML namespace) — maintain this format
- All CSS is inline in `<style>` blocks within each file, not in external stylesheets
- Class names are auto-generated from LibreOffice export (`.P1`, `.T2`, etc.) — not semantic

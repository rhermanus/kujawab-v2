# Problemset Entry Guide

## Workflow Overview

1. User provides a PDF or image of a problem set
2. Read the source material and identify: name, category, problem count, any clustered problems (shared descriptions)
3. Create the problemset via API
4. Update metadata (code, category) via API
5. Prepare all problems as HTML, then submit via batch API
6. Add extra descriptions for clustered problems if needed
7. Verify on the Problem Factory page

## API Reference

Base URL: `http://localhost:3000/api/problemfactory` (dev) or production URL
Auth: `Authorization: Bearer <PROBLEMFACTORY_API_KEY>`

### Create a problemset
```json
POST { "action": "create_set", "name": "Olimpiade Sains Kota (OSK) 2020 - Komputer", "problemCount": 40, "category": "KOMPUTER" }
→ { "id": 200 }
```

### Update metadata
```json
POST { "action": "update_set", "id": 200, "code": "OSKKOM20", "category": "KOMPUTER" }
```

### Batch save problems (preferred)
```json
POST {
  "action": "save_problems_batch",
  "problemSetId": 200,
  "problems": [
    { "number": 1, "description": "<p>Problem text...</p>\n<ol style=\"list-style-type:lower-alpha;\">\n<li>Option A</li>\n<li>Option B</li>\n</ol>" },
    { "number": 2, "description": "..." }
  ]
}
→ { "success": true, "results": [{ "number": 1, "id": 2907, "created": true }, ...] }
```

### Save single problem
```json
POST { "action": "save_problem", "problemSetId": 200, "number": 1, "description": "<p>...</p>" }
```

### Save extra description (clustered problems)
```json
POST { "action": "save_extra_description", "problemSetId": 200, "startNumber": 9, "endNumber": 12, "description": "<p>Shared passage for problems 9-12...</p>" }
```

### Delete extra description
```json
POST { "action": "delete_extra_description", "id": 238 }
```

### Get problemset (verify)
```
GET /api/problemfactory?id=200
```

## HTML Format Conventions

### Multiple choice (most common)
```html
<p>Question text here.</p>

<ol style="list-style-type:lower-alpha;">
  <li>Option A</li>
  <li>Option B</li>
  <li>Option C</li>
  <li>Option D</li>
  <li>Option E</li>
</ol>
```

### Images
```html
<p>Perhatikan gambar berikut.</p>
<img src="/r2/images/problems/filename.png"/>
<p>Rest of the question...</p>
```
- Upload images to R2 first via `POST /api/upload` (multipart form-data with `file` field)
- Use the returned URL path with `/r2/` prefix in the `src` attribute

### LaTeX / Math (via KaTeX)
Use `<span class="math-tex" data-latex="...">` for inline math:
```html
<p>Jika <span class="math-tex" data-latex="x^2 + y^2 = 25">x² + y² = 25</span>, maka...</p>
```
- The `data-latex` attribute contains the KaTeX expression
- The inner text is a plain-text fallback
- HtmlContent component auto-renders these via KaTeX

### Code blocks
```html
<pre><code>function example() {
  return 42;
}</code></pre>
```

### Tables
```html
<table border="1">
  <tr><th>Header</th><th>Header</th></tr>
  <tr><td>Cell</td><td>Cell</td></tr>
</table>
```

### Nested lists
```html
<ul>
  <li>Item with sub-list:
    <ul style="list-style-type:circle;">
      <li>Sub-item</li>
    </ul>
  </li>
</ul>
```

### Numbered list starting at specific number
```html
<ol>
  <li value="5">This starts at 5</li>
</ol>
```

## Category Values
Valid enum values: `KOMPUTER`, `MATEMATIKA`, `FISIKA`, `KIMIA`, `BIOLOGI`, `ASTRONOMI`, `KEBUMIAN`, `EKONOMI`, `GEOGRAFI`

## URL Code Convention
- Uppercase, alphanumeric + dash only, max 15 chars
- Pattern: `{EXAM}{SUBJECT}{YEAR_2DIGIT}` e.g. `OSKKOM20`, `OSNMAT25`, `KSNKFIS21`
- Exam prefixes: OSK (Olimpiade Sains Kota), OSP (Provinsi), OSN (Nasional), KSNK (KSN Kota), KSNP (KSN Provinsi), KSN (KSN Nasional)
- Subject codes: KOM (Komputer), MAT (Matematika), FIS (Fisika), KIM (Kimia), BIO (Biologi), AST (Astronomi), KEB (Kebumian), EKO (Ekonomi), GEO (Geografi)

## Clustered Problems (Extra Descriptions)
Some problems share a common passage/description (e.g., "Use the following text to answer problems 9-12"). These are stored as `ExtraDescription` records.

- The extra description is displayed before the first problem in the range
- Answers are attached to the **first** problem number in the cluster
- When entering problems in a cluster, each problem should contain only its own question text (not the shared description)

## Tips
- Batch submit all problems at once when possible — saves many API calls
- For problems with images: upload all images first, collect URLs, then compose HTML
- Double-check answer options match the source exactly (especially mathematical notation)
- Use `&amp;` for `&`, `&lt;` for `<`, `&gt;` for `>` in HTML text content
- Use `&pi;` for π, `&times;` for ×, `&divide;` for ÷ in simple cases
- For complex math, always use the `<span class="math-tex">` approach

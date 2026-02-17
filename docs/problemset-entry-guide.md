# Problemset Entry Guide

## Workflow Overview

1. User provides a PDF or image of a problem set
2. Read the source material and identify: name, category, problem count, any clustered problems (shared descriptions)
3. Create the problemset via API (or reuse existing draft)
4. Update metadata (code, category) via API
5. Extract diagram images from PDF, upload to R2
6. Write a Node.js `.mjs` script with all problems as HTML, batch submit via API
7. Add extra descriptions for clustered problems if needed
8. Verify on the Problem Factory page

## API Reference

- **Dev**: `http://localhost:3000/api/problemfactory`
- **Production**: `https://www.kujawab.com/api/problemfactory`
  - IMPORTANT: Use `www.kujawab.com`, not `kujawab.com` — the non-www redirects with 307 and strips the Authorization header
- **Auth**: `Authorization: Bearer <PROBLEMFACTORY_API_KEY>`

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
- Submit in batches of ~10 problems per request to avoid size limits
- Upserts: existing problems are updated, new ones are created

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

## Image Handling

### Extracting images from PDFs
```bash
# 1. Convert PDF pages to PNGs
pdftoppm -png -r 200 source.pdf /tmp/page

# 2. Crop diagram regions (adjust coordinates per image)
magick /tmp/page-05.png -crop 1500x420+100+560 +repage /tmp/diagram.png
```

### Uploading images to R2
The `/api/upload` endpoint uses session auth (not API key), so for automation, upload directly via S3 SDK:

```js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const body = fs.readFileSync('/tmp/diagram.png');
await client.send(new PutObjectCommand({
  Bucket: 'kujawab-uploads',
  Key: 'images/problems/diagram.png',
  Body: body,
  ContentType: 'image/png',
}));
// Reference in HTML as: <img src="/r2/images/problems/diagram.png"/>
```

### Image naming convention
Use `{code}-p{number}[-desc].png`, e.g.:
- `ksnk21-p11-tiles.png` — problem 11 tile shapes
- `ksnk21-p14-tree.png` — problem 14 tree diagram

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

### Fill-in / short answer (isian)
```html
<p>Question text here. [Jawablah dengan angka saja!]</p>
```
No answer options — just the question text with the instruction to answer with a number.

### Images
```html
<p>Perhatikan gambar berikut.</p>
<img src="/r2/images/problems/filename.png"/>
<p>Rest of the question...</p>
```

### LaTeX / Math (via KaTeX)
Use `<span class="math-tex" data-latex="...">` for inline math:
```html
<p>Jika <span class="math-tex" data-latex="x^2 + y^2 = 25">x² + y² = 25</span>, maka...</p>
```
- The `data-latex` attribute contains the KaTeX expression
- The inner text is a plain-text fallback
- HtmlContent component auto-renders these via KaTeX
- For simple fractions, prefer HTML entities: `&frac12;` (½), `&frac13;` (⅓), `&frac14;` (¼), `&frac23;` (⅔), `&frac34;` (¾), `&frac15;` (⅕), `&frac35;` (⅗)
- For superscripts: `<sup>2</sup>` for simple cases, `<span class="math-tex">` for complex ones

### Code blocks
```html
<pre><code>int main() {
    if (x &lt; 10) {
        return x &gt; 0;
    }
}</code></pre>
```
- IMPORTANT: Escape `<` as `&lt;` and `>` as `&gt;` inside `<code>` blocks
- Use `&amp;` for `&` (e.g., `&amp;&amp;` for `&&`)
- Keep original indentation (spaces, not tabs)

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

## Submission Script Template

Write problems as a Node.js `.mjs` file to avoid shell escaping issues:

```js
// submit.mjs
const API_KEY = process.env.PROBLEMFACTORY_API_KEY;
const PROD = "https://www.kujawab.com/api/problemfactory";
const SET_ID = 200;

const problems = [
  { number: 1, description: `<p>...</p>` },
  { number: 2, description: `<p>...</p>` },
  // ... all problems
];

async function main() {
  for (let i = 0; i < problems.length; i += 10) {
    const batch = problems.slice(i, i + 10);
    const res = await fetch(PROD, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "save_problems_batch",
        problemSetId: SET_ID,
        problems: batch,
      }),
    });
    const data = await res.json();
    const created = data.results.filter(r => r.created).length;
    const updated = data.results.filter(r => !r.created && !r.error).length;
    console.log(`Batch ${i/10+1}: ${created} created, ${updated} updated`);
  }
  // Verify
  const res = await fetch(`${PROD}?id=${SET_ID}`, {
    headers: { "Authorization": `Bearer ${API_KEY}` },
  });
  const set = await res.json();
  console.log(`Done: ${set.problems.length}/${set.problemCount} problems`);
}
main();
```

Run with: `node submit.mjs`

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
- **Use a .mjs script** — avoids shell escaping issues with large HTML payloads; use template literals for descriptions
- **Batch in groups of 10** — submit problems 10 at a time for reliability
- **Crop diagram images tightly** — only include the figure, not surrounding text (the text goes in the HTML description)
- **Check for existing drafts** — use `GET ?id=N` to check if a problemset already has problems before re-submitting
- **HTML entity escaping** — `&amp;` for `&`, `&lt;` for `<`, `&gt;` for `>` in text and code blocks
- **Fraction entities** — `&frac12;`, `&frac14;`, `&frac34;`, etc. for simple fractions
- **Code blocks** — always escape angle brackets; preserve original indentation
- **Double-check answer options** — match the source exactly, especially mathematical notation
- **Image naming** — use `{examcode}-p{number}[-desc].png` for consistency

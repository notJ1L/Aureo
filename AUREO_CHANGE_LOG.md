# Aureo Change Log

**Date:** 2026-10-22
**Scope:** Progress audit against the five project MD files, plus the revisions that followed.
**Reference documents:** `AUREO_BUILD_PLAN.md`, `PROJECT_REQUIREMENTS.md`, `AUREO_PROJECT_SPEC.md`,
`PROJECT_ARCHITECTURE_REFERENCE.md`, `AUREO_SETUP_GUIDE.md`

Every entry below states **what changed** and **why the change was necessary**. Where a command was
run, the reason for running it is stated as well.

---

## 0. Important context

### 0.1 A second agent was working in this repository at the same time

While the audit was running, a separate AI agent (Codex) was actively writing files in the same
working tree. It implemented build plan Phases 7 through 10 (appraisals, services and tickets,
admin dashboard, rule-based AI chat) and Phase 13 (`render.yaml`, `README.md`), and it rewrote
shared files such as `backend/app.js`, `frontend/src/App.jsx`, `frontend/src/App.css`,
`frontend/src/redux/store.js`, and `frontend/src/pages/ProfilePage.jsx`.

**Why this matters for the change log:**

- Some files listed below were touched by both agents. Where that happened, the merge was verified
  line by line and both sets of changes are present and coherent.
- To avoid clobbering another writer, new functionality was placed in **new files** wherever
  possible, and edits to shared files were made with exact-match replacements. An exact-match
  replacement fails safely if the file changed underneath, instead of overwriting it.
- The MD files were never touched by the other agent, so all five were revised freely.

### 0.2 Nothing was committed

No commit was created. The working tree holds both sets of work. Section 8 lists what has to be
staged before the next push.

---

## 1. Documentation changes

The five MD files are the source of truth for this project. At the start of the work they described
an intention, not the implementation: the build plan had no status tracking at all, the requirements
file was a bare list of marks with no link to code, and the architecture reference described a
cookie-based login and a Redux store that no longer existed.

### 1.1 `AUREO_BUILD_PLAN.md`

**Changed**

- Added an **Implementation Status** section after the course alignment table. It lists all fourteen
  phases with a status, concrete evidence (file paths and behaviours), and the specific remaining
  gaps for anything not finished.
- Added an **Assessment coverage** table under that section, mapping MP1 through Term Test LEC to
  their status, so the plan shows the grading impact of a phase and not only the technical one.
- Added a **Recorded deviations** table under **Key Decisions**, recording seven places where the
  implementation deliberately departs from the literal wording of `AUREO_PROJECT_SPEC.md`.
- Rewrote the closing paragraph of **First Implementation Target**, which still claimed Phases 0 and
  1 were the next work.

**Why necessary**

The build plan is named as the primary reference and states that "the project specification is the
source of truth for requirements". A plan that cannot say what is finished gives no way to verify
progress, and it silently diverges from the code. The deviations table matters most: without it,
every reader would re-derive that `POST /verify-email` does not match the specification's
`GET /verify-email/:token`, and would reasonably conclude that something was wrong. Recording them
turns silent divergence into a documented decision.

### 1.2 `PROJECT_REQUIREMENTS.md`

**Changed**

- Added an **Implementation Coverage** matrix. Every assessment item in the professor's list is now
  a row with its points, a status, and the exact file that satisfies it.
- Added a **Remaining risks** section listing the three things that can still cost marks.

**Why necessary**

This file is the grading sheet. Its original content is a list of marks with no traceability, so
nobody can tell which items are safe. The matrix turns it into a checklist that can be walked
through in a demo, and it makes the honest gaps visible instead of buried: the frontend has no test
script, and the Render deployment has not been run. Writing down the gaps protects against
claiming a mark that a reviewer then cannot find.

### 1.3 `AUREO_SETUP_GUIDE.md`

**Changed**

- Extended the environment file template with `SMTP_*`, `EMAIL_FROM`,
  `VERIFICATION_CODE_EXPIRE_MINUTES`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, which
  exist in `backend/config/.env.example` but were missing from the guide.
- Replaced the three-route list with the complete route map: twenty frontend routes split into
  public, signed-in, and admin groups.
- Rewrote the seed section to state that the script is idempotent and to document
  `npm run clear:users`.
- Added a **Full Feature Test Flow** section covering appraisals, tickets, the dashboard date
  filter, and the chat memory.
- Added a **Backend Tests** section with the expected output and an explanation of the separate
  `_test` database.
- Rewrote the Render section around the new `render.yaml` blueprint, including the warning that
  `VITE_API_URL` is read at build time.
- Replaced the old "documentation files may be ignored by Git" note with a real list plus a
  `git check-ignore` command to verify them.
- Added a **Repository Hygiene** section.

**Why necessary**

The guide is titled "explains how to run Aureo on another computer", and it is the document a
marker or a teammate will follow. It was wrong in ways that would have broken a fresh setup: the
environment template was incomplete, and the route list stopped at three routes while the app has
twenty. The repository hygiene section was added because the untracked-file problem in Section 8 is
the single most likely way for a clean clone to fail.

### 1.4 `PROJECT_ARCHITECTURE_REFERENCE.md`

**Changed**

- Rewrote section 3.1 **Current Implementation Snapshot**. It claimed the Redux store held "product,
  authentication, user, forgot-password, and new-product state" and that "several cart and order
  reducers remain commented out", and it described the flow as "React component -> Supabase or
  Firebase identity -> Aureo JWT". All of that was out of date.
- Rewrote section 5.6 **Redux State and Actions**, which stated that "login, logout, and protected
  user requests send cookies with `withCredentials: true`".
- Replaced the backend folder tree in section 4 and the frontend folder tree in section 5 with the
  trees that actually exist.
- Replaced the endpoint list in section 8 with the full list of fifty-one live routes.
- Corrected the product image flow paragraph.

**Why necessary**

This document is the layering reference that the specification points at ("follow the course
reference"). Two of its statements were actively dangerous: it told a reader that authentication
uses cookies when the implementation uses a Bearer header, and it listed routes that do not exist
while omitting twenty-nine that do. A reference that contradicts the code is worse than no
reference, because it is trusted.

### 1.5 `AUREO_PROJECT_SPEC.md`

**Changed**

- Added a **Status** column to the REST API table, and a **Recorded deviations** subsection that
  points back to the build plan.
- Marked the three admin user endpoints (`/admin/users`, `/admin/user/:id`, `/admin/mock-emails`)
  as not built, rather than leaving them to look implemented.
- Updated the frontend folder structure in section 4.1.

**Why necessary**

The specification is stated to be "the single source of truth for what we are building". Leaving
three endpoints unmarked in its API table would have implied they exist. Marking them keeps the
specification truthful, and the deviations subsection stops a reader from treating a deliberate
difference as a defect.

---

## 2. New files

Eleven files were created. They were placed in new paths rather than being merged into existing
files specifically to avoid collisions with the concurrent agent.

### 2.1 `frontend/src/utils/validationSchemas.js` (139 lines)

Seven Yup schemas: `loginSchema`, `registerSchema`, `verifyCodeSchema`, `profileSchema`,
`productSchema`, `reviewSchema`, `checkoutSchema`.

**Why necessary**

Unit 1 of `PROJECT_REQUIREMENTS.md` awards ten points for "form validation on product and user
forms (product crud, user login, update profile) YUP formik React Hook Form". `react-hook-form`,
`@hookform/resolvers`, and `yup` were all already in `frontend/package.json`, but a search of
`frontend/src` found **zero** imports of any of them. The dependency alone earns nothing. Every
rule mirrors the corresponding Mongoose model so the browser rejects exactly what the API rejects,
which is what section 10 of the specification demands: "Validate on the backend even if the frontend
validates."

### 2.2 `frontend/src/components/ui/index.jsx` (248 lines)

A shared kit wrapping React Bootstrap (`Table`, `Modal`, `Pagination`, `Button`, `Badge`, `Alert`,
`Spinner`, `Form`, `ProgressBar`) and Material UI (`Card`, `CardContent`, `Chip`, `TextField`,
`Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Rating`, `Stack`, `Button`).

**Why necessary**

Unit 2 awards fifteen points for "user interface design css and bootstrap components" and twenty
points for "user interface design css and Material UI (MUI) or similar library components". Both
`bootstrap` and `@mui/material` were installed, but `react-bootstrap`, `bootstrap`, and
`@mui/material` were imported in **zero** files, and Bootstrap's own CSS was never even imported,
so a Bootstrap component dropped into the app would have rendered completely unstyled. The kit
solves both halves of that: real library components, and the dark theme that section 3.1 of the
specification demands ("Override React Bootstrap/MUI defaults so no default blue/white components
appear").

### 2.3 `frontend/src/components/ui/aureoTheme.js` (148 lines)

The Material UI theme: dark palette, gold primary, gold rating icons, dark dialogs, dark inputs,
gold table headers.

**Why necessary**

Without a theme, MUI components ship with a light blue default that would break the black and gold
design in section 3.1 of the specification, which calls the theme **MANDATORY** and states that
"Gold is the single accent color".

### 2.4 `frontend/src/components/ui/AureoProvider.jsx` (18 lines)

Mounts the theme once around the application.

**Why necessary**

Material UI components read their colours from a theme in context. Without this provider every MUI
component in the app would fall back to the default blue palette. It is mounted in `main.jsx`
(section 3.2) so no page has to know about it.

**Note:** `CssBaseline` was deliberately **not** used. Its global reset is injected at runtime,
after the static stylesheets, so it would have overridden the Aureo heading, list, and paragraph
rules. Aureo already has a complete reset in `index.css` and `App.css`, and a second reset would
have fought with it. The comment in the file records this so nobody re-adds it.

### 2.5 `frontend/src/components/ui/ValidatedField.jsx` (129 lines)

A React Hook Form field component that renders a label, an input of any type, and the Yup error
message. It accepts an `onValueChange` callback.

**Why necessary**

It keeps the form pages free of repeated `register` and `error` plumbing, and it gives one place
for the invalid-input styling. The `onValueChange` callback exists for one specific case: the
admin product form must lock the stock field to 1 whenever the condition changes to "second-hand",
which is the FR 2.2 rule. Folding that into a generic component kept the rule in the page where it
belongs.

### 2.6 `frontend/src/components/ui/ui.css` (378 lines)

The Aureo theme for the library components: dark tables, dark modals, gold pagination, dark form
controls, gold buttons.

**Why necessary**

`bootstrap/dist/css/bootstrap.min.css` was intentionally **not** imported. Bootstrap's reboot
resets `body` colour, heading sizes, and list styles, which would have broken the existing
hand-written design across the whole site. This file styles only the classes the components in
`index.jsx` actually use, so the design survives and the components still look like Aureo.

### 2.7 `frontend/src/styles/aureo.css` (155 lines)

Page-scoped corrections, described in section 3.4.

**Why necessary**

Every rule in it is a fix for a visible defect, and all of them are scoped with a page class so the
specificity beats the main stylesheet regardless of the order the two are bundled in.

### 2.8 `frontend/src/hooks/useInfiniteScroll.js` (47 lines)

An `IntersectionObserver` hook that returns a sentinel ref.

**Why necessary**

Quiz 3 awards fifteen points split between homepage pagination and homepage infinite scroll.
Pagination already existed; infinite scroll did not. The hook disconnects the observer whenever the
list is loading or exhausted, which prevents a burst of duplicate requests while a page is still in
flight, and it returns `undefined` when `IntersectionObserver` is unavailable so the manual
"Next" button remains the fallback.

### 2.9–2.11 `frontend/src/components/three/WatchHero.jsx`, `WatchModel.jsx`, `hero.css`

A Three.js watch built from primitives: gold cylinder case, dark dial, twelve hour markers, three
hands, crown, and strap.

**Why necessary**

Section 3.2 of the specification is a **MANDATORY** design requirement: "Use 3D for: 1. Home hero
(required): an interactive 3D watch". The hero was a static Unsplash photograph, and `three`,
`@react-three/fiber`, and `@react-three/drei` were installed but imported in **zero** files. The
component satisfies every rule the specification lists for that hero: it is lazy loaded with
`React.lazy` and `Suspense`, it uses a primitive watch because no `.glb` model exists, it detects
WebGL support before creating a GPU context, it shows a CSS watch fallback when WebGL is missing
or the screen is small, it honours `prefers-reduced-motion` by freezing the clock and stopping the
idle rotation, it uses a single `<Canvas>`, it disposes the renderer on unmount, and it never
blocks navigation because the hero is the only thing inside the `Suspense` boundary.

---

## 3. Modified files

### 3.1 `frontend/src/pages/LoginPage.jsx`, `RegisterPage.jsx`, `ProfilePage.jsx`

**Changed** — replaced the hand-rolled `useState` form objects with `useForm` plus
`yupResolver`, and replaced the raw `<input>` elements with `ValidatedField`.

**Why necessary**

These are the three forms named explicitly in the Unit 1 requirement: "product crud, user login,
update profile". Before the change they validated with nothing but the HTML `required` attribute,
which cannot express a password length, a six digit verification code, or a postal code format.
The register page needed two separate `useForm` instances because it has two stages, registration
and verification, each with its own schema.

One behaviour change on the profile page: the avatar size error moved from `alert()` to the
existing SweetAlert2 helper, because section 10 of the specification requires SweetAlert2 for user
facing confirmations and a native alert contradicts the design.

### 3.2 `frontend/src/pages/admin/AdminProductsPage.jsx`

**Changed** — converted the product form to React Hook Form and Yup, added a **category** select
that the form did not previously have, and moved the uploaded image previews out of the form
schema into their own state.

**Why necessary**

The first requirement of Unit 1 names "product crud" explicitly. The category field is the more
important half: the Product model has required a `category` since before this session, the
controller silently defaults it to `"luxury"`, and the seed data uses `dress`, `diver`, and
`chronograph`. Without a category input every product created through the admin form became
`luxury`, which made the MP2 category filter useless in practice. The images are base64 previews
that are uploaded to Cloudinary on submit, so they do not belong in a validation schema.

The second-hand stock rule was preserved. The schema allows 0 or 1 for a second-hand piece, and the
page keeps its existing stricter create-time check that demands exactly 1. The schema cannot make
that distinction on its own, because editing an already sold second-hand piece legitimately has a
stock of 0.

### 3.3 `frontend/src/pages/CatalogPage.jsx`

**Changed** — added three filters (category, minimum rating, minimum review count), added a
`useEffect` that re-syncs the filter controls with the URL, and added the star rating and review
count to each product card.

**Why necessary**

MP2 awards twenty points split across four filters: price, category, ratings, and review. The
backend already supported all four. `backend/utils/apiFeatures.js` applies `filter.category`,
`ratings.$gte`, and `numOfReviews.$gte`, and `backend/tests/product.test.js` already had a test
named "applies the combined price, category, rating and review filters". The catalog only ever sent
`minPrice` and `maxPrice`, so fifteen of the twenty points were unreachable through the UI. This
was the highest value per line of any change in this session.

The URL re-sync fixes a real navigation defect. The filter state was only read from
`useSearchParams` in the `useState` initialiser, so if the catalog was already mounted and the URL
changed, the filters were not applied. The homepage chips link to `/catalog?condition=second-hand`,
so clicking one while already on the catalog did nothing.

The card rating display exists because a ratings filter is hard to demonstrate on cards that never
show a rating.

### 3.4 `frontend/src/styles/aureo.css` (new file, defects corrected here)

Four visible defects were corrected:

| Defect | Cause | Fix |
|---|---|---|
| Catalog thumbnails rendered at their intrinsic size, uncropped | `.product-image` was styled as a container with `aspect-ratio`, but the class was applied to the `<img>` itself, so the `.product-image img` rule never matched | `.catalog-page .product-image` now sets `width`, `height`, and `object-fit: cover` |
| The PRE-OWNED badge, wishlist heart, and SOLD badge floated outside the card | `.product-image-wrap` had no rule at all, so the absolutely positioned children anchored to the viewport | `.catalog-page .product-image-wrap` now sets `position: relative`, `aspect-ratio`, and `overflow: hidden` |
| The PRE-OWNED badge was blue | Hardcoded `#8ab4f8` on `#4285f4` | Restyled to the gold family, because section 3.1 of the specification states "Gold is the single accent color" |
| The Google sign-in button was a white widget | Hardcoded `#ffffff`, `#3c4043`, `#dadce0` | Restyled to the dark palette, because section 3.1 requires that "no default blue/white components appear" |

### 3.5 `frontend/src/pages/WishlistPage.jsx`

**Changed** — a single import of `../styles/aureo.css`.

**Why necessary**

The wishlist uses the same `.product-placeholder` markup as the catalog, so it needed the same
placeholder styling. This file was not otherwise touched.

### 3.6 `frontend/src/App.jsx`

**Changed** — replaced the static hero image with the lazy-loaded 3D hero, and added the infinite
scroll to the homepage product list.

**Why necessary**

The hero is the mandatory 3D requirement (section 2.9 above). The infinite scroll is the Quiz 3
requirement (section 2.8 above). The homepage now keeps pagination **and** infinite scroll, because
the professor's list names both as separate items.

The accumulation logic was later refined by the concurrent agent into a render-time adjustment
using a `loadedPage` state, which matches the pattern already used elsewhere in this file and
removes one render pass. The behaviour is identical and was verified after the merge.

### 3.7 `frontend/src/main.jsx`

**Changed** — wrapped the application in `AureoProvider`.

**Why necessary**

See section 2.4. Without it, every Material UI component in the app would render with the default
blue palette instead of the Aureo theme.

### 3.8 `backend/middlewares/error.js`

**Changed** — added three error mappings and stopped internal messages from reaching the client.

| Case | Before | After |
|---|---|---|
| Mongoose `ValidationError` | **500** | **400**, with the individual field messages joined |
| Mongoose `CastError` (invalid id in the URL) | **500** | **400** |
| MongoDB duplicate key error (`code: 11000`) | **500** | **409** |
| Any unhandled server error | The raw internal message was returned to the browser | A generic message is returned; the full error is still written to the server log |

**Why necessary**

Section 4.2 of the specification requires "correct HTTP status (200, 201, 400, 401, 403, 404,
500)" and "Never return passwords, verification tokens, or stack traces to the client". A failed
Mongoose validation is a client mistake, so it has to be a 400. Before the change, creating a
product without a brand, or an order without a postal code, returned 500 and looked like a server
crash. Two regression tests were added, both in section 5.

### 3.9 `backend/controllers/reviewController.js`

**Changed** — one line: `review.isActive = true` in the update branch of
`createOrUpdateReview`, plus an explanatory comment.

**Why necessary**

Reviews are soft deleted. The create-or-update path looked up a review by `(user, product)` without
filtering on `isActive`, and never set `isActive` back to `true`. The result was a silent trap: a
user who deleted a review and then posted again received the success message
`"Review saved successfully"`, but the review stayed invisible, was excluded from the rating
recalculation, and the unique index on `(user, product)` blocked any new row. The user could never
review that product again, and nothing in the UI explained why. Setting `isActive = true` reuses
the soft deleted row, which satisfies the unique index and restores the review. A regression test
was added, see section 5.

### 3.10 `backend/tests/review.test.js` and `backend/tests/product.test.js`

**Changed** — three new tests, described in section 5.

**Why necessary**

Both bugs in sections 3.8 and 3.9 were silent. A test is the only thing that keeps them fixed.

### 3.11 `.gitignore`

**Changed** — added `backend-start.log`, `backend-start.err.log`, and `*.log`.

**Why necessary**

Two log files were sitting untracked in the repository root. The `*.log` rule covers the same
category of file in the future.

---

## 4. Bundle size work

This is not a requirement in any of the five MD files, but it was found while verifying the work
and it would have degraded the site.

**Measured**: the baseline build was 489 kB. After the changes it was 1,478 kB.

**Cause**: `import { Chip } from "@mui/material"` resolves to the package barrel, which
re-exports every Material UI component. The bundler had to process all of them, and tree shaking
could not remove what it did not recognise as unused.

**Fix**: switched every Material UI import to a deep path such as `@mui/material/Chip`, and did the
same for React Bootstrap.

**Result**: the main bundle fell to **1,052 kB**, a saving of 426 kB.

**Also verified**: the Three.js hero is code split into its own 909 kB chunk that is only fetched
when the hero loads, and Recharts is already in a separate 377 kB chunk behind the admin route.
Neither blocks the first paint.

---

## 5. Tests added

Three tests were added, all in the existing suites.

| Test | Suite | What it locks down |
|---|---|---|
| "answers an invalid product with 400 instead of 500" | `backend/tests/product.test.js` | A product created without its required `brand` is answered with 400 and a message mentioning the field, not 500 |
| "answers an invalid product id with 400 instead of 500" | `backend/tests/product.test.js` | A malformed id in the URL is a client error, not a server error |
| "lets a user review again after deleting the first review" | `backend/tests/review.test.js` | After deleting a review, posting a new one reuses the row, keeps the count at one, and restores the rating |

**Why necessary**

Section 12.1 of the build plan asks for backend tests covering validation, reviews, and the
review lifecycle. Both of the bugs in sections 3.8 and 3.9 produced the wrong result **without
raising an error**, so nothing else in the suite would have caught them.

---

## 6. Commands run, and why each was needed

### 6.1 Audit commands

| Command | Why it was needed |
|---|---|
| `git log --oneline`, `git status --short` | Establish what was committed versus what existed only on disk. This revealed that the committed history was far behind the working tree, and it is how the concurrent agent's activity was first detected. |
| `Get-ChildItem -Recurse -Include *.md` | Locate the five MD files. A plain recursive search also returns hundreds of `node_modules` READMEs, so the results were filtered. |
| `Get-ChildItem backend, frontend/src -Recurse` | Build the file inventory used for the phase-by-phase audit. |

### 6.2 Read-only verification

| Command | Why it was needed |
|---|---|
| `Get-Content`, `Select-String` on source files | Read the implementation with line numbers so every claim in the coverage matrix cites a real file rather than a guess. |
| `git diff` | Separate the concurrent agent's changes from mine in files we both touched. |

### 6.3 Build and test commands

| Command | Why it was needed |
|---|---|
| `npm run build` (frontend) | The only way to prove that every new import resolves and that nothing is a syntax error. A green build is the "program execution (errors)" item in the Term Test LEC. Run after every significant change. |
| `npx eslint .` (frontend) | The project already had a lint script. A clean run confirms no unused imports or undefined identifiers were introduced by the refactor. |
| `npm test` (backend) | Proves the two backend fixes and the three new tests, and confirms the concurrent agent's 114 tests still pass after my changes to `error.js` and `reviewController.js`. |
| `node --check <file>` | A fast syntax-only check on the two backend files that were edited, before the slow full suite was run. |

### 6.4 Bundle measurement commands

| Command | Why it was needed |
|---|---|
| `git worktree add <temp> HEAD` | To measure the baseline bundle size **without disturbing the working tree**. `git stash` would have yanked files out from under the concurrent agent mid-write. The worktree gave a clean checkout of `HEAD` in a temporary directory. |
| `Copy-Item frontend/node_modules <worktree>` | The worktree has no `node_modules`, and `npm install` would have taken minutes. Copying the existing folder made the baseline build start immediately. |
| `git worktree remove --force` + `git worktree prune` | Clean up that temporary checkout so no stray worktree is left registered. |

### 6.5 Runtime smoke test commands

| Command | Why it was needed |
|---|---|
| `node server.js` with `PORT=3111` | Start a second backend instance on a different port to exercise the new error mapping. The original instance on port 3000 was left running so nothing that depended on it was disturbed. |
| `Invoke-WebRequest http://localhost:3111/api/v1/health` | Confirm the server boots and answers. |
| `Invoke-WebRequest "http://localhost:3111/api/v1/products?minRating=4&minReviews=1&category=dress"` | Prove the three new MP2 filters actually reach MongoDB and filter correctly. This returned three matching dress watches and no others. |
| `npx vite --port 5199` then requesting each changed module path | A production build proves the modules **compile**; it does not prove the dev server transforms them. Requesting each module from Vite surfaces transform-time errors, including failed dynamic imports. All fourteen returned 200 with no errors in the Vite log. |
| `Stop-Process` on the test processes | Clean up the smoke test instances so no stray server is left holding a port. |

### 6.6 Commands deliberately NOT run

| Command | Why it was skipped |
|---|---|
| `git commit`, `git push` | Not requested. The working tree contains both my work and the concurrent agent's, and committing it without a review could hide a problem. Section 8 lists what to stage. |
| `git stash` | Would have conflicted with the concurrent agent's in-flight writes. `git worktree` was used instead for the same measurement. |
| `npm install` in the baseline worktree | `npm install` rewrites `package-lock.json`. Copying `node_modules` was faster and left the lock file untouched. |

---

## 7. What was deliberately not changed

| Item | Reason |
|---|---|
| `backend/app.js`, `backend/routes/*`, `backend/controllers/*` for phases 7 to 10 | The concurrent agent was actively writing them. Editing them risked a lost or merged write with no benefit, since its implementation already satisfies the specification's API table. |
| `frontend/src/redux/store.js` | The concurrent agent had just added the appraisal, service, ticket, and dashboard slices. |
| `frontend/src/App.css` | A 2,357 line file owned by the concurrent agent. All my CSS went into new, page-scoped files instead. |
| `backend/models/*` | The models already satisfy the specification's data model table. |
| `backend/node_modules`, which is tracked in Git | Removing 1,848 files from the index is a large, unrelated operation that should be a deliberate, separate decision. It is flagged in Section 8 instead. |

---

## 8. Required next steps

These are not optional. Each one will fail a clean clone or a deployment.

### 8.1 Stage the new files

**Forty-two files are untracked**, including every file in sections 2.1 to 2.11 and this change log
itself. A file that exists on disk but is not tracked does not exist on another machine, and Render
builds from a fresh clone. This is the single most likely cause of a broken build.

```powershell
git status --short
git add frontend/src/components/ui frontend/src/components/three frontend/src/hooks frontend/src/styles frontend/src/utils/validationSchemas.js
```

The same applies to the concurrent agent's untracked files: `backend/tests/`, the new controllers and
routes, `frontend/src/components/ChatWidget.jsx`, the new pages, the new Redux slices, `README.md`,
`render.yaml`, and `frontend/public/_redirects`.

```powershell
git add -A
git status --short          # review the staged list before committing
```

### 8.2 Untrack `backend/node_modules`

`.gitignore` already lists `node_modules/`, but the folder was committed before that rule existed,
and `.gitignore` does not affect files that are already tracked.

```powershell
git rm -r --cached backend/node_modules
```

### 8.3 Optional follow-ups

| Item | Where it is tracked |
|---|---|
| `GET /admin/users`, `GET/PUT/DELETE /admin/user/:id`, `GET /admin/mock-emails` are not built | `AUREO_PROJECT_SPEC.md` section 8, `PROJECT_REQUIREMENTS.md` |
| The frontend has no test script | `AUREO_BUILD_PLAN.md` Phase 12 |
| The Render deployment has not been run | `AUREO_SETUP_GUIDE.md` section 11 |
| `utils/mockPayment.js` is planned but the payment logic is still inline in the order controller | `AUREO_BUILD_PLAN.md`, Recorded deviations |

---

## 9. Phase 11: 3D Experience and UI Completion

Phase 11 is now **complete**. Items 1 to 5 (the home hero) were finished in the previous round of
work. This round finished items 6 and 7.

### 9.1 The design tokens were consolidated

**Changed**

- `frontend/src/App.css` had a second `:root` block that redefined the palette under different
  names. It was loaded after `src/index.css`, so it won the cascade.
- Deleted that block and rewrote all **170** alias references to the specification's names.

| Was | Now |
|---|---|
| `var(--page)` | `var(--bg-page)` |
| `var(--panel)` | `var(--bg-card)` |
| `var(--panel-light)` | `var(--bg-elevated)` |
| `var(--line)` | `var(--border)` |
| `var(--gold-light)` | `var(--gold-hover)` |
| `var(--white)` | `var(--text-primary)` |
| `var(--muted)` | `var(--text-secondary)` |
| `var(--dim)` | `var(--text-muted)` |

**Why necessary**

Section 3.1 of the specification says the tokens must be "defined as CSS variables in
`frontend/src/index.css` and use them everywhere; never hard-code random colors". The duplicate
block broke that in two ways. First, three of its values did not match the specification:
`--gold-light` was `#dfbf7d` instead of `#d8b574`, `--muted` was `#a49e91` instead of `#b8b2a6`, and
`--dim` was `#716d65` instead of `#7d786e`. Those were the colours actually rendered, so the site
was quietly off-palette. Second, the palette had two sources of truth, so changing a token could
change one half of the interface and not the other.

The alias names were used in `App.css` only. A grep of every other stylesheet and every JSX file
found no other reference, so the rewrite was contained to one file.

### 9.2 Every hard-coded colour was replaced with a token

**Changed**

- `frontend/src/index.css` gained the derived tints that the stylesheets were repeating as literal
  `rgba()` values: the gold, danger, and success alpha steps, the black overlays, and the gold
  focus ring.
- Replaced every remaining literal in `App.css`, `ui.css`, `aureo.css`, and `hero.css`.

**Why necessary**

The same rule applies: no colour outside the token file. The scan found **45** distinct literals
spread across the four stylesheets, including two that broke the theme outright:

- The **PRE-OWNED badge was blue** (`#8ab4f8` on `#4285f4`). The specification states that "Gold is
  the single accent color" and that "no default blue/white components appear".
- The **Google sign-in button was a white Google widget** (`#ffffff`, `#f8f9fa`, `#dadce0`,
  `#3c4043`). It is now a dark Aureo button that keeps only the Google brand mark colourful.

The result: `App.css` and the three other stylesheets now contain **zero** literal colours. The
only literals left in the project are the token definitions themselves in `src/index.css`.

### 9.3 A focus ring on every interactive element

**Changed** — added `frontend/src/styles/focus.css`.

**Why necessary**

Section 3.1 of the specification names the focus ring explicitly: "Prices, active nav items, rating
stars, and **focus rings** use gold." The stylesheet had **four** `:focus` rules in nearly three
thousand lines, all of them on form inputs. Buttons, links, navigation items, filter pills,
pagination controls, the wishlist heart, the admin buttons, and the product cards had no visible
focus indicator at all, so a keyboard user could not tell where they were.

The new file gives every one of them the same gold ring. It uses `:focus-visible`, so the ring
appears for keyboard navigation and not for a mouse click. Inputs keep their existing gold border
and glow instead, so the two never stack. The existing input rings were also moved onto one shared
`--focus-ring` token, because they were using three different alpha values.

The file also carries a `prefers-reduced-motion` block that shortens every animation and
transition in the application. The specification asks for reduced motion to be respected, and the
3D hero already handled it; this extends it to the whole interface.

### 9.4 The loading, empty, and error states were styled

**Changed** — added `frontend/src/styles/states.css`.

**Why necessary**

Section 10 of the specification says to "add loading, error, and empty states to every list/detail
page". The markup was already in the pages, but **35 classes had no CSS rule at all**. An empty
cart, a failed catalogue load, a list that is still loading, and the product page with no
photograph all rendered as unstyled text with no spacing and no panel.

The new file gives them one shared visual language: a bordered card for the empty state, a gold
spinner drawn with a border for the loading states, a centred message for the detail pages, and a
dashed well for a missing photograph. The chat typing indicator also gained the three-dot
animation it was missing.

### 9.5 The layout containers were completed

**Changed** — added `frontend/src/styles/layouts.css`.

**Why necessary**

The same 35 classes included the layout containers. The checkout columns did not line up, the order
detail page had no two-column grid, the order rows had no spacing, and the review form had no
panel. Section 10 of the specification asks for a "clean layout with generous spacing".

### 9.6 The navigation stays reachable on a phone

**Changed** — `frontend/src/App.css`.

**Why necessary**

At 900 pixels and below the navigation links were set to `display: none`. A visitor on a phone
had no way to reach **Services**, **Sell your watch**, **Appraisals**, or **Wishlist**, because
those links exist only in the navigation. That is a functional break on the layout the
specification calls for ("Responsive: works on laptop and mobile widths"), and it hid the pages
that build plan Phases 7 and 8 delivered.

The links now move onto their own row and scroll sideways when they do not fit, so nothing becomes
unreachable without adding a JavaScript menu.

### 9.7 Every other responsive gap was closed

**Changed** — `frontend/src/styles/layouts.css` and `frontend/src/App.css`.

| Gap | Fix |
|---|---|
| The specification table stayed two columns on a phone | It collapses to one column below 640 pixels |
| The admin header did not wrap | It wraps onto two rows, and the admin title row stacks |
| The checkout summary was sticky and could cover the form | It is released below 960 pixels |
| The account and admin containers used a fixed gutter | They use `calc(100% - 2rem)` on a phone |
| The 3D hero kept its desktop height on a phone | It follows the panel down to 390 pixels |

### 9.8 The native dialogs were replaced

**Changed**

| File | Was | Now |
|---|---|---|
| `frontend/src/pages/CheckoutPage.jsx` | `alert("Email verification required...")` | `toast.error(...)` |
| `frontend/src/pages/ProductDetailPage.jsx` | `alert("Cannot add more...")` | `toast.info(...)` |
| `frontend/src/pages/OrdersPage.jsx` | `window.confirm("Are you sure...")` | `confirmAction({...})` |
| `frontend/src/pages/OrderDetailPage.jsx` | `window.confirm("Confirm cancellation...")` | `confirmAction({...})` |
| `frontend/src/utils/sweetAlert.js` | three hard-coded hex values | The values are read from the CSS tokens at call time |

**Why necessary**

Section 10 of the specification says to "confirm destructive actions with SweetAlert2" and to "use
Toastify for success and error messages". A native `alert` and a native `confirm` are neither.
They also ignore the theme, so a white browser dialog appeared in the middle of a black and gold
page.

The `sweetAlert.js` change removes the last hard-coded colours from the JavaScript. The values are
now read from the document root with `getComputedStyle`, so there is one definition of the palette.
The fallbacks in that helper only apply if the stylesheet has not loaded yet.

### 9.9 The overlay theme was completed

**Changed** — added `frontend/src/styles/overlays.css`.

**Why necessary**

The stylesheet themed the visible parts of SweetAlert2 and Toastify, but the backdrop behind a
dialog, the close button, the dialog footer, the toast progress bar, and the toast title were
still at their light defaults. The close button in particular was white on a white popup.

### 9.10 The product detail page gained a 3D viewer

**Changed** — added `frontend/src/components/three/ProductViewer.jsx` and wired a
**Photographs / 3D View** switch into `frontend/src/pages/ProductDetailPage.jsx`.

**Why necessary**

Section 3.2 of the specification lists the product detail page second: "a small 3D viewer **or a
rotatable gallery** for the selected watch". The gallery existed, but it only switches between
photographs. The viewer lets the visitor drag the watch around and look at it from any angle.

It follows the same rules as the home hero: lazy loaded so Three.js is not fetched until it is
asked for, one canvas per page, the WebGL check runs before a GPU context is created, the renderer
is disposed on unmount, and the idle turn stops under `prefers-reduced-motion`.

The capability checks were moved into `frontend/src/components/three/capabilities.js` by the
concurrent agent during this session, so the viewer imports them from there.

### 9.11 The card tilt micro-interaction

**Changed** — `frontend/src/components/three/hero.css`.

**Why necessary**

Section 3.2 of the specification lists the optional micro-interactions: "card tilt on hover (CSS
`perspective` + `rotateX/Y`)". The catalogue cards now tilt four degrees on hover. The effect is
limited to devices with a real pointer and is switched off entirely under
`prefers-reduced-motion`, so it never fights the accessibility setting.

### 9.12 The chat typing indicator

**Changed** — `frontend/src/components/ChatWidget.jsx` and `frontend/src/styles/states.css`.

**Why necessary**

The indicator was the literal text `...` in a bubble with no animation, so it did not read as the
assistant composing a reply. It is now three dots that rise in sequence.

### 9.13 Commands used for Phase 11

| Command | Why it was needed |
|---|---|
| `Select-String` over the CSS and the JSX | To find the 35 unstyled classes, the four `:focus` rules, the hard-coded literals, and the native dialogs. Each list was produced by scanning, not by reading every file by hand. |
| `Select-String` for `var(--x)` references, compared against the token definitions | To prove that every token reference resolves. It found five that did not: `--gold-14`, `--gold-55`, `--overlay-75`, `--scrim-35`, and a pre-existing `var(--text)` in the admin bulk bar that was silently dropped by the browser. |
| `npm run build` | The only way to catch the `MISSING_EXPORT` error when the viewer imported a function the concurrent agent had already moved into another module. |
| `npx eslint .` | Caught the `react-hooks/set-state-in-effect` error in the viewer. The fix was to match the pattern the hero already used: a lazy `useState` initialiser for the first value, and the effect only for subscription updates. |
| `npx vite --port 5205` and requesting each changed module | To confirm the dev server transforms every new file, and that the new stylesheets are served. |

---

## 10. Verification summary

| Check | Result |
|---|---|
| `npm test` (backend) | 117 passed, 7 suites, 0 failed |
| `npm run build` (frontend) | Success |
| `npx eslint .` (frontend) | Clean, exit code 0 |
| `GET /api/v1/health` | `{"success":true,"message":"Aureo API is running"}` |
| `GET /api/v1/products?minRating=4&minReviews=1&category=dress` | 200, three correct results |
| Vite transform of the changed and new modules | All 200, no errors in the log |
| Main bundle | 489 kB baseline, 1,053 kB after (deep imports removed 426 kB) |
| Three.js hero, product viewer, and Recharts dashboard | Separate lazy chunks, none blocks first paint |
| Hard-coded colours outside `src/index.css` | Zero in all four stylesheets |
| Undefined `var()` references | Zero, down from five |
| CSS classes used in JSX with no rule | Zero, down from 35 |
| Native `alert` and `confirm` calls | Zero, down from four |

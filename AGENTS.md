# AGENTS.md

## Project: Racepack Management System

This project is a high-performance web application for managing participant registration and racepack pickup for a running event.

The application will be built with:

* **Next.js**
* **TypeScript**
* **Firebase Authentication**
* **Cloud Firestore**
* **Tailwind CSS**
* **Vercel**

The primary goal is:

> **Extremely fast participant search and racepack pickup, with minimal Firestore reads/writes and safe concurrent operations between multiple staff members.**

---

# 1. Core Requirements

The system manages approximately 1,000–2,000 participants.

Current source data contains approximately:

* 1,166 participant rows
* Multiple registration sources
* Each original Excel sheet represents a `pendaftaran_melalui` category
* Some participants do not have BIB numbers
* Some BIB values may be duplicated or invalid
* Participant names are not guaranteed to be unique

The system must support:

1. Staff login
2. Participant search
3. Participant detail
4. Racepack pickup confirmation
5. Pickup timestamp
6. Staff identification
7. Pickup history/audit
8. Dashboard statistics
9. Multiple staff/devices working simultaneously
10. Fast operation during the event

---

# 2. Technology Stack

Use:

```text
Next.js
TypeScript
Tailwind CSS
Firebase Authentication
Cloud Firestore
Vercel
```

Prefer the latest stable versions compatible with the project.

Use strict TypeScript.

Avoid unnecessary dependencies.

Do not introduce another backend framework unless explicitly requested.

---

# 3. Architecture

Recommended architecture:

```text
                         Vercel
                           │
                           ▼
                    ┌─────────────┐
                    │   Next.js   │
                    │   Website   │
                    └──────┬──────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      Firebase Auth              Cloud Firestore
       Staff Login                Participant Data
                                      │
                                      ▼
                              ~1,166 participants
```

The application should minimize network requests.

Participant search should preferably happen locally after the participant dataset has been loaded.

---

# 4. Performance Philosophy

Performance is a first-class requirement.

The application will be used during a live event where staff need to process participants quickly.

The critical workflow is:

```text
Search participant
      ↓
Select participant
      ↓
Verify participant
      ↓
Confirm pickup
      ↓
Show success
```

This workflow must have as little latency as reasonably possible.

## Critical rules

### DO

* Cache participant data in the browser.
* Search participant data locally whenever practical.
* Minimize Firestore reads.
* Minimize Firestore writes.
* Use Firestore transactions for pickup confirmation.
* Use server timestamps.
* Keep the pickup UI lightweight.
* Optimize mobile/tablet usage.
* Use indexed fields where Firestore queries are required.
* Use pagination for large administrative lists.
* Keep dashboard reads minimal.
* Use optimistic UI only where consistency is not compromised.

### DO NOT

* Query Firestore on every keystroke.
* Download all participant documents repeatedly.
* Recalculate dashboard statistics by reading all participants.
* Use Firestore realtime listeners everywhere.
* Perform unnecessary reads after every update.
* Put large unnecessary objects into Firestore documents.
* Load heavy components on the primary pickup page.
* Use a server request for operations that can safely be performed locally.

---

# 5. Participant Search

The primary search is by participant name.

Secondary search should support:

* BIB
* NIK
* Phone number

The search experience should feel instant.

Preferred flow:

```text
Firestore
    ↓
Load participant dataset
    ↓
Browser memory/cache
    ↓
Local search
    ↓
Results
```

Example:

```text
User types:

b
bu
bud
budi
```

Do NOT perform:

```text
b    → Firestore read
bu   → Firestore read
bud  → Firestore read
budi → Firestore read
```

Instead:

```text
b
 ↓
local filter

bu
 ↓
local filter

bud
 ↓
local filter

budi
 ↓
local filter
```

For approximately 1,166 participants, local filtering is expected to be extremely fast.

---

# 6. Search Normalization

Store a normalized search field:

```text
nama_search
```

Example:

```json
{
  "nama": "Budi Santoso",
  "nama_search": "budi santoso"
}
```

Normalization should:

* Convert to lowercase
* Trim whitespace
* Collapse repeated whitespace
* Handle common formatting inconsistencies

The original `nama` must never be modified merely for search purposes.

---

# 7. Participant Data Model

Recommended Firestore structure:

```text
peserta/{pesertaId}
```

Example:

```json
{
  "nama": "Budi Santoso",
  "nama_search": "budi santoso",
  "bib": "40001",
  "kategori": "10K",
  "nik": "3529...",
  "no_hp": "0812...",
  "jenis_kelamin": "L",
  "tanggal_lahir": "...",
  "alamat": "...",
  "ukuran_jersey": "L",
  "pendaftaran_melalui": "TRIBUN",

  "status_pengambilan": false,
  "waktu_pengambilan": null,
  "petugas_id": null
}
```

Field names should use `snake_case` consistently.

---

# 8. Document ID

Do NOT use participant name as Firestore document ID.

Do NOT assume BIB is always unique.

Use a generated unique Firestore document ID or another guaranteed unique internal ID.

Example:

```text
peserta/
  a8Hd72k...
  b91Ks82...
  x71Lm92...
```

BIB is a business identifier, not necessarily a database primary key.

---

# 9. Registration Source

Every participant must have:

```text
pendaftaran_melalui
```

The value represents the original Excel sheet/source.

Examples:

```text
TRIBUN
IRSUP 1
IDI SUMENEP
BREU MANUAL
VK RSUD
PKM GULUK
PKM PAMOLOKAN
IRSUP 2
MANUAL 1
BPRS
MANUAL 2 + powerfit
```

Do not remove this field.

Do not automatically merge participants simply because their names are equal.

---

# 10. Duplicate Handling

Participant names are NOT unique.

BIB values may also contain duplicates or invalid values.

Therefore:

```text
nama != unique identifier
bib != guaranteed unique identifier
```

Duplicate detection must use appropriate identifying information such as:

* BIB
* NIK
* phone
* registration source
* participant name

Never automatically delete duplicate records without explicit business confirmation.

---

# 11. Racepack Pickup

Pickup is the most critical operation.

When a staff member clicks:

```text
AMBIL RACEPACK
```

the system must safely verify the current status before changing it.

Preferred behavior:

```text
BELUM DIAMBIL
      ↓
atomic transaction
      ↓
SUDAH DIAMBIL
```

The operation must prevent two staff members from successfully claiming the same participant simultaneously.

---

# 12. Race Condition Protection

Example:

```text
Staff A ─────┐
             ├──> Budi
Staff B ─────┘
```

Both staff may open Budi at approximately the same time.

Only one should successfully change:

```text
status_pengambilan: false
```

to:

```text
status_pengambilan: true
```

The other staff member must receive a clear message:

> Racepack sudah diambil oleh petugas lain.

Use a Firestore transaction or another atomic consistency mechanism.

Never rely only on client-side checks.

This is critical.

---

# 13. Pickup Data

When pickup succeeds, store:

```json
{
  "status_pengambilan": true,
  "waktu_pengambilan": "server timestamp",
  "petugas_id": "..."
}
```

Use Firestore server timestamp.

Do NOT trust the client's local clock for the official pickup time.

---

# 14. Pickup History

For auditability, consider a separate collection:

```text
pengambilan/{pengambilanId}
```

Example:

```json
{
  "peserta_id": "...",
  "petugas_id": "...",
  "waktu_pengambilan": "...",
  "status": "BERHASIL"
}
```

This allows the system to answer:

* Who processed the participant?
* When was the racepack collected?
* How many participants did each staff member process?
* Was there an attempted duplicate pickup?

---

# 15. Staff Authentication

Use Firebase Authentication.

Staff should not directly modify arbitrary participant fields.

Authentication must be required for pickup operations.

Recommended roles:

```text
admin
petugas
```

Admin may:

* Manage participants
* Manage staff
* View dashboard
* Correct data
* View audit history

Petugas may:

* Search participants
* View required participant information
* Confirm racepack pickup
* View their own relevant pickup information

---

# 16. Firestore Security

Security rules are mandatory.

Never rely only on hiding UI buttons.

Firestore Security Rules must enforce authorization.

Examples of protected operations:

* Participant read
* Participant update
* Pickup creation
* Staff management
* Administrative operations

Never expose Firebase Admin credentials to the browser.

Never put:

```text
FIREBASE_ADMIN_PRIVATE_KEY
```

or other server secrets into `NEXT_PUBLIC_*` environment variables.

---

# 17. Dashboard Performance

Do NOT calculate dashboard statistics by reading every participant document each time.

Avoid:

```text
Read 1,166 participants
      ↓
Count status
      ↓
Display dashboard
```

Prefer an aggregate/statistics document:

```text
stats/racepack
```

Example:

```json
{
  "total": 1166,
  "sudah_diambil": 723,
  "belum_diambil": 443
}
```

When a pickup succeeds:

```text
sudah_diambil + 1
belum_diambil - 1
```

Use atomic increments where appropriate.

Dashboard should require only a very small number of reads.

---

# 18. Realtime Updates

Realtime Firestore listeners should be used selectively.

Do NOT attach listeners to the entire participant collection by default.

Use realtime listeners only where there is a clear UX requirement.

For the primary pickup screen:

```text
Search locally
     ↓
Open participant
     ↓
Perform atomic pickup
```

There is usually no need for a persistent realtime listener on every participant.

---

# 19. Browser Cache

Participant data should be cached where appropriate.

Preferred strategy:

```text
First visit
    ↓
Load participant data
    ↓
Store/cache locally
    ↓
Search locally
```

Possible technologies:

* In-memory state
* IndexedDB
* Firestore offline persistence where appropriate

The implementation should choose the simplest solution that provides reliable performance.

For approximately 1,166 records, avoid over-engineering.

---

# 20. Offline Considerations

The application may be used at an event where network conditions can become unreliable.

The system should be designed with resilience in mind.

However:

> Pickup confirmation must never falsely report success if the server has not safely recorded the operation.

Local search can continue to work from cached participant data.

Pickup confirmation should clearly distinguish:

```text
Successfully recorded
```

from:

```text
Pending / failed
```

Do not show "Racepack berhasil diambil" merely because a local write has been queued unless the UX explicitly communicates that state.

---

# 21. UI/UX

The primary pickup interface should prioritize speed over decoration.

Example:

```text
┌───────────────────────────────────────┐
│ 🔍 Cari nama / BIB                    │
└───────────────────────────────────────┘

Budi Santoso
BIB: 40001
10K • Jersey L
TRIBUN

[ LIHAT DETAIL ]
```

Detail:

```text
Budi Santoso

BIB             40001
Kategori        10K
Jersey          L
Pendaftaran    TRIBUN

Status
BELUM DIAMBIL

[ AMBIL RACEPACK ]
```

After success:

```text
✓ RACEPACK BERHASIL DIAMBIL

Budi Santoso
BIB 40001

Petugas: Andi
Waktu: 14:32
```

The success state should be visually obvious.

---

# 22. Mobile First

The system will likely be used on:

* smartphones
* tablets
* laptops

The primary pickup screen must be mobile-first.

Important:

* Large touch targets
* Large search field
* Minimal navigation
* Fast rendering
* No unnecessary animations
* Clear status
* Easy confirmation
* Avoid accidental double clicks

---

# 23. Double Click Protection

After clicking:

```text
AMBIL RACEPACK
```

disable the button while the transaction is executing.

Example UI state:

```text
[ MEMPROSES... ]
```

Do not allow multiple simultaneous client requests from repeated clicks.

This is an additional UX safeguard.

It does NOT replace the Firestore transaction.

---

# 24. Data Import

Participant data originates from Excel.

Before importing:

1. Normalize columns
2. Validate names
3. Validate BIB
4. Validate phone numbers
5. Validate NIK
6. Preserve `pendaftaran_melalui`
7. Detect duplicates
8. Detect missing BIB
9. Detect invalid BIB
10. Review import errors

Do not silently discard invalid records.

Import tooling should produce a report:

```text
Imported
Skipped
Duplicate
Invalid
Missing required field
```

---

# 25. BIB Validation

Do not assume every value in a BIB column is a valid BIB.

Some source sheets may contain:

* empty values
* names instead of BIB numbers
* duplicated values
* inconsistent formatting

BIB validation must be based on the actual event's BIB format.

Do not invent validation rules without confirmation.

---

# 26. Data Integrity

Participant master data and pickup transaction data should be logically separated.

Participant:

```text
peserta/{id}
```

Pickup:

```text
pengambilan/{id}
```

This allows participant information to remain stable while pickup history grows independently.

---

# 27. Error Handling

Never expose raw Firebase errors to users.

Convert errors into clear messages.

Examples:

```text
Peserta tidak ditemukan.

Racepack sudah diambil.

Koneksi bermasalah. Silakan coba lagi.

Anda tidak memiliki izin untuk melakukan tindakan ini.

Terjadi kesalahan saat menyimpan pengambilan.
```

Log technical errors for developers/admins.

---

# 28. Loading States

Avoid full-page loading for simple operations.

Use local loading indicators.

For search:

```text
initial load → loading state
search after data loaded → instant
```

For pickup:

```text
button
  ↓
processing
  ↓
success/error
```

Do not reload the entire page after pickup.

---

# 29. Next.js Guidelines

Prefer modern Next.js architecture.

Use Server Components by default.

Use Client Components only when interactivity requires them.

The participant search UI will likely be a Client Component because it requires:

* local state
* input handling
* filtering
* pickup interaction

Do not make the entire application a Client Component unnecessarily.

---

# 30. Firebase Client Configuration

Firebase client configuration may be exposed through `NEXT_PUBLIC_*` variables because Firebase web configuration is not a secret.

However:

* Firestore Security Rules are mandatory.
* Authentication must be enforced.
* Admin SDK credentials must remain server-side.

Example environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Never commit `.env.local`.

---

# 31. Code Quality

Use:

* TypeScript strict mode
* ESLint
* clear component boundaries
* reusable functions
* typed Firestore models
* centralized Firebase initialization
* centralized authentication logic
* centralized Firestore operations

Avoid:

* `any`
* duplicated Firebase initialization
* duplicated query logic
* business logic directly inside large UI components
* unnecessary abstractions
* unnecessary dependencies

---

# 32. Suggested Project Structure

Recommended starting structure:

```text
src/
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── peserta/
│   ├── pengambilan/
│   └── admin/
│
├── components/
│   ├── search/
│   ├── peserta/
│   ├── pengambilan/
│   ├── dashboard/
│   └── ui/
│
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── firestore.ts
│   │
│   ├── peserta/
│   ├── pengambilan/
│   └── stats/
│
├── hooks/
├── types/
├── utils/
└── constants/
```

Adjust the structure when the project grows, but avoid premature complexity.

---

# 33. Performance Budget

Primary pickup page should be treated as a performance-critical page.

Priorities:

1. Fast initial render
2. Fast search
3. Minimal JavaScript
4. Minimal network requests
5. No unnecessary realtime subscriptions
6. No unnecessary Firebase reads
7. No unnecessary component rendering

Search interaction should feel effectively instantaneous for ~1,166 participants.

---

# 34. Firestore Cost Optimization

Always consider read/write cost.

Bad:

```text
User types "budi"
→ 4 Firestore queries
```

Good:

```text
Load/cache participant data once
→ local search
```

Bad:

```text
Dashboard
→ read all participants
→ calculate counts
```

Good:

```text
Dashboard
→ read stats document
```

Bad:

```text
Every component subscribes to Firestore
```

Good:

```text
Use Firestore only where realtime synchronization is actually needed.
```

---

# 35. Business Rules

The following rules are mandatory:

### Rule 1

A participant can only have one successful racepack pickup.

### Rule 2

Two staff members must not be able to successfully claim the same participant simultaneously.

### Rule 3

Pickup time must use server-side time.

### Rule 4

The staff member performing the pickup must be recorded.

### Rule 5

Participant master data must not be accidentally modified during pickup.

### Rule 6

Duplicate participant names must not automatically be merged.

### Rule 7

Missing or invalid BIB must not cause participant records to disappear.

---

# 36. Development Order

Implement in this order:

## Phase 1 — Foundation

* Create Next.js project
* Configure TypeScript
* Configure Tailwind
* Configure Firebase
* Configure environment variables
* Configure Firebase Authentication
* Configure Firestore

## Phase 2 — Data

* Define participant types
* Define Firestore schema
* Prepare import process
* Import normalized participant data
* Validate imported records

## Phase 3 — Authentication

* Login
* Logout
* Staff roles
* Protected routes

## Phase 4 — Search

* Load/cache participants
* Local search
* Search by name
* Search by BIB
* Search by NIK/phone where appropriate
* Fast result rendering

## Phase 5 — Pickup

* Participant detail
* Pickup button
* Transaction
* Race-condition protection
* Server timestamp
* Staff ID
* Success/error states

## Phase 6 — Dashboard

* Total participants
* Picked up
* Not picked up
* Percentage
* Staff statistics if required

## Phase 7 — Audit

* Pickup history
* Staff activity
* Duplicate pickup attempts
* Administrative correction tools

## Phase 8 — Deployment

* Production Firebase project
* Firestore Security Rules
* Firebase Auth configuration
* Vercel environment variables
* Production deployment
* Performance testing

---

# 37. Testing Requirements

Before production, test:

### Search

* Exact name
* Partial name
* Uppercase/lowercase
* Names with extra spaces
* Duplicate names
* Missing BIB
* Invalid BIB

### Pickup

* Normal pickup
* Double click
* Two users simultaneously
* Already picked participant
* Network failure
* Authentication failure
* Firestore permission failure

### Dashboard

* Correct total
* Correct picked count
* Correct remaining count
* Correct percentage

### Security

* Unauthenticated access
* Petugas permissions
* Admin permissions
* Unauthorized Firestore writes
* Unauthorized participant modifications

---

# 38. Deployment

The production application will be deployed on Vercel.

The application must be compatible with Vercel's deployment model.

Avoid architecture that requires:

* persistent local filesystem
* long-running background processes
* manually maintained servers

Use Firebase for persistent data.

---

# 39. Important Agent Behavior

When modifying this project, the coding agent must:

1. Read this `AGENTS.md` before making architectural changes.
2. Preserve the Firebase + Next.js architecture.
3. Prioritize performance.
4. Minimize Firestore reads.
5. Minimize Firestore writes.
6. Protect pickup operations with atomic consistency.
7. Never weaken Firestore security rules merely to make development easier.
8. Never expose server credentials.
9. Avoid unnecessary dependencies.
10. Avoid unnecessary rewrites.
11. Keep changes focused and explain significant architectural changes.
12. Test critical pickup behavior after modifying it.

---

# 40. Definition of Done

The system is considered production-ready when:

* Staff can securely log in.
* Participant search is fast.
* Search does not query Firestore on every keystroke.
* Participant data is correctly imported.
* Registration source is preserved.
* Duplicate names are handled safely.
* BIB inconsistencies are handled safely.
* Racepack pickup is atomic.
* Double pickup is prevented.
* Pickup time uses server time.
* Staff identity is recorded.
* Dashboard statistics are efficient.
* Firestore rules protect the database.
* Mobile UI works well.
* Vercel deployment works.
* Production environment variables are configured.
* Critical flows have been tested.

---

# 41. Primary Principle

The most important principle of this project is:

> **Make the racepack pickup process extremely fast for staff without sacrificing data integrity or security.**

The ideal user experience is:

```text
OPEN WEBSITE
     ↓
LOGIN
     ↓
TYPE NAME / BIB
     ↓
RESULT APPEARS IMMEDIATELY
     ↓
VERIFY PARTICIPANT
     ↓
AMBIL RACEPACK
     ↓
SUCCESS
```

The entire workflow should be optimized for real-world event conditions, multiple simultaneous staff users, unreliable network conditions, and minimal Firebase usage.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

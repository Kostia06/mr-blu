# Mr. Blu Architecture

> Voice-first invoicing platform for contractors. Speak, review, send.

## Table of Contents
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Authentication Flow](#authentication-flow)
- [Data Flow](#data-flow)
- [Component Hierarchy](#component-hierarchy)
- [State Management](#state-management)
- [API Routes](#api-routes)
- [Database Schema](#database-schema)
- [Voice-to-Invoice Pipeline](#voice-to-invoice-pipeline)
- [Deployment Architecture](#deployment-architecture)
- [Feature Map](#feature-map)
- [File Reference](#file-reference)

---

## Project Structure

```mermaid
graph TD
    subgraph Monorepo["pnpm Monorepo + Turborepo"]
        ROOT["mrblu/"]
    end

    subgraph Apps
        ROOT --> WEB["apps/web/<br/>Preact SPA"]
        ROOT --> MOBILE["apps/mobile/<br/>Expo React Native"]
    end

    subgraph Packages
        ROOT --> SHARED["packages/shared/<br/>Types, hooks, utils, validators"]
        ROOT --> SUPA_PKG["packages/supabase/<br/>Supabase client wrapper"]
    end

    subgraph Functions
        ROOT --> FN["functions/api/<br/>Cloudflare Pages Functions"]
    end

    subgraph Web["apps/web/src/"]
        WEB --> PAGES["pages/ (20)"]
        WEB --> COMPONENTS["components/ (65+)"]
        WEB --> HOOKS["hooks/ (11)"]
        WEB --> STORES["stores/ (6)"]
        WEB --> LIB["lib/ (50+ modules)"]
    end

    subgraph Components
        COMPONENTS --> UI["ui/ — Button, Badge, Avatar, Spinner"]
        COMPONENTS --> AUTH["auth/ — AuthGuard, LoginForm"]
        COMPONENTS --> LAYOUT["layout/ — DashboardLayout, BottomNav"]
        COMPONENTS --> REVIEW_C["review/ — 20 components"]
        COMPONENTS --> SETTINGS["settings/ — 11 components"]
        COMPONENTS --> DOCS_C["documents/ — List, Detail, Template"]
        COMPONENTS --> FORMS["forms/ — Input, Select, Toggle"]
        COMPONENTS --> MODALS["modals/ — Delete, Send, Share"]
        COMPONENTS --> LANDING["landing/ — Hero, Features, CTA"]
    end
```

---

## Tech Stack

```mermaid
graph LR
    subgraph Frontend
        PREACT["Preact 10.27"]
        WOUTER["Wouter 3.9<br/>Router"]
        TW["Tailwind CSS v4"]
        GSAP["GSAP<br/>Animations"]
        ZUSTAND["Zustand 5.x<br/>UI State"]
        TANSTACK["TanStack Query 5.x<br/>Server State"]
        LUCIDE["Lucide React<br/>Icons"]
        SONNER["Sonner<br/>Toasts"]
    end

    subgraph Build
        VITE["Vite 7.3"]
        TS["TypeScript 5.9"]
        TURBO["Turborepo"]
        PNPM["pnpm 8.15"]
    end

    subgraph Backend
        SUPABASE["Supabase<br/>Auth + DB + Storage"]
        CF["Cloudflare Pages<br/>Hosting + Functions"]
    end

    subgraph External
        GEMINI["Google Gemini 2.0 Flash<br/>AI Document Parsing"]
        DEEPGRAM["Deepgram nova-2<br/>Speech-to-Text"]
        RESEND["Resend<br/>Email Delivery"]
    end
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant APP as App (Preact)
    participant SB as Supabase Auth
    participant EMAIL as Email Provider

    Note over APP: flowType: 'pkce'

    U->>APP: Enter email on /login
    APP->>SB: signInWithOtp(email)
    SB->>EMAIL: Send magic link
    EMAIL->>U: Click magic link

    U->>APP: Redirect to /auth/callback?code=xxx
    APP->>APP: Detect in-app browser (FB, IG, etc.)

    alt PKCE Flow (standard)
        APP->>SB: exchangeCodeForSession(code)
    else Implicit Flow (fallback)
        APP->>SB: setSession(access_token, refresh_token)
    end

    SB-->>APP: Session + User object
    APP->>APP: authStore.setSession(session)
    APP->>APP: authStore.setUser(user)
    APP->>U: Redirect to /dashboard

    Note over APP: AuthGuard wraps all /dashboard/* routes
    APP->>SB: getSession() on mount
    SB-->>APP: Session or null
    alt No session
        APP->>U: Redirect to /login
    else Valid session
        APP->>SB: onAuthStateChange listener
        APP->>U: Render protected content
    end
```

---

## Data Flow

```mermaid
flowchart TB
    subgraph UI["UI Layer"]
        PAGES_L["Pages"]
        COMPS["Components"]
    end

    subgraph State["State Layer"]
        ZS["Zustand Stores<br/>(authStore, appStateStore,<br/>themeStore, tutorialStore,<br/>toastStore, inputPrefsStore)"]
        TQ["TanStack Query<br/>(useDashboardData,<br/>useDocumentsData)"]
    end

    subgraph API["API Layer (lib/api/)"]
        AUTH_API["auth.ts"]
        DOCS_API["documents.ts"]
        CLIENTS_API["clients.ts"]
        REVIEWS_API["reviews.ts"]
        PRICING_API["pricing.ts"]
        USER_API["user.ts"]
        EXTERNAL_API["external.ts"]
        INFO_API["infoQuery.ts"]
    end

    subgraph Backend["Backend Services"]
        SB_AUTH["Supabase Auth"]
        SB_DB[("Supabase<br/>PostgreSQL")]
        CF_FN["Cloudflare<br/>Functions"]
    end

    subgraph External["External APIs"]
        GEMINI_E["Gemini 2.0 Flash"]
        DEEPGRAM_E["Deepgram"]
        RESEND_E["Resend"]
    end

    PAGES_L --> COMPS
    COMPS --> ZS
    COMPS --> TQ
    TQ --> DOCS_API
    TQ --> CLIENTS_API
    TQ --> REVIEWS_API
    COMPS --> AUTH_API
    COMPS --> PRICING_API
    COMPS --> USER_API
    COMPS --> EXTERNAL_API

    AUTH_API --> SB_AUTH
    DOCS_API --> SB_DB
    CLIENTS_API --> SB_DB
    REVIEWS_API --> SB_DB
    PRICING_API --> SB_DB
    USER_API --> SB_DB
    INFO_API --> SB_DB

    EXTERNAL_API --> CF_FN
    CF_FN --> GEMINI_E
    CF_FN --> DEEPGRAM_E
    CF_FN --> RESEND_E
```

---

## Component Hierarchy

```mermaid
graph TD
    APP["App.tsx<br/>QueryClientProvider + Router"]

    APP --> LANDING["/ LandingPage"]
    APP --> LOGIN["/login LoginPage"]
    APP --> CALLBACK["/auth/callback AuthCallback"]
    APP --> DOCVIEW["/view/:type/:id DocumentViewPage<br/>(lazy-loaded)"]
    APP --> GUARD["AuthGuard"]

    GUARD --> DL["DashboardLayout<br/>(BottomNav + Blobs + Toaster)"]

    DL --> DASH["/dashboard<br/>DashboardHome"]
    DL --> DOCSPAGE["/dashboard/documents<br/>DocumentList"]
    DL --> DOCDETAIL["/dashboard/documents/:id<br/>DocumentDetail"]
    DL --> REVIEWPAGE["/dashboard/review<br/>ReviewPage"]
    DL --> REVIEWSLIST["/dashboard/reviews<br/>ReviewsList"]
    DL --> SETTINGSHUB["/dashboard/settings<br/>SettingsHub"]

    SETTINGSHUB --> PROFILE["ProfileSettings"]
    SETTINGSHUB --> BUSINESS["BusinessSettings"]
    SETTINGSHUB --> LANGUAGE["LanguageSettings"]
    SETTINGSHUB --> PRICEBOOK["PriceBook"]
    SETTINGSHUB --> CLIENTBOOK["ClientBook"]
    SETTINGSHUB --> CLIENTDETAIL["ClientDetailView"]
    SETTINGSHUB --> NOTIFICATIONS["NotificationsSettings"]
    SETTINGSHUB --> SECURITY["SecuritySettings"]
    SETTINGSHUB --> FEEDBACK["FeedbackSettings"]

    LANDING --> NAVBAR["Navbar"]
    LANDING --> HERO["HeroSection<br/>(HeroHeadline + HeroPhone)"]
    LANDING --> FEATURES["FeaturesSection<br/>(FeatureCard x6)"]
    LANDING --> HOW["HowItWorksSection<br/>(StepCard x3)"]
    LANDING --> TESTIMONIALS["TestimonialsSection"]
    LANDING --> CTA["CTASection"]
    LANDING --> FOOTER["Footer"]

    REVIEWPAGE --> VOICEINPUT["VoiceInput<br/>(RecordButton + Transcript)"]
    REVIEWPAGE --> TRANSFORM["TransformReview<br/>(Client + LineItems + Totals)"]
    REVIEWPAGE --> QUERYFLOW["QueryResultsFlow"]
    REVIEWPAGE --> SENDFLOW["SendDocumentFlow"]
    REVIEWPAGE --> SHAREMODAL["ShareLinkModal"]
    REVIEWPAGE --> MERGEFLOW["MergeDocumentsFlow"]
    REVIEWPAGE --> CLONEFLOW["CloneDocumentFlow"]
    REVIEWPAGE --> DONESTATE["DoneState"]
```

---

## State Management

```mermaid
flowchart TD
    subgraph Zustand["Zustand Stores (Client State)"]
        direction TB
        AUTH_S["authStore<br/>session, user, isAuthenticated,<br/>userProfile"]
        APP_S["appStateStore<br/>isRecordingMode, isModalOpen,<br/>isSelectMode, processingTransition"]
        THEME_S["themeStore<br/>theme: light | dark | system"]
        TUTORIAL_S["tutorialStore<br/>currentStep, stepsCompleted,<br/>hintsShown, isActive"]
        TOAST_S["toastStore<br/>toasts: Toast[]<br/>success() error() info()"]
        INPUT_S["inputPreferencesStore<br/>mode: voice | text<br/>autoSubmitVoice, showTranscript"]
    end

    subgraph Persistence["LocalStorage Keys"]
        AUTH_P["mrblu-auth"]
        THEME_P["theme"]
        TUTORIAL_P["mrblu-tutorial"]
        INPUT_P["input-preferences"]
        LOCALE_P["locale"]
    end

    AUTH_S -.-> AUTH_P
    THEME_S -.-> THEME_P
    TUTORIAL_S -.-> TUTORIAL_P
    INPUT_S -.-> INPUT_P

    subgraph TanStack["TanStack Query (Server State)"]
        direction TB
        DASH_Q["useDashboardData<br/>key: ['dashboard', userId]<br/>recentDocs, stats, pendingReview"]
        DOCS_Q["useDocumentsData<br/>key: ['documents', userId]<br/>all documents + summaries"]
        REVIEW_Q["useQuery<br/>key: ['review-session', id]<br/>single review session"]
    end

    subgraph Config["Query Config"]
        STALE["staleTime: 60s"]
        RETRY["retry: 1"]
    end

    TanStack --> Config

    subgraph Lifecycle["Lifecycle Invalidation"]
        VIS["Tab becomes visible<br/>(after 30s hidden)"]
        PAGESHOW["pageshow event<br/>(bfcache restore)"]
        ONLINE["online event"]
    end

    Lifecycle -->|"invalidateQueries('*')"| TanStack
```

---

## API Routes

```mermaid
flowchart LR
    subgraph Client["Web App"]
        APP_C["Preact SPA"]
    end

    subgraph MW["Middleware (_middleware.ts)"]
        direction TB
        ERR["Error Handler"]
        JWT["JWT Auth Check<br/>(Bearer token → Supabase verify)"]
        PUBLIC["Public paths bypass:<br/>/api/health<br/>/api/documents/share"]
    end

    subgraph Functions["Cloudflare Pages Functions"]
        HEALTH["/api/health<br/>GET → status: ok"]
        PARSE["/api/ai/parse<br/>POST → parse voice transcript"]
        VTRANSCRIBE["/api/voice/transcribe<br/>POST → transcribe audio"]
        VTOKEN["/api/voice/token<br/>GET → Deepgram API key"]
        VPROCESS["/api/voice/process<br/>POST → legacy parser"]
        DSEND["/api/documents/send<br/>POST → email document"]
        DSHARE["/api/documents/share<br/>GET → public doc view"]
        FSUBMIT["/api/feedback/submit<br/>POST → save feedback"]
        FRESPOND["/api/feedback/respond<br/>POST → reply to feedback"]
        ESEND["/api/email/send<br/>POST → generic email"]
    end

    subgraph External["External APIs"]
        GEMINI_API["Gemini 2.0 Flash<br/>(AI parsing)"]
        DG_API["Deepgram nova-2<br/>(speech-to-text)"]
        RS_API["Resend<br/>(email delivery)"]
        SB_API["Supabase<br/>(DB + Auth)"]
    end

    APP_C --> MW
    MW --> Functions

    PARSE --> GEMINI_API
    PARSE --> SB_API
    VTRANSCRIBE --> DG_API
    VTOKEN --> DG_API
    DSEND --> RS_API
    DSEND --> SB_API
    DSHARE --> SB_API
    FSUBMIT --> SB_API
    FRESPOND --> RS_API
    FRESPOND --> SB_API
```

---

## Database Schema

```mermaid
erDiagram
    auth_users ||--o| profiles : "has profile"
    auth_users ||--o{ clients : "owns"
    auth_users ||--o{ documents : "creates"
    auth_users ||--o{ contracts : "creates"
    auth_users ||--o{ price_items : "defines"
    auth_users ||--o{ services : "defines"
    auth_users ||--o{ review_sessions : "initiates"
    auth_users ||--o{ sent_documents : "sends"
    auth_users ||--o{ error_logs : "triggers"
    auth_users ||--o{ admin_comments : "submits"
    clients ||--o{ documents : "receives"
    clients ||--o{ contracts : "signs"
    price_items ||--o{ price_aliases : "has aliases"

    auth_users {
        uuid id PK
        text email
    }

    profiles {
        uuid id PK "FK → auth.users"
        text full_name
        text business_name
        text phone
        text email
        text address
        text logo_url
        text license_number
        text tax_id
        text website
        timestamptz created_at
        timestamptz updated_at
    }

    clients {
        uuid id PK
        uuid user_id FK
        text name
        text email
        text phone
        text address
        text notes
        timestamptz created_at
    }

    documents {
        uuid id PK
        uuid user_id FK
        uuid client_id FK
        text document_type "invoice | estimate"
        text document_number "INV-2026-0001"
        text title
        jsonb line_items "array of items"
        numeric subtotal
        numeric tax_rate
        numeric tax_amount
        numeric total
        date due_date
        text notes
        text status "draft|sent|pending|paid|overdue|cancelled"
        text original_transcript
        text pdf_url
        timestamptz paid_at
        timestamptz created_at
    }

    contracts {
        uuid id PK
        uuid user_id FK
        uuid client_id FK
        text title
        jsonb content
        text status "draft|sent|signed|cancelled"
        text original_transcript
        timestamptz signed_at
        timestamptz created_at
    }

    sent_documents {
        uuid id PK
        uuid user_id FK
        uuid document_id
        text document_type "invoice|estimate|contract"
        text recipient_email
        text recipient_phone
        text delivery_method "email|sms|whatsapp"
        text share_token UK
        timestamptz sent_at
        timestamptz viewed_at
    }

    review_sessions {
        uuid id PK
        uuid user_id FK "FK → profiles"
        text status "pending|in_progress|completed|cancelled"
        text intent_type "document_action|information_query|document_clone|document_merge|document_send|document_transform"
        text original_transcript
        text audio_url
        jsonb parsed_data
        jsonb actions
        jsonb query_data
        jsonb query_result
        jsonb confidence
        text summary
        uuid created_document_id
        text created_document_type
        uuid source_document_id
        text source_document_type
        timestamptz completed_at
    }

    price_items {
        uuid id PK
        uuid user_id FK
        text name
        text description
        text category "material|labor|service|tools|equipment|rental|permit|disposal|other"
        numeric unit_price
        text unit "each, sqft, hour, etc."
        text currency "USD"
        numeric min_price
        numeric max_price
        int times_used
        text source "manual|voice|import"
        tsvector search_vector "generated: name + description"
        timestamptz last_used_at
    }

    price_aliases {
        uuid id PK
        uuid price_item_id FK
        text alias
    }

    services {
        uuid id PK
        uuid user_id FK
        text name
        text description
        jsonb items "bundled line items"
        int times_used
        timestamptz last_used_at
    }

    error_logs {
        uuid id PK
        text severity "info|warn|error|critical"
        text error_type
        text message
        text stack
        uuid user_id FK
        text request_path
        text request_method
        int status_code
        jsonb metadata
        boolean resolved
    }

    admin_comments {
        uuid id PK
        uuid user_id FK
        text comment
        text category "general|bug|feature|complaint|praise"
        text page_context
        timestamptz created_at
    }
```

---

## Voice-to-Invoice Pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant MIC as Microphone
    participant WS as Deepgram WebSocket
    participant UI as ReviewPage
    participant CF as /api/ai/parse
    participant AI as Gemini 2.0 Flash
    participant DB as Supabase DB

    U->>MIC: Press record button
    MIC->>WS: Stream audio chunks (WebM/OGG)
    WS-->>UI: Real-time transcript updates

    U->>MIC: Stop recording
    UI->>UI: Final transcript ready

    UI->>CF: POST { transcription }
    CF->>DB: Fetch user's price_items (rate context)
    CF->>AI: Parse transcript with price book context
    AI-->>CF: Structured response
    Note over AI: { intentType, documentType,<br/>client, items[], total,<br/>taxRate, dueDate, confidence }
    CF-->>UI: ParsedData

    alt Intent: document_action
        UI->>UI: Show TransformReview
        UI->>UI: User reviews client, line items, totals
        U->>UI: Click "Save"
        UI->>DB: lookupClient(name) → fuzzy match
        alt Client conflict
            UI->>U: Show merge modal
            U->>UI: Choose merge or create new
        end
        UI->>DB: INSERT document + client
        UI->>DB: savePricing(items) → update price_items
        UI->>DB: updateReviewSession(status: completed)
    else Intent: information_query
        UI->>UI: Show QueryResultsFlow
        UI->>DB: executeInfoQuery(queryData)
        DB-->>UI: Documents matching query
    else Intent: document_clone
        UI->>DB: Fetch source document
        UI->>UI: Pre-fill form with cloned data
    else Intent: document_send
        UI->>UI: Show SendDocumentFlow
        UI->>CF: POST /api/documents/send
    end
```

---

## Deployment Architecture

```mermaid
flowchart TD
    subgraph Dev["Development"]
        LOCAL["localhost:3000<br/>Vite dev server"]
        WRANGLER["localhost:8788<br/>Wrangler (functions)"]
        LOCAL -->|"/api proxy"| WRANGLER
    end

    subgraph Cloudflare["Cloudflare"]
        DNS["DNS<br/>mr-blu.com"]
        PAGES["Cloudflare Pages<br/>Static SPA hosting"]
        WORKERS["Pages Functions<br/>11 serverless endpoints"]
        DNS --> PAGES
        PAGES --> WORKERS
    end

    subgraph Supabase["Supabase (us-east-2)"]
        SB_AUTH["Auth<br/>(PKCE + OTP)"]
        SB_DB["PostgreSQL 17<br/>(11 tables, RLS enabled)"]
        SB_RT["Realtime<br/>(subscriptions)"]
    end

    subgraph External["External Services"]
        GEM["Google Gemini<br/>AI Document Parsing"]
        DG["Deepgram<br/>Speech-to-Text"]
        RS["Resend<br/>Transactional Email"]
    end

    PAGES -->|"supabase-js"| SB_AUTH
    PAGES -->|"supabase-js"| SB_DB
    WORKERS -->|"REST"| GEM
    WORKERS -->|"REST"| DG
    WORKERS -->|"REST"| RS
    WORKERS -->|"service_role"| SB_DB

    subgraph Deploy["Deploy Pipeline"]
        BUILD["vite build<br/>(apps/web/dist)"]
        DEPLOY_CMD["wrangler pages deploy<br/>--project-name mr-blu"]
        BUILD --> DEPLOY_CMD
        DEPLOY_CMD --> PAGES
    end
```

---

## Feature Map

```mermaid
mindmap
    root((Mr. Blu))
        Authentication
            Magic Link (OTP)
            PKCE OAuth Flow
            In-app Browser Detection
            Session Persistence
            iOS Safari Storage Adapter
        Voice Input
            Deepgram WebSocket (nova-2)
            Real-time Transcription
            Noise Detection
            Auto-reconnect
            WebM + OGG MIME Support
        AI Parsing
            Gemini 2.0 Flash
            Intent Detection
                document_action
                information_query
                document_clone
                document_send
                document_transform
            Price Book Context Matching
            Spoken Number Conversion
        Documents
            Invoices + Estimates + Contracts
            Auto-numbering (INV-YYYY-NNNN)
            Line Items with Tax Calculation
            PDF Generation (html2canvas + jsPDF)
            Status Tracking (draft→sent→paid)
        Delivery
            Email via Resend
            Public Share Links
            View Tracking
            Confirmation Emails
        Clients
            CRUD + Fuzzy Search
            Merge Conflict Resolution
            Document History per Client
            Phonetic Matching
        Price Book
            Material + Labor Pricing
            Usage Tracking
            Full-text Search (tsvector)
            Voice-sourced Auto-save
        Dashboard
            Stats (total invoiced, paid, pending)
            Recent Documents
            Pending Draft Resume
            Dismiss Draft
        Settings
            Profile + Business Info
            Language (en, es)
            Notifications
            Security
            Feedback Submission
        UI/UX
            Glass Morphism Design
            GSAP Scroll Animations
            Onboarding Tutorial
            Swipeable Cards
            Bottom Navigation
            Toast Notifications
            Skeleton Loading States
```

---

## User Journey

```mermaid
journey
    title Voice-to-Invoice Flow
    section Sign In
        Open app: 5: User
        Enter email: 3: User
        Click magic link: 4: User
        Land on dashboard: 5: User
    section Create Document
        Tap record button: 5: User
        Speak invoice details: 4: User
        AI parses transcript: 5: System
        Review parsed data: 4: User
        Edit line items if needed: 3: User
        Save document: 5: User
    section Send Document
        Choose delivery method: 4: User
        Enter recipient email: 3: User
        Send invoice: 5: User
        Client views via share link: 4: Client
    section Get Paid
        Check dashboard stats: 5: User
        Mark invoice as paid: 5: User
```

---

## Routing Map

```mermaid
graph LR
    subgraph Public
        SLASH["/ Landing"]
        LOG["/login"]
        AUTH_CB["/auth/callback"]
        VIEW["/view/:type/:id<br/>Shared Document"]
        PRIVACY["/privacy"]
        TERMS["/terms"]
        OFFLINE["/offline"]
    end

    subgraph Protected["Protected (AuthGuard)"]
        DASH["/dashboard"]
        DDOCS["/dashboard/documents"]
        DDOC_ID["/dashboard/documents/:id"]
        DREV["/dashboard/review"]
        DREVS["/dashboard/reviews"]
        DSET["/dashboard/settings"]
        DPROF["/dashboard/settings/profile"]
        DBUS["/dashboard/settings/business"]
        DLANG["/dashboard/settings/language"]
        DPB["/dashboard/settings/price-book"]
        DNOT["/dashboard/settings/notifications"]
        DSEC["/dashboard/settings/security"]
        DFB["/dashboard/settings/feedback"]
        DCL["/dashboard/settings/clients"]
        DCL_ID["/dashboard/settings/clients/:id"]
    end

    LOG -->|"success"| AUTH_CB
    AUTH_CB -->|"redirect"| DASH

    DASH --- DDOCS
    DASH --- DREV
    DASH --- DREVS
    DASH --- DSET
    DDOCS --- DDOC_ID
    DSET --- DPROF
    DSET --- DBUS
    DSET --- DLANG
    DSET --- DPB
    DSET --- DNOT
    DSET --- DSEC
    DSET --- DFB
    DSET --- DCL
    DCL --- DCL_ID
```

---

## File Reference

### Directories

| Directory | Purpose |
|-----------|---------|
| `apps/web/src/pages/` | Route page components (20 files) |
| `apps/web/src/components/ui/` | Reusable UI primitives |
| `apps/web/src/components/auth/` | Authentication guards & forms |
| `apps/web/src/components/layout/` | Dashboard layout, bottom nav |
| `apps/web/src/components/review/` | Voice review workflow (20 components) |
| `apps/web/src/components/settings/` | Settings sub-pages (11 components) |
| `apps/web/src/components/documents/` | Document list, detail, template |
| `apps/web/src/components/landing/` | Marketing landing page sections |
| `apps/web/src/components/forms/` | Form input components |
| `apps/web/src/components/modals/` | Modal dialogs |
| `apps/web/src/hooks/` | Custom hooks (dashboard, documents, voice, review) |
| `apps/web/src/stores/` | Zustand stores (6 stores) |
| `apps/web/src/lib/api/` | API layer (8 domain modules) |
| `apps/web/src/lib/supabase/` | Supabase client config |
| `apps/web/src/lib/i18n/` | Internationalization (en, es) |
| `apps/web/src/lib/parsing/` | Document parsing logic |
| `apps/web/src/lib/templates/` | Document template rendering |
| `apps/web/src/lib/tutorial/` | Onboarding tutorial config |
| `functions/api/` | Cloudflare Pages Functions (11 endpoints) |
| `packages/shared/` | Shared types, hooks, utils, validators |
| `packages/supabase/` | Supabase client singleton |

### Key Files

| File | Purpose |
|------|---------|
| `apps/web/src/main.tsx` | App entry point |
| `apps/web/src/app.tsx` | Router, QueryClient, lifecycle hooks |
| `apps/web/src/lib/supabase/client.ts` | Supabase init (PKCE, custom storage) |
| `apps/web/src/stores/authStore.ts` | Auth session + user state |
| `apps/web/src/hooks/useVoiceRecording.ts` | Deepgram WebSocket voice input |
| `apps/web/src/lib/api/documents.ts` | Document CRUD, save, send, share, PDF |
| `apps/web/src/lib/api/external.ts` | AI parse, Deepgram token, email send |
| `apps/web/src/lib/api/infoQuery.ts` | Natural language document queries |
| `apps/web/src/lib/i18n/translations.ts` | All translations (~1950 lines) |
| `functions/api/ai/parse.ts` | Gemini AI document parser |
| `functions/api/documents/send.ts` | Email document via Resend |
| `functions/api/_middleware.ts` | JWT auth + error handling |
| `apps/web/wrangler.toml` | Cloudflare deployment config |
| `apps/web/vite.config.ts` | Vite build config with Preact aliases |

### Environment Variables

| Variable | Service | Used In |
|----------|---------|---------|
| `SUPABASE_URL` | Supabase | Client + Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Functions (server-side) |
| `SUPABASE_ANON_KEY` | Supabase | Client (browser) |
| `GEMINI_API_KEY` | Google AI | `/api/ai/parse` |
| `DEEPGRAM_API_KEY` | Deepgram | `/api/voice/token`, `/api/voice/transcribe` |
| `RESEND_API_KEY` | Resend | `/api/documents/send`, `/api/feedback/respond` |
| `EMAIL_FROM_DOMAIN` | Resend | Email sender domain |

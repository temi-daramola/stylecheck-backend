# StyleCheck backend

Node.js + Express API for StyleCheck: supervisors upload a student `.docx` and get an AI compliance report against their institution's style manual.

Architecture rules live in [`guidelines/`](guidelines/01-Master-Index/01-INDEX.md) (start at the index).

## Requirements
- Node 22+
- MongoDB (local for development, Atlas for hosting)
- Python 3 with `python-docx` (`pip install python-docx`). Used to read a document's resolved formatting.
- Docker is optional: the `Dockerfile` bundles Node and Python for deployment.

## Setup
```bash
npm install
cp .env.example .env.development   # then fill in the values
npm run dev
```

### Environment variables
| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Local MongoDB in development |
| `FRONTEND_URL` | yes | Allowed CORS origin and the base of password-reset links |
| `JWT_SECRET` | yes | Long random string, different per stage |
| `GEMINI_API_KEY` | yes | Google AI Studio |
| `BREVO_API_KEY` | yes | Brevo transactional email |
| `BREVO_SENDER_EMAIL` | yes | Must be a sender verified in Brevo |
| `GEMINI_MODEL` | no | Default `gemini-2.0-flash-lite`; confirm it is current |
| `BREVO_SENDER_NAME`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_DAYS`, `PORT`, `LOG_LEVEL`, `MAX_DOC_SIZE_MB`, `MAX_MANUAL_TEXT_LENGTH`, `UPLOAD_DIR`, `PYTHON_BIN` | no | See `src/common/constants/env.constants.js` |
| `LOGTAIL_SOURCE_TOKEN` | no | Enables the hosted log destination (Better Stack) |

Staging and production take their values from the host's dashboard, not from a file.

## Creating supervisors
There is no public signup. An administrator creates accounts:
```bash
npm run create-supervisor -- supervisor@university.edu "Prof. Jane Doe" "a-strong-password"
```

## Scripts
- `npm run dev` / `npm start`: run the API
- `npm test`: unit tests (scoring, result alignment, rule extraction, prompts)

## API
All responses use `{ status, message, data, code, requestId }`.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password` |
| Supervisor | `GET /api/supervisors/me`, `PATCH /api/supervisors/me/preferences` |
| Style manual | `GET /api/manuals/me`, `POST /api/manuals` (JSON text extracted in the browser) |
| Checks | `POST /api/checks` (multipart `document`), `GET /api/checks`, `GET /api/checks/:id`, `GET /api/checks/:id/pdf`, `POST /api/checks/:id/share` |

Sessions use a short-lived access token (Bearer) plus a rotating refresh token in an httpOnly cookie. This needs the frontend and backend on the same site (e.g. `app.` and `api.` under one domain).

## Files are never stored
Style manual text is extracted in the browser. Student documents are written to `uploads/` only while a check runs and are deleted afterwards (success, failure, or client disconnect). PDFs are generated on demand from stored results.

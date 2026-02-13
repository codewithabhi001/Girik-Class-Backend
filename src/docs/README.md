# Girik Marine OpenAPI Documentation

Production-grade OpenAPI 3.0 documentation for the Girik Marine Backend API.

## Structure

```
src/docs/
├── base.yaml          # OpenAPI info, servers, security, tags
├── build-openapi.js   # Builds & filters spec by role
├── schemas/           # Reusable component schemas
│   ├── common.yaml    # ErrorResponse, SuccessWrapper, UUID, etc.
│   ├── auth.yaml      # LoginRequest, UserSummary, etc.
│   ├── job.yaml       # JobCreateRequest, JobResponse, etc.
│   ├── vessel.yaml    # VesselCreateRequest, VesselResponse, etc.
│   ├── certificate.yaml
│   ├── payment.yaml
│   ├── dashboard.yaml
│   └── client.yaml
├── paths/             # API path definitions
│   ├── auth.yaml
│   ├── jobs.yaml
│   ├── vessels.yaml
│   ├── certificates.yaml
│   ├── payments.yaml
│   ├── dashboard.yaml
│   ├── clients.yaml
│   └── health.yaml
└── roles/             # Role metadata
    ├── admin.yaml
    ├── gm.yaml
    ├── tm.yaml
    ├── surveyor.yaml
    └── client.yaml
```

## Accessing the Docs

| URL | Description |
|-----|-------------|
| `/api-docs` | Full spec (all endpoints) |
| `/api-docs/admin` | ADMIN role view only |
| `/api-docs/gm` | GM role view only |
| `/api-docs/tm` | TM role view only |
| `/api-docs/surveyor` | SURVEYOR role view only |
| `/api-docs/client` | CLIENT role view only |
| `/api-docs/spec.json?role=ADMIN` | Raw JSON spec (filtered) |

## Try it out

1. Open your role-specific Swagger UI (e.g. `/api-docs/client`)
2. Click **Authorize**
3. Login via `/api/v1/auth/login` to get a token
4. Enter: `Bearer <your-token>`
5. Execute any endpoint with "Try it out"

## Adding New Endpoints

1. Add schema to `schemas/*.yaml` if needed (use `$ref` for reuse)
2. Add path to `paths/*.yaml` with `x-roles: [ADMIN, GM, ...]`
3. Include `requestBody`, `responses`, and `example` for each operation
4. Restart server (spec is cached)

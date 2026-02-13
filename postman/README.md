# Postman collection – Girik API (role-based)

This folder contains a **role-wise Postman collection** aligned with Swagger role views.

## File

- **`Girik-API-Role-Based.postman_collection.json`** – Import this into Postman.

## How it’s generated

From the same OpenAPI spec used for Swagger, with `x-roles` per operation:

```bash
npm run postman:build
# or
node scripts/build-postman-collection.js
```

Output is written to `postman/Girik-API-Role-Based.postman_collection.json`.

## Collection structure

| Folder | Purpose |
|--------|--------|
| **0. Auth & Public** | Login, refresh token, forgot/reset password, public certificate verify. No auth. |
| **ADMIN** | Endpoints where `x-roles` includes `ADMIN`. |
| **GM** | Endpoints for General Manager. |
| **TM** | Endpoints for Technical Manager. |
| **SURVEYOR** | Endpoints for Surveyor (jobs, surveys, checklists, etc.). |
| **CLIENT** | Endpoints for Client. |

## Using in Postman

1. **Import**  
   Postman → Import → Upload `Girik-API-Role-Based.postman_collection.json`.

2. **Variables** (collection variables):
   - **baseUrl**: `http://localhost:3000` (or your API base URL).
   - **token**: Leave empty; set after login.

3. **Get a token**  
   Run **0. Auth & Public → Login** with a valid user. From the response, copy the `token` value into the collection variable **token**.

4. **Call role-specific APIs**  
   Open the folder for the role (e.g. **SURVEYOR**) and send requests. Path variables (e.g. `id`, `jobId`) can be set in the request URL or in the collection/environment.

## Matching Swagger

- **Swagger (role view):**  
  `http://localhost:3000/api-docs/admin` (or `/gm`, `/tm`, `/surveyor`, `/client`).

- **Postman:**  
  Use the folder with the same role name (ADMIN, GM, TM, SURVEYOR, CLIENT).

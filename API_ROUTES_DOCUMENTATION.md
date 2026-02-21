# API Routes Documentation

This document outlines each route, its purpose, request schema, and response structure, organized by module.

## 📦 Module: ACTIVITY-REQUESTS

### POST `/api/v1/activity-requests`

**Summary:** Create activity request

**Allowed Roles:** `CLIENT, ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "activity_type": {
      "type": "string"
    },
    "requested_date": {
      "type": "string",
      "format": "date"
    },
    "notes": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "activity_type": "SURVEY",
  "requested_date": "2026-03-20",
  "notes": "Prefer morning slot"
}
```
</details>

**Responses:**

- **201**: Request created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/activity-requests`

**Summary:** Get activity requests

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO`

**Responses:**

- **200**: List of requests

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/activity-requests/{id}`

**Summary:** Get request by ID

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Request details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/activity-requests/{id}/status`

**Summary:** Update request status

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "COMPLETED"
      ]
    },
    "remarks": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "APPROVED",
  "remarks": "Surveyor assigned"
}
```
</details>

**Responses:**

- **200**: Status updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: APPROVALS

### POST `/api/v1/approvals`

**Summary:** Create approval

**Allowed Roles:** `ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "step": {
      "type": "string"
    },
    "action": {
      "type": "string",
      "enum": [
        "APPROVE",
        "REJECT"
      ]
    },
    "remarks": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "step": "GM_APPROVAL",
  "action": "APPROVE",
  "remarks": "Approved for survey"
}
```
</details>

**Responses:**

- **201**: Approval created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/approvals/{id}/step`

**Summary:** Update approval step

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": [
        "APPROVE",
        "REJECT"
      ]
    },
    "remarks": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "action": "APPROVE",
  "remarks": "Step completed"
}
```
</details>

**Responses:**

- **200**: Step updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: AUTH

### POST `/api/v1/auth/login`

**Summary:** Login

**Description:** Authenticate with email and password. Returns user, **accessToken** (short-lived, for API calls), and **refreshToken** (long-lived, for getting new access tokens).
Use **accessToken** in header: `Authorization: Bearer &lt;accessToken&gt;`. Store tokens securely.


**Allowed Roles:** `PUBLIC`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "email",
    "password"
  ],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "example": "admin@girik.com"
    },
    "password": {
      "type": "string",
      "format": "password",
      "example": "SecurePass123!"
    }
  },
  "example": {
    "email": "admin@girik.com",
    "password": "SecurePass123!"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "email": "admin@girik.com",
  "password": "Password@123"
}
```
</details>

**Responses:**

- **200**: Login successful

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "description": "Returns user and both tokens. Use accessToken for API calls (Bearer header); use refreshToken only at POST /auth/refresh-token. Store tokens securely.",
    "properties": {
      "user": {
        "$ref": "#/components/schemas/UserSummary"
      },
      "accessToken": {
        "type": "string",
        "description": "Short-lived JWT for API auth. Send in header: Authorization Bearer &lt;accessToken&gt;",
        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      },
      "refreshToken": {
        "type": "string",
        "description": "Long-lived JWT; use only to get new access token via POST /auth/refresh-token",
        "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    },
    "example": {
      "user": {
        "id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
        "name": "John Doe",
        "email": "admin@girik.com",
        "role": "CLIENT"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Invalid credentials

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/auth/logout`

**Summary:** Logout

**Description:** Invalidate current session. Clears tokens; response includes accessToken and refreshToken as null.

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: Logged out successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "example": "Logged out successfully"
      },
      "accessToken": {
        "type": "null",
        "description": "Always null after logout"
      },
      "refreshToken": {
        "type": "null",
        "description": "Always null after logout"
      }
    }
  }
  ```
  </details>

- **401**: Not authenticated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/auth/refresh-token`

**Summary:** Refresh token

**Description:** Get new **accessToken** and **refreshToken** using a valid refresh token. Send refresh token in body (`refreshToken` or `token`) or in cookie. Response returns both tokens.


**Allowed Roles:** `PUBLIC`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "description": "Send refresh token in body (refreshToken or token). Cookie refreshToken is also accepted.",
  "properties": {
    "refreshToken": {
      "type": "string",
      "description": "Refresh token from login/register or previous refresh"
    },
    "token": {
      "type": "string",
      "description": "Alias for refreshToken (legacy)"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
</details>

**Responses:**

- **200**: Tokens refreshed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "user": {
        "$ref": "#/components/schemas/UserSummary"
      },
      "accessToken": {
        "type": "string",
        "description": "New short-lived access token for API calls"
      },
      "refreshToken": {
        "type": "string",
        "description": "New long-lived refresh token; store and use for next refresh"
      }
    }
  }
  ```
  </details>

- **401**: Invalid or expired refresh token

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/auth/forgot-password`

**Summary:** Forgot password

**Description:** Request password reset email.

**Allowed Roles:** `PUBLIC`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "email"
  ],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "example": "user@girik.com"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "email": "user@girik.com"
}
```
</details>

**Responses:**

- **200**: Password reset email sent

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "example": "Password reset email sent"
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/auth/reset-password`

**Summary:** Reset password

**Description:** Reset password using token from email.

**Allowed Roles:** `PUBLIC`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "token",
    "newPassword"
  ],
  "properties": {
    "token": {
      "type": "string",
      "description": "Reset token from email"
    },
    "newPassword": {
      "type": "string",
      "format": "password",
      "minLength": 6
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```
</details>

**Responses:**

- **200**: Password reset successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "message": {
        "type": "string",
        "example": "Password reset successfully"
      }
    }
  }
  ```
  </details>

- **400**: Invalid or expired token

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: CERTIFICATES

### GET `/api/v1/certificates/verify/{number}`

**Summary:** Verify certificate (public)

**Description:** Public verification of certificate by number. No auth required.

**Allowed Roles:** `PUBLIC`

**Parameters:**
- `number` (path):  **Required**

**Responses:**

- **200**: Certificate verified

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "valid": {
        "type": "boolean"
      },
      "certificate": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>

- **404**: Certificate not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates`

**Summary:** List certificates

**Description:** List certificates with strict RBAC and ownership filtering.
**Access:**
- **ADMIN / GM / TM / TO:** All certificates.
- **SURVEYOR:** Only certificates for vessels in jobs assigned to them.
- **CLIENT:** Only certificates for their own company vessels.


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `page` (query):  Optional
- `limit` (query):  Optional

**Responses:**

- **200**: List of certificates

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/CertificateResponse"
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/certificates`

**Summary:** Generate certificate

**Description:** Generate a new certificate for a completed job. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "job_id"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid",
      "example": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f"
    },
    "validity_years": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5,
      "default": 1
    }
  },
  "example": {
    "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
    "validity_years": 1
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "validity_years": 1
}
```
</details>

**Responses:**

- **201**: Certificate generated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Certificate generated successfully"
      },
      "data": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/types`

**Summary:** List certificate types (minimal)

**Description:** Returns a lightweight list of all active certificate types.
**Does NOT include `required_documents`** — use `GET /types/:id` to fetch
the full detail with required documents for a specific type.

Pass `?include_inactive=true` (ADMIN / GM only) to also see inactive types.

**Roles:** CLIENT, ADMIN, GM, TM, TO, SURVEYOR


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `include_inactive` (query): Include INACTIVE types (ADMIN / GM only) Optional

**Responses:**

- **200**: Minimal list of certificate types

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "name": {
              "type": "string",
              "example": "Class Certificate"
            },
            "issuing_authority": {
              "type": "string",
              "enum": [
                "CLASS",
                "FLAG"
              ]
            },
            "validity_years": {
              "type": "integer",
              "example": 5
            },
            "status": {
              "type": "string",
              "enum": [
                "ACTIVE",
                "INACTIVE"
              ]
            },
            "requires_survey": {
              "type": "boolean",
              "example": true
            }
          }
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/certificates/types`

**Summary:** Create certificate type

**Description:** Create a new certificate type with optional required documents. ADMIN only.

**Allowed Roles:** `ADMIN`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "name",
    "issuing_authority",
    "validity_years"
  ],
  "properties": {
    "name": {
      "type": "string"
    },
    "issuing_authority": {
      "type": "string",
      "enum": [
        "CLASS",
        "FLAG"
      ]
    },
    "validity_years": {
      "type": "integer"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE"
      ]
    },
    "description": {
      "type": "string"
    },
    "requires_survey": {
      "type": "boolean",
      "default": true
    },
    "required_documents": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "document_name": {
            "type": "string"
          },
          "is_mandatory": {
            "type": "boolean"
          }
        }
      }
    }
  },
  "example": {
    "name": "Safety Construction",
    "issuing_authority": "CLASS",
    "validity_years": 5,
    "status": "ACTIVE",
    "description": "Main classification certificate for construction",
    "requires_survey": true,
    "required_documents": [
      {
        "document_name": "Bill of Sale",
        "is_mandatory": true
      },
      {
        "document_name": "Builder Certificate",
        "is_mandatory": false
      }
    ]
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "Safety Construction",
  "issuing_authority": "CLASS",
  "validity_years": 5,
  "status": "ACTIVE",
  "description": "Main classification certificate for construction",
  "requires_survey": true,
  "required_documents": [
    {
      "document_name": "Bill of Sale",
      "is_mandatory": true
    },
    {
      "document_name": "Builder Certificate",
      "is_mandatory": false
    }
  ]
}
```
</details>

**Responses:**

- **201**: Certificate type created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Certificate type created"
      },
      "data": {
        "$ref": "#/components/schemas/CertificateTypeDetailResponse"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **409**: A certificate type with this name already exists

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/types/{id}`

**Summary:** Get certificate type detail (with required documents)

**Description:** Returns the **full detail** of a single certificate type, including:
- All metadata fields (`description`, `requires_survey`, etc.)
- The complete list of `required_documents` with their `is_mandatory` flag

This is the endpoint to call **before creating a job** to know which
documents must be uploaded.

**Roles:** CLIENT, ADMIN, GM, TM, TO, SURVEYOR


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path): Certificate type UUID **Required**

**Responses:**

- **200**: Certificate type detail with required documents

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/CertificateTypeDetailResponse"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Certificate type not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/certificates/types/{id}`

**Summary:** Update certificate type

**Description:** Update an existing certificate type and its required documents. ADMIN or TM only.

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "issuing_authority": {
      "type": "string",
      "enum": [
        "CLASS",
        "FLAG"
      ]
    },
    "validity_years": {
      "type": "integer"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE"
      ]
    },
    "description": {
      "type": "string"
    },
    "requires_survey": {
      "type": "boolean"
    },
    "required_documents": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "document_name": {
            "type": "string"
          },
          "is_mandatory": {
            "type": "boolean"
          }
        }
      }
    }
  },
  "example": {
    "name": "Safety Construction (Updated)",
    "issuing_authority": "CLASS",
    "validity_years": 5,
    "status": "ACTIVE",
    "description": "Updated classification certificate for construction",
    "requires_survey": true,
    "required_documents": [
      {
        "document_name": "Bill of Sale",
        "is_mandatory": true
      },
      {
        "document_name": "Builder Certificate",
        "is_mandatory": false
      },
      {
        "document_name": "Previous Registry Certificate",
        "is_mandatory": true
      }
    ]
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "Safety Construction (Updated)",
  "issuing_authority": "CLASS",
  "validity_years": 5,
  "status": "ACTIVE",
  "description": "Updated classification certificate for construction",
  "requires_survey": true,
  "required_documents": [
    {
      "document_name": "Bill of Sale",
      "is_mandatory": true
    },
    {
      "document_name": "Builder Certificate",
      "is_mandatory": false
    },
    {
      "document_name": "Previous Registry Certificate",
      "is_mandatory": true
    }
  ]
}
```
</details>

**Responses:**

- **200**: Certificate type updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/CertificateTypeDetailResponse"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Certificate type not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/certificates/bulk-renew`

**Summary:** Bulk renew certificates

**Description:** Renew multiple certificates in one operation. ADMIN, TM only.

**Allowed Roles:** `ADMIN, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "certificate_ids"
  ],
  "properties": {
    "certificate_ids": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "uuid"
      }
    },
    "validity_years": {
      "type": "integer",
      "default": 1
    },
    "reason": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "certificate_ids": [
    "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f"
  ]
}
```
</details>

**Responses:**

- **200**: Bulk renewal completed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/expiring`

**Summary:** Get expiring certificates

**Description:** Get certificates expiring within a date range. ADMIN, GM, TM, TO, CLIENT.

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO`

**Parameters:**
- `days` (query):  Optional

**Responses:**

- **200**: Expiring certificates

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/CertificateResponse"
        }
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/vessel/{vesselId}`

**Summary:** Get certificates by vessel

**Description:** Get all certificates for a specific vessel. Scope restricted (SURVEYOR only assigned, CLIENT only owned).

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `vesselId` (path):  **Required**

**Responses:**

- **200**: Vessel certificates

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/CertificateResponse"
        }
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/{id}`

**Summary:** Get certificate by ID

**Description:** Get certificate details by ID. Same RBAC as list: ADMIN/GM/TM/TO see all; SURVEYOR only assigned jobs' vessels; CLIENT only own company. Returns 403 if certificate exists but user has no access.


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Certificate details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden - certificate exists but user has no access

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Certificate not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/{id}/download`

**Summary:** Download certificate PDF

**Description:** Redirects to the certificate PDF URL for download. If the certificate has a stored PDF (pdf_file_url), returns 302 redirect to that URL so the browser can open or download the file.
CLIENT can only download certificates for their vessels.


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path): Certificate ID **Required**

**Responses:**

- **302**: Redirect to certificate PDF URL

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **404**: Certificate not found or PDF not available

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Certificate PDF is not available for download yet."
      }
    }
  }
  ```
  </details>


---

### PUT `/api/v1/certificates/{id}/suspend`

**Summary:** Suspend certificate

**Description:** Suspend a certificate. ADMIN, TM only.

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Administrative suspension"
    }
  },
  "example": {
    "reason": "Administrative suspension"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Administrative suspension"
}
```
</details>

**Responses:**

- **200**: Certificate suspended

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string"
      },
      "data": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/certificates/{id}/revoke`

**Summary:** Revoke certificate

**Description:** Revoke a certificate. ADMIN, TM only.

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Administrative suspension"
    }
  },
  "example": {
    "reason": "Administrative suspension"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Vessel sold"
}
```
</details>

**Responses:**

- **200**: Certificate revoked

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string"
      },
      "data": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>


---

### PUT `/api/v1/certificates/{id}/restore`

**Summary:** Restore certificate

**Description:** Restore a suspended certificate. ADMIN, TM only.

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Administrative suspension"
    }
  },
  "example": {
    "reason": "Administrative suspension"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Issue resolved"
}
```
</details>

**Responses:**

- **200**: Certificate restored

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string"
      },
      "data": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>


---

### PUT `/api/v1/certificates/{id}/renew`

**Summary:** Renew certificate

**Description:** Renew an expiring certificate. ADMIN, TM only.

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "validity_years",
    "reason"
  ],
  "properties": {
    "validity_years": {
      "type": "integer",
      "minimum": 1,
      "maximum": 5
    },
    "reason": {
      "type": "string"
    }
  },
  "example": {
    "validity_years": 1,
    "reason": "Standard renewal"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "validity_years": 1,
  "reason": "Standard renewal"
}
```
</details>

**Responses:**

- **200**: Certificate renewed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string"
      },
      "data": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/certificates/{id}/reissue`

**Summary:** Reissue certificate

**Description:** Reissue a certificate (e.g. after loss). ADMIN, TM only.

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Administrative suspension"
    }
  },
  "example": {
    "reason": "Administrative suspension"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Original lost"
}
```
</details>

**Responses:**

- **200**: Certificate reissued

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string"
      },
      "data": {
        "$ref": "#/components/schemas/CertificateResponse"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/certificates/{id}/transfer`

**Summary:** Transfer certificate

**Description:** Transfer certificate ownership/association. ADMIN, GM only.

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Administrative suspension"
    }
  },
  "example": {
    "reason": "Administrative suspension"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Administrative suspension"
}
```
</details>

**Responses:**

- **200**: Certificate transferred

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/certificates/{id}/extend`

**Summary:** Extend certificate

**Description:** Extend certificate validity. ADMIN, GM only.

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Administrative suspension"
    }
  },
  "example": {
    "reason": "Administrative suspension"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Administrative suspension"
}
```
</details>

**Responses:**

- **200**: Certificate extended

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/certificates/{id}/downgrade`

**Summary:** Downgrade certificate

**Description:** Downgrade certificate classification/type. ADMIN, GM only.

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Administrative suspension"
    }
  },
  "example": {
    "reason": "Administrative suspension"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Administrative suspension"
}
```
</details>

**Responses:**

- **200**: Certificate downgraded

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/{id}/preview`

**Summary:** Preview certificate

**Description:** Get certificate preview/PDF. ADMIN, GM, TM, TO, SURVEYOR, CLIENT.

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Certificate preview

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/certificates/{id}/sign`

**Summary:** Sign certificate

**Description:** Digitally sign a certificate. ADMIN, GM only.

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Certificate signed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificates/{id}/signature`

**Summary:** Get certificate signature

**Description:** Get signature details for a certificate.

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Signature details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object"
  }
  ```
  </details>


---

### GET `/api/v1/certificates/{id}/history`

**Summary:** Get certificate history

**Description:** Get certificate change history.

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Certificate history

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array"
      }
    }
  }
  ```
  </details>


---

## 📦 Module: CHANGE-REQUESTS

### POST `/api/v1/change-requests`

**Summary:** Create change request

**Allowed Roles:** `CLIENT, ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "entity_type": {
      "type": "string"
    },
    "entity_id": {
      "type": "string",
      "format": "uuid"
    },
    "change_type": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "requested_changes": {
      "type": "object"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "entity_type": "VESSEL",
  "entity_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "change_type": "UPDATE",
  "description": "Request to update vessel IMO number",
  "requested_changes": {
    "imo_number": "9123457"
  }
}
```
</details>

**Responses:**

- **201**: Change request created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/change-requests`

**Summary:** Get change requests

**Allowed Roles:** `ADMIN, GM, TM`

**Responses:**

- **200**: List of change requests

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/change-requests/{id}/approve`

**Summary:** Approve change request

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Request approved

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/change-requests/{id}/reject`

**Summary:** Reject change request

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Request rejected

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: CHECKLIST-TEMPLATES

### POST `/api/v1/checklist-templates`

**Summary:** Create checklist template

**Allowed Roles:** `ADMIN`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "name",
    "code",
    "sections"
  ],
  "properties": {
    "name": {
      "type": "string"
    },
    "code": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "certificate_type_id": {
      "type": "string",
      "format": "uuid"
    },
    "sections": {
      "type": "array"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "DRAFT"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "Safety Equipment Inspection",
  "code": "SAFETY_EQUIP_001",
  "description": "Standard safety equipment checklist",
  "certificate_type_id": "01933c5e-7f2b-7a00-8000-1a2b3c4d5e6f",
  "sections": [
    {
      "title": "Life-Saving Equipment",
      "items": [
        {
          "code": "LSE001",
          "text": "Are life jackets available?",
          "type": "YES_NO_NA"
        },
        {
          "code": "LSE002",
          "text": "Number of life jackets",
          "type": "NUMBER"
        }
      ]
    }
  ],
  "status": "ACTIVE"
}
```
</details>

**Responses:**

- **201**: Template created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/checklist-templates`

**Summary:** Get checklist templates

**Allowed Roles:** `ADMIN, GM, TM, SURVEYOR`

**Parameters:**
- `status` (query):  Optional
- `certificate_type_id` (query):  Optional

**Responses:**

- **200**: List of templates

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/checklist-templates/job/{jobId}`

**Summary:** Get template for job

**Allowed Roles:** `SURVEYOR, ADMIN, GM, TM, TO`

**Parameters:**
- `jobId` (path):  **Required**

**Responses:**

- **200**: Template for job

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/checklist-templates/{id}`

**Summary:** Get template by ID

**Allowed Roles:** `ADMIN, GM, TM, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Template details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/checklist-templates/{id}`

**Summary:** Update template

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "code": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "DRAFT"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "Safety Equipment Inspection (Updated)",
  "status": "ACTIVE"
}
```
</details>

**Responses:**

- **200**: Template updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### DELETE `/api/v1/checklist-templates/{id}`

**Summary:** Delete template

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Template deleted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/checklist-templates/{id}/activate`

**Summary:** Activate template

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Template activated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/checklist-templates/{id}/clone`

**Summary:** Clone template

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **201**: Template cloned

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: JOBS

### GET `/api/v1/jobs/{jobId}/checklist`

**Summary:** Get checklist for a job

**Description:** Retrieve the checklist items for a specific job. Can be filtered by answer or question code.

**Allowed Roles:** `ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `jobId` (path): Unique identifier of the job **Required**
- `answer` (query): Filter by answer status Optional
- `question_code` (query): Filter by specific question code Optional
- `search` (query): Search in question text or remarks Optional

**Responses:**

- **200**: Checklist retrieved successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/ChecklistItem"
        }
      }
    },
    "example": {
      "success": true,
      "data": [
        {
          "id": "019c675a-eead-752b-b2ea-e8b5932b0cfc",
          "job_id": "019c6152-5b55-736c-a0d3-0dc3f6f1c4ec",
          "question_code": "LSE001",
          "question_text": "Are life jackets available?",
          "answer": "YES",
          "remarks": "",
          "file_url": null,
          "createdAt": "2026-02-16T16:48:58.000Z",
          "updatedAt": "2026-02-16T16:48:58.000Z"
        },
        {
          "id": "019c675a-eead-752b-b2ea-ed0e46e9bbc7",
          "job_id": "019c6152-5b55-736c-a0d3-0dc3f6f1c4ec",
          "question_code": "LSE002",
          "question_text": "Number of life jackets",
          "answer": "YES",
          "remarks": "24 units",
          "file_url": null,
          "createdAt": "2026-02-16T16:48:58.000Z",
          "updatedAt": "2026-02-16T16:48:58.000Z"
        }
      ]
    }
  }
  ```
  </details>

- **400**: Bad Request

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Not Found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{jobId}/checklist`

**Summary:** Submit checklist for a job

**Description:** Submit or update the checklist items for a job. Only the assigned SURVEYOR can perform this action when the job is IN_PROGRESS.

**Allowed Roles:** `SURVEYOR`

**Parameters:**
- `jobId` (path): Unique identifier of the job **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "items"
  ],
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "question_code",
          "question_text",
          "answer"
        ],
        "properties": {
          "question_code": {
            "type": "string"
          },
          "question_text": {
            "type": "string"
          },
          "answer": {
            "type": "string",
            "enum": [
              "YES",
              "NO",
              "NA"
            ]
          },
          "remarks": {
            "type": "string"
          },
          "file_url": {
            "type": "string",
            "format": "uri"
          }
        }
      }
    }
  },
  "example": {
    "items": [
      {
        "question_code": "LSE001",
        "question_text": "Are life jackets available?",
        "answer": "YES",
        "remarks": "Verified count matches record",
        "file_url": ""
      },
      {
        "question_code": "LSE002",
        "question_text": "Is the fire extinguisher charged?",
        "answer": "NO",
        "remarks": "Pressure low, needs replacement",
        "file_url": "https://example.com/evidence_fire_ext.jpg"
      }
    ]
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "items": [
    {
      "question_code": "LSE001",
      "question_text": "Are life jackets available?",
      "answer": "YES",
      "remarks": "Verified count matches record",
      "file_url": ""
    },
    {
      "question_code": "LSE002",
      "question_text": "Is the fire extinguisher charged?",
      "answer": "NO",
      "remarks": "Pressure low, needs replacement",
      "file_url": "https://example.com/evidence_fire_ext.jpg"
    },
    {
      "question_code": "LSE003",
      "question_text": "Is the fire alarm functional?",
      "answer": "NA",
      "remarks": "Not applicable for this vessel type",
      "file_url": ""
    }
  ]
}
```
</details>

**Responses:**

- **200**: Checklist submitted successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/ChecklistItem"
        }
      }
    },
    "example": {
      "success": true,
      "data": [
        {
          "id": "019c675a-eead-752b-b2ea-e8b5932b0cfc",
          "job_id": "019c6152-5b55-736c-a0d3-0dc3f6f1c4ec",
          "question_code": "LSE001",
          "question_text": "Are life jackets available?",
          "answer": "YES",
          "remarks": "",
          "file_url": null,
          "createdAt": "2026-02-16T16:48:58.000Z",
          "updatedAt": "2026-02-16T16:48:58.000Z"
        },
        {
          "id": "019c675a-eead-752b-b2ea-ed0e46e9bbc7",
          "job_id": "019c6152-5b55-736c-a0d3-0dc3f6f1c4ec",
          "question_code": "LSE002",
          "question_text": "Number of life jackets",
          "answer": "YES",
          "remarks": "24 units",
          "file_url": null,
          "createdAt": "2026-02-16T16:48:58.000Z",
          "updatedAt": "2026-02-16T16:48:58.000Z"
        }
      ]
    }
  }
  ```
  </details>

- **400**: Bad Request

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Not Found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/jobs`

**Summary:** List jobs (role-filtered)

**Description:** Returns a paginated list of job requests. Visible set depends on caller role:
- **CLIENT** – Only jobs for their fleet (vessel_id filtered to client).
- **SURVEYOR** – Only jobs assigned to them (`assigned_surveyor_id = me`).
- **ADMIN / GM / TM / TO / TA / FLAG_ADMIN** – All jobs; defaults to last 30 days
  unless explicit filters are supplied.

Supply `status` as a **comma-separated** string to filter by multiple statuses,
e.g. `?status=ASSIGNED,SURVEY_AUTHORIZED`.


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, TA, FLAG_ADMIN, SURVEYOR`

**Parameters:**
- `page` (query): Page number (1-indexed) Optional
- `limit` (query): Records per page Optional
- `status` (query): Filter by status (single value or comma-separated list) Optional
- `vessel_id` (query):  Optional
- `certificate_type_id` (query):  Optional
- `assigned_surveyor_id` (query):  Optional
- `target_port` (query):  Optional
- `created_from` (query): ISO date string – start of creation window Optional
- `created_to` (query): ISO date string – end of creation window Optional
- `recent_days` (query): (Internal roles only) Shortcut to filter to last N days when no other date
filter is given. Default is 30.
 Optional

**Responses:**

- **200**: Paginated list of jobs

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object",
        "properties": {
          "total": {
            "type": "integer",
            "example": 42
          },
          "page": {
            "type": "integer",
            "example": 1
          },
          "limit": {
            "type": "integer",
            "example": 10
          },
          "totalPages": {
            "type": "integer",
            "example": 5
          },
          "jobs": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobResponse"
            }
          }
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized – missing or invalid token

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – role not allowed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/jobs`

**Summary:** Create job request

**Description:** Opens a new certification job request in **CREATED** status.
- **CLIENT** – Can only submit for vessels that belong to their account.
- **ADMIN / GM** – Can submit for any vessel.

If the selected `certificate_type_id` has mandatory required documents
(`CertificateRequiredDocument` where `is_mandatory=true`), each must be
included in `uploaded_documents`; otherwise the request will be rejected
with a `400` listing the missing documents.


**Allowed Roles:** `CLIENT, ADMIN, GM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "vessel_id",
    "certificate_type_id",
    "reason",
    "target_port",
    "target_date"
  ],
  "properties": {
    "vessel_id": {
      "$ref": "#/components/schemas/UUID"
    },
    "certificate_type_id": {
      "$ref": "#/components/schemas/UUID"
    },
    "reason": {
      "type": "string",
      "example": "Annual survey due"
    },
    "target_port": {
      "type": "string",
      "example": "Singapore"
    },
    "target_date": {
      "type": "string",
      "format": "date",
      "example": "2026-03-15"
    },
    "remarks": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "vessel_id": "019c574f-0991-7758-b696-03bb416c7433",
  "certificate_type_id": "019c79a4-55ba-773c-9454-f6bee169ab03",
  "reason": "Annual survey due",
  "target_port": "Singapore",
  "target_date": "2026-04-15",
  "uploaded_documents": [
    {
      "required_document_id": "019c4001-0002-7000-a000-000000000001",
      "file_url": "https://cdn.example.com/docs/reg-cert.pdf"
    }
  ]
}
```
</details>

**Responses:**

- **201**: Job created successfully (status = CREATED)

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Validation error or missing mandatory documents

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Missing mandatory documents for job creation."
      },
      "missing_documents": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "name": {
              "type": "string"
            }
          }
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/jobs/{id}`

**Summary:** Get job details

**Description:** Returns full job detail including vessel, certificate type, status history,
uploaded documents, reschedule records, and certificate (with signed URL if
applicable).
- **CLIENT** – Own fleet only.
- **SURVEYOR** – Only if assigned to them.
- **ADMIN / GM / TM / TO** – Any job.


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path): Job UUID **Required**

**Responses:**

- **200**: Job details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/JobDetailResponse"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/verify-documents`

**Summary:** TO: Verify documents → DOCUMENT_VERIFIED

**Description:** **Transition:** `CREATED → DOCUMENT_VERIFIED`

Technical Officer confirms that all uploaded documents are valid and complete.
If the certificate type has mandatory required documents that are not yet
uploaded, the request is rejected with a `400` listing the missing documents.

**Roles:** TO


**Allowed Roles:** `TO`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Documents verified. Job moved to DOCUMENT_VERIFIED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Documents verified by TO."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job not in CREATED state, or mandatory documents are missing

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – only TO can call this endpoint

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/approve-request`

**Summary:** GM/ADMIN: Approve request → APPROVED

**Description:** **Transition:** `DOCUMENT_VERIFIED → APPROVED`

General Manager or Admin formally approves the job request after document
verification. Records `approved_by_user_id` on the job.

**Roles:** ADMIN, GM


**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "remarks": {
      "type": "string",
      "example": "All documents verified. Request approved."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "remarks": "All documents verified. Request approved."
}
```
</details>

**Responses:**

- **200**: Job approved. Status → APPROVED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Job approved."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job not in DOCUMENT_VERIFIED state

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – only ADMIN or GM

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/finalize`

**Summary:** ADMIN/GM/TM: Finalize non-survey job → FINALIZED

**Description:** **Transition:** `APPROVED → FINALIZED`

Only applicable to jobs where `is_survey_required = false`. For jobs that
require a survey, finalization happens automatically when the survey is
completed and the TM finalizes the survey report.

**Roles:** ADMIN, GM, TM


**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "remarks": {
      "type": "string",
      "example": "No survey required. Finalizing."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "remarks": "No survey required. Finalizing."
}
```
</details>

**Responses:**

- **200**: Job finalized. Status → FINALIZED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Job finalized."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job requires a survey (is_survey_required=true), or not in APPROVED state

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/assign`

**Summary:** ADMIN/GM: Assign surveyor → ASSIGNED

**Description:** **Transition:** `APPROVED → ASSIGNED`

Assigns a surveyor to the job. The target user must exist and have
`role = SURVEYOR`. Records `assigned_surveyor_id` and `assigned_by_user_id`
and sends a push notification to the surveyor.

**Roles:** ADMIN, GM


**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "surveyorId"
  ],
  "properties": {
    "surveyorId": {
      "$ref": "#/components/schemas/UUID"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "surveyorId": "019c79a4-4930-71fd-aa73-887301791935"
}
```
</details>

**Responses:**

- **200**: Surveyor assigned. Status → ASSIGNED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Surveyor assigned."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job not in APPROVED state, or surveyorId is invalid / not a SURVEYOR

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – only ADMIN or GM

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/reassign`

**Summary:** GM/TM: Reassign surveyor (no status change)

**Description:** Replaces the assigned surveyor without changing job status.  
Can be called on any non-terminal job that already has a surveyor.
A `reason` is mandatory for audit purposes.

**Roles:** GM, TM


**Allowed Roles:** `GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "surveyorId",
    "reason"
  ],
  "properties": {
    "surveyorId": {
      "$ref": "#/components/schemas/UUID"
    },
    "reason": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "surveyorId": "019c79a4-4930-71fd-aa73-887301791935",
  "reason": "Original surveyor unavailable due to scheduling conflict."
}
```
</details>

**Responses:**

- **200**: Surveyor reassigned successfully (status unchanged).

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Surveyor reassigned."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job is in terminal state, or surveyorId is invalid

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – only GM or TM

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/authorize-survey`

**Summary:** ADMIN/TM: Authorize survey → SURVEY_AUTHORIZED

**Description:** **Transition:** `ASSIGNED → SURVEY_AUTHORIZED`

Admin or Technical Manager formally authorizes the survey to proceed.
Requires a surveyor to already be assigned. Notifies the surveyor and the
client. The surveyor can now call `POST /api/v1/surveys/start` to begin.

**Roles:** ADMIN, TM


**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "remarks": {
      "type": "string",
      "example": "Authorization granted. Proceed to vessel."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "remarks": "Authorization granted. Proceed to vessel."
}
```
</details>

**Responses:**

- **200**: Survey authorized. Status → SURVEY_AUTHORIZED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Survey authorized. Surveyor can now begin field work."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job not in ASSIGNED state, or no surveyor assigned

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – only ADMIN or TM

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/review`

**Summary:** TO: Technical review → REVIEWED

**Description:** **Transition:** `SURVEY_DONE → REVIEWED`

Technical Officer performs a technical review of the submitted survey findings.
Only a TO can call this endpoint.

**Roles:** TO


**Allowed Roles:** `TO`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "remarks": {
      "type": "string",
      "example": "Findings are correct. Technical review passed."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "remarks": "Findings are correct. Technical review passed."
}
```
</details>

**Responses:**

- **200**: Job reviewed. Status → REVIEWED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Job marked as reviewed."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job not in SURVEY_DONE state

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – only TO

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/send-back`

**Summary:** ADMIN/TM/TO: Request rework → REWORK_REQUESTED

**Description:** **Transition:** `SURVEY_DONE` or `REVIEWED → REWORK_REQUESTED`

Sends the job back to the surveyor for corrections.
Notifies the assigned surveyor with the `remarks` reason.

Role-specific from-state constraints:
- **ADMIN** – Any non-terminal state.
- **TM** – `SURVEY_DONE` or `REVIEWED`.
- **TO** – `SURVEY_DONE` only.

**Roles:** ADMIN, TM, TO


**Allowed Roles:** `ADMIN, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "remarks": {
      "type": "string",
      "example": "Engine section checklist is incomplete. Please revise."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "remarks": "Engine section checklist is incomplete. Please revise."
}
```
</details>

**Responses:**

- **200**: Rework requested. Status → REWORK_REQUESTED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Rework requested. Surveyor has been notified."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Role-state constraint violation

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/reschedule`

**Summary:** ADMIN/GM: Reschedule job date/port

**Description:** Updates `target_date` and/or `target_port` for an existing job.
Allowed when the job is in any of: `CREATED`, `DOCUMENT_VERIFIED`,
`APPROVED`, `ASSIGNED`, `SURVEY_AUTHORIZED`.  
Not allowed after survey starts or in terminal states.

Logs the old and new values in `job_reschedules` and notifies the
assigned surveyor (if any).

**Roles:** ADMIN, GM


**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "$ref": "#/components/schemas/RescheduleJobRequest"
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "new_target_date": "2026-05-01",
  "new_target_port": "Rotterdam",
  "reason": "Port congestion at Singapore. Rerouted to Rotterdam."
}
```
</details>

**Responses:**

- **200**: Job rescheduled successfully.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Job rescheduled successfully."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Rescheduling not allowed in current state (e.g. IN_PROGRESS or terminal),
or `reason` is missing.


  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – only ADMIN or GM

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/reject`

**Summary:** ADMIN/GM/TM: Reject job → REJECTED (terminal)

**Description:** **Terminal transition** – moves job to `REJECTED` permanently.

Role-specific constraints:
- **ADMIN** – Any non-terminal job.
- **GM** – Only in `CREATED` state.
- **TM** – Only in `ASSIGNED`, `SURVEY_DONE`, or `REVIEWED` states.

**Roles:** ADMIN, GM, TM


**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "remarks": {
      "type": "string",
      "example": "Insufficient documentation. Cannot proceed."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "remarks": "Insufficient documentation. Cannot proceed."
}
```
</details>

**Responses:**

- **200**: Job rejected. Status → REJECTED (terminal).

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Job rejected."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job already in terminal state, or role-state constraint violated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/cancel`

**Summary:** CLIENT/GM/TM/ADMIN: Cancel job → REJECTED (terminal)

**Description:** Cancels the job. Maps internally to the `REJECTED` terminal state.

- **CLIENT** – Must own the vessel; cannot cancel once `FINALIZED`,
  `CERTIFIED`, or `REJECTED`.
- **GM / TM / ADMIN** – Any non-terminal job.

**Roles:** CLIENT, GM, TM, ADMIN


**Allowed Roles:** `CLIENT, GM, TM, ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "reason": {
      "type": "string",
      "example": "No longer required."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "No longer required."
}
```
</details>

**Responses:**

- **200**: Job cancelled. Status → REJECTED.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Job cancelled."
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **400**: Job already in terminal state

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden – CLIENT trying to cancel a job for a vessel they don't own

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/jobs/{id}/priority`

**Summary:** ADMIN/GM/TM: Update job priority

**Description:** Updates the `priority` field of a job. Creates an audit log entry with
the old and new values plus an optional reason.

Priority does **not** affect the job workflow or status — it is a
management flag only, used to sort / filter jobs in dashboards.

| Value | Meaning |
|---|---|
| `LOW` | Non-urgent, can wait |
| `NORMAL` | Standard priority (default) |
| `HIGH` | Requires prompt attention |
| `URGENT` | Must be actioned immediately |

**Roles:** ADMIN, GM, TM


**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "priority"
  ],
  "properties": {
    "priority": {
      "type": "string",
      "enum": [
        "LOW",
        "NORMAL",
        "HIGH",
        "URGENT"
      ],
      "example": "HIGH"
    },
    "reason": {
      "type": "string",
      "example": "Client requested expedited review."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "priority": "HIGH"
}
```
</details>

**Responses:**

- **200**: Priority updated successfully.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/JobResponse"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/jobs/{id}/history`

**Summary:** ADMIN/GM/TM/TO: Job status history & audit trail

**Description:** Returns a chronological list of all status transitions for the job,
including who made each change and the reason.

**Roles:** ADMIN, GM, TM, TO


**Allowed Roles:** `ADMIN, GM, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Status history list

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/JobHistoryItem"
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/jobs/{id}/notes`

**Summary:** ADMIN/GM/TM/TO: Add internal staff note

**Description:** Attaches a private (internal) note to the job visible only to staff roles.
Notes are not visible to CLIENT or SURVEYOR.

**Roles:** ADMIN, GM, TM, TO


**Allowed Roles:** `ADMIN, GM, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "note_text"
  ],
  "properties": {
    "note_text": {
      "type": "string"
    },
    "is_internal": {
      "type": "boolean",
      "default": true
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "note_text": "Vessel owner confirmed availability for week of Apr 14."
}
```
</details>

**Responses:**

- **201**: Note added successfully.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/JobNoteResponse"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/jobs/{id}/messages/external`

**Summary:** Get external (client-visible) messages

**Description:** Returns the external message thread for a job — visible to CLIENT,
staff, and the assigned SURVEYOR.

**Roles:** CLIENT, ADMIN, GM, TM, TO, SURVEYOR


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: External message thread

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/JobMessageResponse"
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/jobs/{id}/messages/internal`

**Summary:** ADMIN/GM/TM/TO: Get internal (staff-only) messages

**Description:** Returns the internal message thread for a job — staff only, not
visible to CLIENT or SURVEYOR.

**Roles:** ADMIN, GM, TM, TO


**Allowed Roles:** `ADMIN, GM, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Internal message thread

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/JobMessageResponse"
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/jobs/{id}/messages`

**Summary:** Send message (with optional attachment)

**Description:** Posts a new message to the job thread. Supports text-only or multipart
with a file attachment.

**Roles:** CLIENT, ADMIN, GM, TM, TO, SURVEYOR


**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "Message text",
      "example": "Please review the updated checklist attached."
    },
    "attachment": {
      "type": "string",
      "format": "binary",
      "description": "Optional file attachment"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "content": "Please review the updated checklist attached.",
  "attachment": "file.bin"
}
```
</details>

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "content"
  ],
  "properties": {
    "content": {
      "type": "string",
      "example": "Vessel is ready for inspection."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "content": "Vessel is ready for inspection."
}
```
</details>

**Responses:**

- **201**: Message sent successfully.

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/JobMessageResponse"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Job not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: CLIENTS

### GET `/api/v1/clients`

**Summary:** List clients

**Description:** List all clients. ADMIN, GM, TM, TO only.

**Allowed Roles:** `ADMIN, GM, TM, TO`

**Parameters:**
- `page` (query):  Optional
- `limit` (query):  Optional

**Responses:**

- **200**: List of clients

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/ClientResponse"
        }
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/clients`

**Summary:** Create client

**Description:** Create a new client. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "company_name",
    "company_code",
    "email"
  ],
  "properties": {
    "company_name": {
      "type": "string",
      "example": "Marine Shipping Co"
    },
    "company_code": {
      "type": "string",
      "example": "MSC001"
    },
    "email": {
      "type": "string",
      "format": "email",
      "example": "contact@marineshipping.com"
    },
    "address": {
      "type": "string"
    },
    "country": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "contact_person_name": {
      "type": "string"
    },
    "contact_person_email": {
      "type": "string",
      "format": "email"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE"
      ]
    },
    "user": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "email": {
          "type": "string",
          "format": "email"
        },
        "password": {
          "type": "string",
          "format": "password",
          "minLength": 6
        },
        "role": {
          "type": "string",
          "enum": [
            "CLIENT"
          ],
          "default": "CLIENT"
        },
        "phone": {
          "type": "string"
        }
      }
    }
  },
  "example": {
    "company_name": "Marine Shipping Co",
    "company_code": "MSC001",
    "email": "contact@marineshipping.com"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "company_name": "Marine Shipping Co",
  "company_code": "MSC001",
  "email": "contact@marineshipping.com"
}
```
</details>

**Responses:**

- **201**: Client created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/ClientResponse"
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/clients/profile`

**Summary:** Get client profile

**Description:** Get current user's client profile. CLIENT role only.

**Allowed Roles:** `CLIENT`

**Responses:**

- **200**: Client profile

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/ClientResponse"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/clients/profile`

**Summary:** Update client profile

**Description:** Update current user's client profile. CLIENT role only.

**Allowed Roles:** `CLIENT`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "company_name": {
      "type": "string"
    },
    "contact_person_name": {
      "type": "string"
    },
    "contact_person_email": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "company_name": "Marine Shipping Co",
  "contact_person_name": "John Smith",
  "contact_person_email": "john@marineshipping.com",
  "phone": "+65 6123 4567"
}
```
</details>

**Responses:**

- **200**: Profile updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/ClientResponse"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/clients/profile/documents`

**Summary:** Get client profile documents

**Description:** Get all documents related to the current client (Vessels, Jobs, Surveys, Profile). CLIENT role only.

**Allowed Roles:** `CLIENT`

**Responses:**

- **200**: List of documents

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "count": {
        "type": "integer",
        "example": 5
      },
      "data": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "entity_type": {
              "type": "string",
              "example": "JOB"
            },
            "entity_id": {
              "type": "string",
              "format": "uuid"
            },
            "entity_name": {
              "type": "string",
              "description": "Friendly name of the entity"
            },
            "document_type": {
              "type": "string"
            },
            "signedUrl": {
              "type": "string",
              "description": "Secure URL to view file"
            },
            "fileName": {
              "type": "string"
            },
            "expiresAt": {
              "type": "string",
              "format": "date-time"
            },
            "uploaded_at": {
              "type": "string",
              "format": "date-time"
            }
          }
        }
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/clients/dashboard`

**Summary:** Get client dashboard

**Description:** Get dashboard for client users. CLIENT role only.

**Allowed Roles:** `CLIENT`

**Responses:**

- **200**: Client dashboard data

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/clients/{id}/documents`

**Summary:** Get client documents by ID

**Description:** Get all documents related to a specific client (Vessels, Jobs, Surveys, Profile). ADMIN, GM, TM, TO only.

**Allowed Roles:** `ADMIN, GM, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: List of documents

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "count": {
        "type": "integer",
        "example": 5
      },
      "data": {
        "type": "array",
        "items": {
          "type": "object"
        }
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/clients/{id}`

**Summary:** Get client by ID

**Description:** Get client details by ID. ADMIN, GM, TM, TO only.

**Allowed Roles:** `ADMIN, GM, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Client details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/ClientResponse"
      }
    }
  }
  ```
  </details>

- **404**: Client not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/clients/{id}`

**Summary:** Update client

**Description:** Update client details. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "company_name": {
      "type": "string"
    },
    "company_code": {
      "type": "string"
    },
    "email": {
      "type": "string"
    },
    "address": {
      "type": "string"
    },
    "country": {
      "type": "string"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "company_name": "Marine Shipping Co Ltd",
  "address": "123 Harbour Road",
  "country": "Singapore",
  "status": "ACTIVE"
}
```
</details>

**Responses:**

- **200**: Client updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/ClientResponse"
      }
    }
  }
  ```
  </details>


---

### DELETE `/api/v1/clients/{id}`

**Summary:** Delete client

**Description:** Delete a client. ADMIN only.

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Client deleted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: COMPLIANCE

### GET `/api/v1/compliance/export/{id}`

**Summary:** Export data

**Allowed Roles:** `ADMIN, CLIENT`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Export data

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/compliance/anonymize/{id}`

**Summary:** Anonymize data

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Data anonymized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: CONTACT

### POST `/api/v1/contact`

**Summary:** Submit a contact enquiry (public)

**Description:** Anyone visiting the Girik Shipping portfolio website can send a message via this endpoint. No authentication is required.


**Allowed Roles:** `PUBLIC`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "full_name",
    "corporate_email",
    "message"
  ],
  "properties": {
    "full_name": {
      "type": "string",
      "minLength": 2,
      "maxLength": 100,
      "example": "John Maritime"
    },
    "company": {
      "type": "string",
      "maxLength": 150,
      "example": "Pacific Shipping Co. Ltd"
    },
    "corporate_email": {
      "type": "string",
      "format": "email",
      "example": "john@pacificshipping.com"
    },
    "message": {
      "type": "string",
      "minLength": 10,
      "maxLength": 5000,
      "example": "We are interested in classification services for our fleet of 5 vessels."
    },
    "phone": {
      "type": "string",
      "maxLength": 30,
      "example": "+91 98765 43210"
    },
    "subject": {
      "type": "string",
      "maxLength": 200,
      "example": "Fleet Classification Inquiry"
    },
    "source_page": {
      "type": "string",
      "maxLength": 50,
      "example": "CONTACT",
      "description": "Page on the website the form was filled from."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "full_name": "John Maritime",
  "corporate_email": "john@pacificshipping.com",
  "message": "We are interested in classification services for our fleet of 5 vessels."
}
```
</details>

**Responses:**

- **201**: Enquiry submitted successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Your message has been received. We will get back to you shortly."
      },
      "data": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid"
          },
          "full_name": {
            "type": "string"
          },
          "created_at": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/contact`

**Summary:** List all enquiries (Admin/GM)

**Description:** Retrieve all contact form submissions with optional filters and pagination.

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `status` (query): Filter by enquiry status Optional
- `source_page` (query): Filter by the page the form was submitted from Optional
- `q` (query): Full-text search across name, email, company, message Optional
- `from_date` (query): Filter: submitted on or after this date (YYYY-MM-DD) Optional
- `to_date` (query): Filter: submitted on or before this date (YYYY-MM-DD) Optional
- `page` (query):  Optional
- `limit` (query):  Optional

**Responses:**

- **200**: Paginated list of enquiries

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "total": {
        "type": "integer",
        "example": 42
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/WebsiteContact"
        }
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/contact/stats`

**Summary:** Enquiry stats by status (Admin/GM)

**Description:** Returns counts of enquiries grouped by status, useful for a dashboard widget.

**Allowed Roles:** `ADMIN, GM`

**Responses:**

- **200**: Enquiry counts by status

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object",
        "properties": {
          "NEW": {
            "type": "integer",
            "example": 5
          },
          "READ": {
            "type": "integer",
            "example": 12
          },
          "REPLIED": {
            "type": "integer",
            "example": 20
          },
          "ARCHIVED": {
            "type": "integer",
            "example": 3
          },
          "TOTAL": {
            "type": "integer",
            "example": 40
          }
        }
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/contact/{id}`

**Summary:** Get a single enquiry (Admin/GM)

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Enquiry details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean"
      },
      "data": {
        "$ref": "#/components/schemas/WebsiteContact"
      }
    }
  }
  ```
  </details>

- **404**: Not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### DELETE `/api/v1/contact/{id}`

**Summary:** Delete an enquiry (Admin only)

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **204**: Deleted successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **404**: Not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PATCH `/api/v1/contact/{id}/status`

**Summary:** Update enquiry status / internal note (Admin/GM)

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "NEW",
        "READ",
        "REPLIED",
        "ARCHIVED"
      ],
      "example": "REPLIED"
    },
    "internal_note": {
      "type": "string",
      "maxLength": 2000,
      "example": "Responded via email on 20 Feb 2026."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "REPLIED"
}
```
</details>

**Responses:**

- **200**: Enquiry updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean"
      },
      "message": {
        "type": "string"
      },
      "data": {
        "$ref": "#/components/schemas/WebsiteContact"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **404**: Not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: DASHBOARD

### GET `/api/v1/dashboard`

**Summary:** Get dashboard

**Description:** Get role-specific dashboard data. Structure varies by user role:
- ADMIN: System-wide stats, pending approvals
- GM: Management dashboard
- TM: Technical manager view
- TO: Technical officer view
- SURVEYOR: Assigned jobs, availability
- CLIENT: Vessel/job overview


**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: Dashboard data

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "description": "Role-specific dashboard data. Structure varies by role (ADMIN, GM, TM, TO, SURVEYOR, CLIENT)",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object",
        "properties": {
          "stats": {
            "type": "object",
            "additionalProperties": true,
            "description": "Key metrics (e.g. pendingJobs, totalCertificates)"
          },
          "recentJobs": {
            "type": "array",
            "items": {}
          },
          "expiringCertificates": {
            "type": "array",
            "items": {}
          },
          "alerts": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": {
                  "type": "string"
                },
                "message": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "example": {
      "success": true,
      "data": {
        "stats": {
          "pendingJobs": 5,
          "totalCertificates": 120
        },
        "recentJobs": [],
        "expiringCertificates": []
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: DOCUMENTS

### POST `/api/v1/documents/upload`

**Summary:** Upload a standalone document file (No Entity needed yet)

**Description:** Upload a file strictly to standard storage and receive its URL. Useful for uploading files before creating vessels or jobs.

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, SURVEYOR`

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "file"
  ],
  "properties": {
    "file": {
      "type": "string",
      "format": "binary"
    },
    "folder": {
      "type": "string",
      "description": "Optional folder name for grouping (e.g. 'vessels', 'user-docs')"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "file": "file.bin"
}
```
</details>

**Responses:**

- **201**: File uploaded successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object",
        "properties": {
          "file_url": {
            "type": "string",
            "example": "https://bucket.s3.amazonaws.com/temp/my-file.pdf"
          }
        }
      }
    }
  }
  ```
  </details>

- **400**: No file provided

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/documents/{entityType}/{entityId}`

**Summary:** Get documents

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `entityType` (path): The type of entity (e.g., VESSEL, JOB, CERTIFICATE, USER, SURVEY) **Required**
- `entityId` (path): The UUID of the specific entity **Required**

**Responses:**

- **200**: List of documents retrieved successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "entity_type": {
              "type": "string"
            },
            "entity_id": {
              "type": "string",
              "format": "uuid"
            },
            "file_url": {
              "type": "string"
            },
            "uploaded_at": {
              "type": "string",
              "format": "date-time"
            }
          }
        }
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/documents/{entityType}/{entityId}`

**Summary:** Upload document

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, SURVEYOR`

**Parameters:**
- `entityType` (path): The type of entity to attach the document to (e.g., VESSEL, JOB, CERTIFICATE, USER, SURVEY) **Required**
- `entityId` (path): The UUID of the specific entity **Required**

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "files"
  ],
  "properties": {
    "files": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "binary"
      }
    },
    "document_type": {
      "type": "string",
      "description": "Type of document (e.g., EVIDENCE, REPORT)"
    },
    "description": {
      "type": "string",
      "description": "Optional description of the document"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "files": [
    "(Binary file data 1)",
    "(Binary file data 2)"
  ],
  "document_type": "EVIDENCE",
  "description": "Photos of cracked hull"
}
```
</details>

**Responses:**

- **201**: Documents uploaded successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "count": {
        "type": "integer",
        "example": 2
      },
      "data": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid"
            },
            "file_url": {
              "type": "string"
            },
            "document_type": {
              "type": "string"
            },
            "description": {
              "type": "string"
            }
          }
        }
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### DELETE `/api/v1/documents/{id}`

**Summary:** Delete document

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Document deleted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: CUSTOMER-FEEDBACK

### POST `/api/v1/customer-feedback`

**Summary:** Submit feedback

**Allowed Roles:** `CLIENT`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "rating"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "rating": {
      "type": "number",
      "minimum": 1,
      "maximum": 5
    },
    "comment": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "rating": 5,
  "comment": "Surveyor was professional. Job completed on time."
}
```
</details>

**Responses:**

- **201**: Feedback submitted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/customer-feedback`

**Summary:** Get all feedback

**Allowed Roles:** `ADMIN, GM`

**Responses:**

- **200**: List of feedback

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/customer-feedback/job/{jobId}`

**Summary:** Get feedback for job

**Allowed Roles:** `ADMIN, GM, CLIENT`

**Parameters:**
- `jobId` (path):  **Required**

**Responses:**

- **200**: Job feedback

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: FLAGS

### POST `/api/v1/flags`

**Summary:** Create flag

**Allowed Roles:** `ADMIN`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "flag_state_name",
    "country",
    "authority_name",
    "contact_email"
  ],
  "properties": {
    "flag_state_name": {
      "type": "string"
    },
    "country": {
      "type": "string"
    },
    "authority_name": {
      "type": "string"
    },
    "contact_email": {
      "type": "string",
      "format": "email"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "flag_state_name": "Singapore",
  "country": "Singapore",
  "authority_name": "Maritime and Port Authority",
  "contact_email": "mpa@gov.sg"
}
```
</details>

**Responses:**

- **201**: Flag created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/flags`

**Summary:** Get flags

**Allowed Roles:** `ADMIN, GM, TM, TO`

**Responses:**

- **200**: List of flags

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/flags/{id}`

**Summary:** Update flag

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "flag_state_name": {
      "type": "string"
    },
    "country": {
      "type": "string"
    },
    "authority_name": {
      "type": "string"
    },
    "contact_email": {
      "type": "string",
      "format": "email"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "authority_name": "Maritime and Port Authority of Singapore"
}
```
</details>

**Responses:**

- **200**: Flag updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: HEALTH

### GET `/api/v1/health`

**Summary:** Health check

**Description:** Returns server health status. No authentication required.

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: Server is healthy

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "example": "UP"
      },
      "timestamp": {
        "type": "string",
        "format": "date-time"
      }
    }
  }
  ```
  </details>


---

## 📦 Module: INCIDENTS

### POST `/api/v1/incidents`

**Summary:** Report incident

**Allowed Roles:** `CLIENT, ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "description"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "vessel_id": {
      "type": "string",
      "format": "uuid"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "severity": {
      "type": "string",
      "enum": [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "title": "Equipment malfunction",
  "description": "Lifeboat davit not functioning properly during drill",
  "severity": "HIGH"
}
```
</details>

**Responses:**

- **201**: Incident reported

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/incidents`

**Summary:** Get incidents

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO`

**Responses:**

- **200**: List of incidents

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/incidents/{id}`

**Summary:** Get incident by ID

**Allowed Roles:** `CLIENT, ADMIN, GM, TM, TO`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Incident details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/incidents/{id}/status`

**Summary:** Update incident status

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "REPORTED",
        "UNDER_REVIEW",
        "RESOLVED",
        "CLOSED"
      ]
    },
    "resolution_notes": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "RESOLVED",
  "resolution_notes": "Davits repaired. Verified during re-inspection."
}
```
</details>

**Responses:**

- **200**: Status updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: NON-CONFORMITIES

### POST `/api/v1/non-conformities`

**Summary:** Create NC

**Allowed Roles:** `SURVEYOR, TO`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "job_id",
    "description",
    "severity"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "description": {
      "type": "string"
    },
    "severity": {
      "type": "string",
      "enum": [
        "MINOR",
        "MAJOR",
        "CRITICAL"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "description": "Life jacket expiry date exceeded. Replacement required.",
  "severity": "MAJOR"
}
```
</details>

**Responses:**

- **201**: NC created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/non-conformities/{id}/close`

**Summary:** Close NC

**Allowed Roles:** `TO, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "closure_remarks"
  ],
  "properties": {
    "closure_remarks": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "closure_remarks": "Life jackets replaced. NC closed after verification."
}
```
</details>

**Responses:**

- **200**: NC closed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/non-conformities/job/{jobId}`

**Summary:** Get NCs by job

**Allowed Roles:** `ADMIN, GM, TM, TO, SURVEYOR`

**Parameters:**
- `jobId` (path):  **Required**

**Responses:**

- **200**: List of NCs

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: NOTIFICATIONS

### GET `/api/v1/notifications`

**Summary:** Get notifications

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

---

### PUT `/api/v1/notifications/{id}/read`

**Summary:** Mark as read

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Marked as read

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### PUT `/api/v1/notifications/read-all`

**Summary:** Mark all as read

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: All marked as read

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

## 📦 Module: PAYMENTS

### GET `/api/v1/payments`

**Summary:** List payments

**Description:** List payments. CLIENT sees only their payments.

**Allowed Roles:** `CLIENT, ADMIN, GM, TM`

**Parameters:**
- `page` (query):  Optional
- `limit` (query):  Optional

**Responses:**

- **200**: List of payments

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/PaymentResponse"
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/payments/summary`

**Summary:** Financial summary

**Description:** Get financial summary. CLIENT, ADMIN, GM only.

**Allowed Roles:** `CLIENT, ADMIN, GM`

**Responses:**

- **200**: Financial summary

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/FinancialSummaryResponse"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/payments/invoice`

**Summary:** Create invoice

**Description:** Create a new invoice for a job. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "job_id",
    "amount"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "amount": {
      "type": "number",
      "format": "decimal",
      "minimum": 0
    },
    "currency": {
      "type": "string",
      "default": "USD"
    }
  },
  "example": {
    "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
    "amount": 1500,
    "currency": "USD"
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "amount": 1500,
  "currency": "USD"
}
```
</details>

**Responses:**

- **201**: Invoice created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/PaymentResponse"
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/payments/{id}`

**Summary:** Get payment by ID

**Description:** Get payment details by ID.

**Allowed Roles:** `CLIENT, ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Payment details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/PaymentResponse"
      }
    }
  }
  ```
  </details>

- **404**: Payment not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/payments/{id}/pay`

**Summary:** Mark invoice as paid

**Description:** Mark an invoice as paid. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM, TA`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "payment_date": {
      "type": "string",
      "format": "date"
    },
    "receipt_url": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "payment_date": "2026-02-13",
  "receipt_url": "https://storage.example.com/receipts/receipt-123.pdf"
}
```
</details>

**Responses:**

- **200**: Payment marked as paid

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/PaymentResponse"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/payments/{id}/refund`

**Summary:** Process refund

**Description:** Process a refund for a payment. ADMIN, GM only.

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "amount": {
      "type": "number"
    },
    "reason": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "amount": 500,
  "reason": "Duplicate payment. Refund requested by client."
}
```
</details>

**Responses:**

- **200**: Refund processed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/payments/{id}/partial`

**Summary:** Record partial payment

**Description:** Record a partial payment against an invoice. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "amount"
  ],
  "properties": {
    "amount": {
      "type": "number",
      "format": "decimal",
      "minimum": 0
    },
    "remarks": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "amount": 500,
  "remarks": "First instalment"
}
```
</details>

**Responses:**

- **200**: Partial payment recorded

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/PaymentResponse"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/payments/{id}/ledger`

**Summary:** Get payment ledger

**Description:** Get financial ledger entries for a payment. ADMIN, GM only.

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Ledger entries

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "type": "object"
        }
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/payments/writeoff`

**Summary:** Write off payment

**Description:** Write off an invoice/payment. ADMIN only.

**Allowed Roles:** `ADMIN`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "paymentId",
    "reason"
  ],
  "properties": {
    "paymentId": {
      "type": "string",
      "format": "uuid"
    },
    "reason": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "paymentId": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "reason": "Approved write off"
}
```
</details>

**Responses:**

- **200**: Payment written off

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

## 📦 Module: PUBLIC

### GET `/api/v1/public/certificate/verify/{number}`

**Summary:** Verify certificate (public)

**Description:** Public verification - no auth required

**Allowed Roles:** `PUBLIC`

**Parameters:**
- `number` (path):  **Required**

**Responses:**

- **200**: Certificate verification result

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/public/vessel/{imo}`

**Summary:** Verify vessel by IMO (public)

**Description:** Public vessel verification - no auth required

**Allowed Roles:** `PUBLIC`

**Parameters:**
- `imo` (path):  **Required**

**Responses:**

- **200**: Vessel verification result

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/public/website/videos`

**Summary:** Get all website videos (Public)

**Description:** Retrieve a list of uploaded videos. This endpoint is public and used by the website frontend.

**Allowed Roles:** `PUBLIC`

**Parameters:**
- `section` (query): Filter by website section (e.g. HOME, PORTFOLIO) Optional

**Responses:**

- **200**: List of videos

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "array",
    "items": {
      "$ref": "#/components/schemas/WebsiteVideo"
    }
  }
  ```
  </details>


---

## 📦 Module: REPORTS

### GET `/api/v1/reports/certificates`

**Summary:** Certificate report

**Allowed Roles:** `ADMIN, GM, TM`

**Responses:**

- **200**: Certificate report

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/reports/surveyors`

**Summary:** Surveyor report

**Allowed Roles:** `ADMIN, GM, TM`

**Responses:**

- **200**: Surveyor report

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/reports/non-conformities`

**Summary:** Non-conformity report

**Allowed Roles:** `ADMIN, GM, TM`

**Responses:**

- **200**: NC report

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/reports/financials`

**Summary:** Financial report

**Allowed Roles:** `ADMIN, GM, TM`

**Responses:**

- **200**: Financial report

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: SEARCH

### GET `/api/v1/search`

**Summary:** Global search

**Description:** Search across vessels, jobs, and certificates. Results are filtered by user's role and scope.

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Parameters:**
- `q` (query): Search query string (min 3 chars) **Required**
- `type` (query): Filter by specific entity type Optional

**Responses:**

- **200**: Search results

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "object",
        "properties": {
          "vessels": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/VesselSummary"
            }
          },
          "jobs": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/JobResponse"
            }
          },
          "certificates": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/CertificateResponse"
            }
          }
        }
      }
    }
  }
  ```
  </details>


---

## 📦 Module: SUPPORT

### POST `/api/v1/support`

**Summary:** Create support ticket

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "subject"
  ],
  "properties": {
    "subject": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "priority": {
      "type": "string",
      "enum": [
        "LOW",
        "MEDIUM",
        "HIGH",
        "URGENT"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "subject": "Unable to submit survey",
  "description": "Getting 500 error when submitting survey for job XYZ",
  "priority": "HIGH"
}
```
</details>

**Responses:**

- **201**: Ticket created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/support`

**Summary:** Get support tickets

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: List of tickets

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/support/{id}`

**Summary:** Get ticket by ID

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Ticket details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### PUT `/api/v1/support/{id}`

**Summary:** Update ticket status (or use /support/{id}/status)

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "RESOLVED"
}
```
</details>

**Responses:**

- **200**: Status updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/support/{id}/status`

**Summary:** Update ticket status

**Allowed Roles:** `ADMIN, GM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED"
      ]
    },
    "internal_note": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "RESOLVED",
  "internal_note": "Issue resolved and closed."
}
```
</details>

**Responses:**

- **200**: Status updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: SURVEYORS

### POST `/api/v1/surveyors`

**Summary:** Create surveyor

**Allowed Roles:** `ADMIN, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "name",
    "email",
    "password"
  ],
  "properties": {
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": [
        "SURVEYOR"
      ]
    },
    "phone": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "John Surveyor",
  "email": "surveyor@girik.com",
  "password": "SecurePass123!",
  "phone": "+65 9123 4567"
}
```
</details>

**Responses:**

- **201**: Surveyor created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/surveyors/apply`

**Summary:** Public surveyor application

**Allowed Roles:** `PUBLIC`

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "full_name",
    "email",
    "phone",
    "nationality",
    "qualification",
    "years_of_experience"
  ],
  "properties": {
    "full_name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "phone": {
      "type": "string"
    },
    "nationality": {
      "type": "string"
    },
    "qualification": {
      "type": "string"
    },
    "years_of_experience": {
      "type": "integer"
    },
    "cv": {
      "type": "string",
      "format": "binary"
    },
    "id_proof": {
      "type": "string",
      "format": "binary"
    },
    "certificates": {
      "type": "array",
      "items": {
        "type": "string",
        "format": "binary"
      }
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "full_name": "string",
  "email": "user@example.com",
  "phone": "string",
  "nationality": "string",
  "qualification": "string",
  "years_of_experience": 1
}
```
</details>

**Responses:**

- **201**: Application submitted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/surveyors/applications`

**Summary:** Get surveyor applications

**Allowed Roles:** `ADMIN, TM`

**Responses:**

- **200**: List of applications

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/surveyors/applications/{id}/review`

**Summary:** Review application

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "APPROVED",
        "REJECTED",
        "DOCUMENTS_REQUIRED"
      ]
    },
    "reviewer_remarks": {
      "type": "string"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "APPROVED",
  "reviewer_remarks": "Documents verified. Eligible for assignment."
}
```
</details>

**Responses:**

- **200**: Application reviewed successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Application approved."
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/surveyors/{id}/profile`

**Summary:** Get surveyor profile

**Allowed Roles:** `ADMIN, TM, SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Surveyor profile

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/surveyors/{id}/profile`

**Summary:** Update surveyor profile

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "full_name": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "nationality": {
      "type": "string"
    },
    "qualification": {
      "type": "string"
    },
    "years_of_experience": {
      "type": "integer"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "full_name": "John Surveyor",
  "phone": "+65 9123 4567",
  "nationality": "Singapore",
  "qualification": "IACS Certified",
  "years_of_experience": 5
}
```
</details>

**Responses:**

- **200**: Profile updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/surveyors/availability`

**Summary:** Update availability

**Allowed Roles:** `SURVEYOR`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "available_from": {
      "type": "string",
      "format": "date"
    },
    "available_to": {
      "type": "string",
      "format": "date"
    },
    "status": {
      "type": "string",
      "enum": [
        "AVAILABLE",
        "UNAVAILABLE",
        "ON_LEAVE"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "available_from": "2026-03-01",
  "available_to": "2026-03-31",
  "status": "AVAILABLE"
}
```
</details>

**Responses:**

- **200**: Availability updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/surveyors/location`

**Summary:** Report location

**Allowed Roles:** `SURVEYOR`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "latitude",
    "longitude"
  ],
  "properties": {
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "latitude": 1.3521,
  "longitude": 103.8198
}
```
</details>

**Responses:**

- **200**: Location reported

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/surveyors/{id}/location-history`

**Summary:** Get GPS history

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Location history

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: SURVEYS

### POST `/api/v1/surveys/start`

**Summary:** Start survey (Check-in)

**Description:** Surveyor checks in at the vessel location. Sets job status to IN_PROGRESS.

**Allowed Roles:** `SURVEYOR`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "job_id",
    "latitude",
    "longitude"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "latitude": {
      "type": "number",
      "example": 1.3521
    },
    "longitude": {
      "type": "number",
      "example": 103.8198
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "latitude": 1.3521,
  "longitude": 103.8198
}
```
</details>

**Responses:**

- **201**: Survey started

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Survey Started"
      },
      "data": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string"
          },
          "job_id": {
            "type": "string",
            "format": "uuid"
          },
          "started_at": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/surveys`

**Summary:** Submit survey report (Check-out)

**Description:** Surveyor submits final findings and attendance photo. Sets job status to SURVEY_DONE. Requires checklist submission first.

**Allowed Roles:** `SURVEYOR`

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "job_id",
    "gps_latitude",
    "gps_longitude",
    "survey_statement"
  ],
  "properties": {
    "job_id": {
      "type": "string",
      "format": "uuid"
    },
    "gps_latitude": {
      "type": "number"
    },
    "gps_longitude": {
      "type": "number"
    },
    "survey_statement": {
      "type": "string"
    },
    "reason_if_outside": {
      "type": "string"
    },
    "photo": {
      "type": "string",
      "format": "binary",
      "description": "Attendance photo"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "job_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "gps_latitude": 1.5,
  "gps_longitude": 1.5,
  "survey_statement": "string"
}
```
</details>

**Responses:**

- **201**: Survey submitted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/SurveyReportResponse"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/surveys`

**Summary:** List survey reports

**Allowed Roles:** `ADMIN, GM, TM, TO`

**Responses:**

- **200**: List of survey reports

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/SurveyReportResponse"
        }
      }
    }
  }
  ```
  </details>


---

### PUT `/api/v1/surveys/{id}/finalize`

**Summary:** Finalize survey

**Description:** TM grants final approval to the survey findings. Unlocks certificate generation.

**Allowed Roles:** `TM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Survey finalized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Survey Finalized."
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/surveys/{id}/rework`

**Summary:** Request Rework

**Description:** GM or TM requests corrections/rework on a submitted survey.

**Allowed Roles:** `GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "reason"
  ],
  "properties": {
    "reason": {
      "type": "string",
      "example": "Incomplete proof for engine section."
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "reason": "Incomplete proof for engine section."
}
```
</details>

**Responses:**

- **200**: Rework requested

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Rework requested successfully"
      }
    }
  }
  ```
  </details>

- **400**: Invalid transition

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/surveys/{id}/location`

**Summary:** Stream live location

**Description:** Real-time GPS tracking during survey execution.

**Allowed Roles:** `SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "latitude",
    "longitude"
  ],
  "properties": {
    "latitude": {
      "type": "number"
    },
    "longitude": {
      "type": "number"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "latitude": 1.5,
  "longitude": 1.5
}
```
</details>

**Responses:**

- **200**: Location updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/surveys/{id}/proof`

**Summary:** Upload survey evidence

**Description:** Supplemental photos or documents for the survey.

**Allowed Roles:** `SURVEYOR`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "proof": {
      "type": "string",
      "format": "binary"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "proof": "file.bin"
}
```
</details>

**Responses:**

- **201**: Proof uploaded

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/surveys/{id}/timeline`

**Summary:** Get survey execution timeline

**Description:** Analytical view of survey duration and GPS variance.

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Survey timeline fetched

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/SurveyTimelineResponse"
      }
    }
  }
  ```
  </details>


---

### POST `/api/v1/surveys/{id}/violation`

**Summary:** Flag survey violation

**Description:** Flag discrepancies found in survey execution (e.g. location mismatch).

**Allowed Roles:** `ADMIN, TM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Violation flagged

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

## 📦 Module: SYSTEM

### GET `/api/v1/system/metrics`

**Summary:** Get system metrics

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: System metrics

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/health`

**Summary:** Get system health

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: Health status

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/readiness`

**Summary:** Get system readiness

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: Readiness status

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/version`

**Summary:** Get system version

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: Version info

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/audit-logs`

**Summary:** Get audit logs

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: Audit logs

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/system/users/{id}/logout`

**Summary:** Force user logout

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: User logged out

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/migrations`

**Summary:** Get migrations

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: Migration status

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/jobs/failed`

**Summary:** Get failed jobs

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: Failed jobs

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/system/jobs/{id}/retry`

**Summary:** Retry failed job

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Job retried

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/system/maintenance/{action}`

**Summary:** Maintenance action

**Allowed Roles:** `ADMIN`

**Parameters:**
- `action` (path):  **Required**

**Responses:**

- **200**: Action executed

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/feature-flags`

**Summary:** Get feature flags

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: Feature flags

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/system/locales`

**Summary:** Get locales

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: Locales

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: CERTIFICATE-TEMPLATES

### POST `/api/v1/certificate-templates`

**Summary:** Create template

**Allowed Roles:** `ADMIN`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "name",
    "code",
    "sections"
  ],
  "properties": {
    "name": {
      "type": "string"
    },
    "code": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "sections": {
      "type": "array"
    },
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "INACTIVE",
        "DRAFT"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "Safety Certificate Template",
  "code": "SAFETY_CERT_001",
  "description": "Template for safety certificates",
  "sections": [
    {
      "title": "Equipment",
      "items": [
        {
          "code": "EQ001",
          "text": "Fire extinguishers",
          "type": "YES_NO_NA"
        }
      ]
    }
  ],
  "status": "ACTIVE"
}
```
</details>

**Responses:**

- **201**: Template created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificate-templates`

**Summary:** Get templates

**Allowed Roles:** `ADMIN, GM, TM`

**Responses:**

- **200**: List of templates

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/certificate-templates/{id}`

**Summary:** Get template by ID

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Template details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/certificate-templates/{id}`

**Summary:** Update template

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object"
}
```
</details>

<details><summary>View Example</summary>

```json
{}
```
</details>

**Responses:**

- **200**: Template updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### DELETE `/api/v1/certificate-templates/{id}`

**Summary:** Delete template

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Template deleted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: TOCA

### POST `/api/v1/toca`

**Summary:** Create TOCA

**Allowed Roles:** `TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "vessel_id",
    "losing_class_society",
    "gaining_class_society",
    "request_date"
  ],
  "properties": {
    "vessel_id": {
      "type": "string",
      "format": "uuid"
    },
    "losing_class_society": {
      "type": "string"
    },
    "gaining_class_society": {
      "type": "string"
    },
    "request_date": {
      "type": "string",
      "format": "date"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "vessel_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "losing_class_society": "DNV",
  "gaining_class_society": "BV",
  "request_date": "2026-03-15"
}
```
</details>

**Responses:**

- **201**: TOCA created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/toca`

**Summary:** Get TOCAs

**Allowed Roles:** `ADMIN, GM, TM`

**Responses:**

- **200**: List of TOCAs

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/toca/{id}/status`

**Summary:** Update TOCA status

**Allowed Roles:** `TM, ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "ACCEPTED",
        "REJECTED"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "ACCEPTED"
}
```
</details>

**Responses:**

- **200**: Status updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: USERS

### GET `/api/v1/users`

**Summary:** Get all users

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: List of users

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/users`

**Summary:** Create user

**Allowed Roles:** `ADMIN`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "name",
    "email",
    "password",
    "role"
  ],
  "properties": {
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "password": {
      "type": "string"
    },
    "role": {
      "type": "string",
      "enum": [
        "ADMIN",
        "GM",
        "TM",
        "TO",
        "TA",
        "SURVEYOR",
        "CLIENT",
        "FLAG_ADMIN"
      ]
    },
    "phone": {
      "type": "string"
    },
    "client_id": {
      "type": "string",
      "format": "uuid"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "John Doe",
  "email": "john@girik.com",
  "password": "SecurePass123!",
  "role": "TM",
  "phone": "+65 9123 4567",
  "client_id": null
}
```
</details>

**Responses:**

- **201**: User created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/users/me`

**Summary:** Get current user profile

**Allowed Roles:** `ADMIN, GM, TM, TO, TA, SURVEYOR, CLIENT, FLAG_ADMIN`

**Responses:**

- **200**: Current user profile

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/users/{id}`

**Summary:** Update user

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "role": {
      "type": "string"
    },
    "phone": {
      "type": "string"
    },
    "status": {
      "type": "string"
    },
    "client_id": {
      "type": "string",
      "format": "uuid"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "name": "John Doe",
  "email": "john.updated@girik.com",
  "phone": "+65 9876 5432"
}
```
</details>

**Responses:**

- **200**: User updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### DELETE `/api/v1/users/{id}`

**Summary:** Delete user

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: User deleted

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/users/{id}/status`

**Summary:** Update user status

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "status"
  ],
  "properties": {
    "status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "SUSPENDED",
        "INACTIVE"
      ]
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "status": "ACTIVE"
}
```
</details>

**Responses:**

- **200**: Status updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: VESSELS

### GET `/api/v1/vessels`

**Summary:** List vessels

**Description:** List all vessels. CLIENT sees only their vessels.

**Allowed Roles:** `ADMIN, GM, TM, TO, CLIENT`

**Parameters:**
- `page` (query):  Optional
- `limit` (query):  Optional

**Responses:**

- **200**: List of vessels

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/VesselResponse"
        }
      }
    }
  }
  ```
  </details>

- **401**: Unauthorized

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### POST `/api/v1/vessels`

**Summary:** Create vessel

**Description:** Create a new vessel. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "client_id",
    "vessel_name",
    "imo_number",
    "flag_administration_id",
    "ship_type"
  ],
  "properties": {
    "client_id": {
      "type": "string",
      "format": "uuid",
      "example": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f"
    },
    "vessel_name": {
      "type": "string",
      "example": "Ocean Pioneer"
    },
    "imo_number": {
      "type": "string",
      "example": "9123456"
    },
    "call_sign": {
      "type": "string",
      "example": "9VSP"
    },
    "mmsi_number": {
      "type": "string",
      "example": "563123456"
    },
    "flag_administration_id": {
      "type": "string",
      "format": "uuid",
      "example": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f"
    },
    "port_of_registry": {
      "type": "string",
      "example": "Singapore"
    },
    "year_built": {
      "type": "integer",
      "example": 2015
    },
    "ship_type": {
      "type": "string",
      "example": "Cargo"
    },
    "gross_tonnage": {
      "type": "number",
      "format": "float"
    },
    "net_tonnage": {
      "type": "number",
      "format": "float"
    },
    "deadweight": {
      "type": "number",
      "format": "float"
    },
    "class_status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "SUSPENDED",
        "WITHDRAWN"
      ]
    },
    "current_class_society": {
      "type": "string"
    },
    "engine_type": {
      "type": "string"
    },
    "builder_name": {
      "type": "string"
    },
    "uploaded_documents": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "file_url": {
            "type": "string",
            "format": "uri"
          },
          "document_type": {
            "type": "string"
          },
          "description": {
            "type": "string"
          }
        }
      },
      "example": [
        {
          "file_url": "https://bucket.s3.amazonaws.com/cert.pdf",
          "document_type": "REGISTRY_CERTIFICATE",
          "description": "Ship Registry Certificate"
        }
      ]
    }
  },
  "example": {
    "client_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
    "vessel_name": "Ocean Pioneer",
    "imo_number": "9123456",
    "call_sign": "9VSP",
    "mmsi_number": "563123456",
    "flag_administration_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
    "port_of_registry": "Singapore",
    "year_built": 2015,
    "ship_type": "Cargo",
    "gross_tonnage": 30000,
    "net_tonnage": 15000,
    "deadweight": 45000,
    "class_status": "ACTIVE",
    "current_class_society": "DNV",
    "engine_type": "Diesel",
    "builder_name": "Hyundai Heavy Industries",
    "uploaded_documents": [
      {
        "file_url": "https://example-bucket.s3.amazonaws.com/cert.pdf",
        "document_type": "REGISTRY_CERTIFICATE",
        "description": "Ship Registry Certificate"
      }
    ]
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "client_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "vessel_name": "Ocean Pioneer",
  "imo_number": "9123456",
  "call_sign": "9VSP",
  "mmsi_number": "563123456",
  "flag_administration_id": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f",
  "port_of_registry": "Singapore",
  "year_built": 2015,
  "ship_type": "Cargo",
  "gross_tonnage": 30000,
  "net_tonnage": 15000,
  "deadweight": 45000,
  "class_status": "ACTIVE",
  "current_class_society": "DNV",
  "engine_type": "Diesel",
  "builder_name": "Hyundai Heavy Industries",
  "uploaded_documents": [
    {
      "file_url": "https://example-bucket.s3.amazonaws.com/cert.pdf",
      "document_type": "REGISTRY_CERTIFICATE",
      "description": "Ship Registry Certificate"
    }
  ]
}
```
</details>

**Responses:**

- **201**: Vessel created

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/VesselResponse"
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/vessels/client/{clientId}`

**Summary:** Get vessels by client

**Description:** Get all vessels for a specific client. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `clientId` (path):  **Required**

**Responses:**

- **200**: List of client vessels

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/VesselResponse"
        }
      }
    }
  }
  ```
  </details>

- **403**: Forbidden

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### GET `/api/v1/vessels/{id}`

**Summary:** Get vessel by ID

**Description:** Get vessel details by ID.

**Allowed Roles:** `ADMIN, GM, TM, TO, SURVEYOR, CLIENT`

**Parameters:**
- `id` (path):  **Required**

**Responses:**

- **200**: Vessel details

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/VesselResponse"
      }
    }
  }
  ```
  </details>

- **404**: Vessel not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### PUT `/api/v1/vessels/{id}`

**Summary:** Update vessel

**Description:** Update vessel details. ADMIN, GM, TM only.

**Allowed Roles:** `ADMIN, GM, TM`

**Parameters:**
- `id` (path):  **Required**

**Request Body:**

*Content-Type: `application/json`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "client_id": {
      "type": "string",
      "format": "uuid"
    },
    "vessel_name": {
      "type": "string"
    },
    "imo_number": {
      "type": "string"
    },
    "call_sign": {
      "type": "string"
    },
    "mmsi_number": {
      "type": "string"
    },
    "flag_administration_id": {
      "type": "string",
      "format": "uuid"
    },
    "port_of_registry": {
      "type": "string"
    },
    "year_built": {
      "type": "integer"
    },
    "ship_type": {
      "type": "string"
    },
    "gross_tonnage": {
      "type": "number"
    },
    "net_tonnage": {
      "type": "number"
    },
    "deadweight": {
      "type": "number"
    },
    "class_status": {
      "type": "string",
      "enum": [
        "ACTIVE",
        "SUSPENDED",
        "WITHDRAWN"
      ]
    },
    "current_class_society": {
      "type": "string"
    },
    "engine_type": {
      "type": "string"
    },
    "builder_name": {
      "type": "string"
    }
  },
  "example": {
    "vessel_name": "Ocean Pioneer II",
    "class_status": "SUSPENDED",
    "deadweight": 50000.5
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "vessel_name": "Ocean Pioneer II",
  "class_status": "SUSPENDED",
  "deadweight": 50000.5,
  "uploaded_documents": [
    {
      "file_url": "https://example-bucket.s3.amazonaws.com/cert-update.pdf",
      "document_type": "REGISTRY_CERTIFICATE",
      "description": "Ship Registry Certificate - Updated"
    }
  ]
}
```
</details>

**Responses:**

- **200**: Vessel updated

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "data": {
        "$ref": "#/components/schemas/VesselResponse"
      }
    }
  }
  ```
  </details>

- **400**: Validation error

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

## 📦 Module: WEBSITE

### GET `/api/v1/website/videos`

**Summary:** List all videos (Internal)

**Description:** Get a list of videos with full metadata. Requires authentication.

**Allowed Roles:** `ADMIN`

**Responses:**

- **200**: List of videos

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "array",
    "items": {
      "$ref": "#/components/schemas/WebsiteVideo"
    }
  }
  ```
  </details>


---

### POST `/api/v1/website/videos`

**Summary:** Upload a new video (Admin Only)

**Description:** Upload a video file and an optional thumbnail for a specific website section.

**Allowed Roles:** `ADMIN`

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "required": [
    "section",
    "video"
  ],
  "properties": {
    "section": {
      "type": "string",
      "description": "Target section (e.g., HOME, TRAINING, SERVICES)"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "thumbnail": {
      "type": "string",
      "format": "binary",
      "description": "The thumbnail image file"
    },
    "video": {
      "type": "string",
      "format": "binary",
      "description": "The video file to upload"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "section": "string",
  "video": "file.bin"
}
```
</details>

**Responses:**

- **201**: Video uploaded successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "example": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f"
      },
      "section": {
        "type": "string",
        "example": "HOME",
        "description": "Section of the website where the video belongs (e.g., HOME, PORTFOLIO)"
      },
      "title": {
        "type": "string",
        "example": "Introduction Video"
      },
      "description": {
        "type": "string",
        "example": "A brief introduction to our services."
      },
      "video_url": {
        "type": "string",
        "format": "uri",
        "example": "https://bucket.s3.region.amazonaws.com/website/videos/video.mp4"
      },
      "thumbnail_url": {
        "type": "string",
        "format": "uri",
        "example": "https://bucket.s3.region.amazonaws.com/website/videos/thumb.jpg"
      },
      "uploaded_by": {
        "type": "string",
        "format": "uuid",
        "example": "01933c5e-user-id"
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      },
      "updated_at": {
        "type": "string",
        "format": "date-time"
      }
    }
  }
  ```
  </details>


---

### PUT `/api/v1/website/videos/{id}`

**Summary:** Update video details

**Description:** Update metadata or replace files for an existing video.

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path): Video ID **Required**

**Request Body:**

*Content-Type: `multipart/form-data`*

<details><summary>View Schema</summary>

```json
{
  "type": "object",
  "properties": {
    "section": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "thumbnail": {
      "type": "string",
      "format": "binary"
    },
    "video": {
      "type": "string",
      "format": "binary"
    }
  }
}
```
</details>

<details><summary>View Example</summary>

```json
{
  "section": "string",
  "title": "string",
  "description": "string",
  "thumbnail": "file.bin",
  "video": "file.bin"
}
```
</details>

**Responses:**

- **200**: Video updated successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "example": "01933c5e-7f2a-7a00-8000-1a2b3c4d5e6f"
      },
      "section": {
        "type": "string",
        "example": "HOME",
        "description": "Section of the website where the video belongs (e.g., HOME, PORTFOLIO)"
      },
      "title": {
        "type": "string",
        "example": "Introduction Video"
      },
      "description": {
        "type": "string",
        "example": "A brief introduction to our services."
      },
      "video_url": {
        "type": "string",
        "format": "uri",
        "example": "https://bucket.s3.region.amazonaws.com/website/videos/video.mp4"
      },
      "thumbnail_url": {
        "type": "string",
        "format": "uri",
        "example": "https://bucket.s3.region.amazonaws.com/website/videos/thumb.jpg"
      },
      "uploaded_by": {
        "type": "string",
        "format": "uuid",
        "example": "01933c5e-user-id"
      },
      "created_at": {
        "type": "string",
        "format": "date-time"
      },
      "updated_at": {
        "type": "string",
        "format": "date-time"
      }
    }
  }
  ```
  </details>

- **404**: Video not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---

### DELETE `/api/v1/website/videos/{id}`

**Summary:** Delete a video

**Description:** Remove a video entry and its files from the system.

**Allowed Roles:** `ADMIN`

**Parameters:**
- `id` (path): Video ID **Required**

**Responses:**

- **204**: Video deleted successfully

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "example": true
      },
      "message": {
        "type": "string",
        "example": "Request successful"
      }
    }
  }
  ```
  </details>

- **404**: Video not found

  <details><summary>View Schema</summary>

  ```json
  {
    "type": "object",
    "required": [
      "success",
      "message"
    ],
    "properties": {
      "success": {
        "type": "boolean",
        "example": false
      },
      "message": {
        "type": "string",
        "example": "Validation Error"
      },
      "error": {
        "type": "string",
        "description": "Detailed error message (e.g. from Joi validation)"
      }
    },
    "example": {
      "success": false,
      "message": "Validation Error",
      "error": "vessel_id is required"
    }
  }
  ```
  </details>


---


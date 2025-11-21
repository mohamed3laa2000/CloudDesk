# Passkey Authentication API Reference

This document provides comprehensive API documentation for the WebAuthn passkey authentication endpoints in CloudDesk EDU.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Registration](#registration)
  - [Authentication](#authentication-1)
  - [Management](#management)
  - [Two-Factor Authentication](#two-factor-authentication)
- [Error Codes](#error-codes)
- [Security Considerations](#security-considerations)

## Overview

The Passkey Authentication API enables WebAuthn-based passwordless authentication and two-factor authentication (2FA) for CloudDesk EDU. It supports both platform authenticators (built-in biometric sensors like Touch ID, Face ID, Windows Hello) and cross-platform authenticators (security keys like YubiKey).

**Base URL:** `https://api.clouddesk.edu`

**API Version:** v1

## Authentication

Most passkey endpoints require JWT authentication. Include your JWT token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Public endpoints (login-options, login-verify) do not require authentication.

## Endpoints

### Registration

#### Generate Registration Options

Generate WebAuthn registration options for enrolling a new passkey.

**Endpoint:** `POST /api/auth/passkey/register-options`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "authenticatorType": "platform" // or "cross-platform"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| authenticatorType | string | Yes | Either "platform" (biometric) or "cross-platform" (security key) |

**Response (200 OK):**

```json
{
  "success": true,
  "options": {
    "challenge": "base64-encoded-challenge",
    "rp": {
      "name": "CloudDesk",
      "id": "clouddesk.edu"
    },
    "user": {
      "id": "user-id-base64",
      "name": "user@example.com",
      "displayName": "John Doe"
    },
    "pubKeyCredParams": [
      { "type": "public-key", "alg": -7 },
      { "type": "public-key", "alg": -257 }
    ],
    "timeout": 60000,
    "authenticatorSelection": {
      "authenticatorAttachment": "platform",
      "requireResidentKey": false,
      "residentKey": "preferred",
      "userVerification": "preferred"
    },
    "excludeCredentials": []
  }
}
```

**Example:**

```bash
curl -X POST https://api.clouddesk.edu/api/auth/passkey/register-options \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "authenticatorType": "platform"
  }'
```

---

#### Verify Registration Response

Verify WebAuthn registration response and store the passkey.

**Endpoint:** `POST /api/auth/passkey/register-verify`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "base64-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64-encoded-client-data",
      "attestationObject": "base64-encoded-attestation"
    },
    "type": "public-key",
    "authenticatorAttachment": "platform",
    "transports": ["internal"]
  },
  "friendlyName": "My MacBook Touch ID" // optional
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | object | Yes | WebAuthn PublicKeyCredential from navigator.credentials.create() |
| friendlyName | string | No | Custom name for the passkey (max 100 characters) |

**Response (201 Created):**

```json
{
  "success": true,
  "passkey": {
    "id": "pk_abc123",
    "credentialId": "base64-encoded-credential-id",
    "authenticatorType": "platform",
    "friendlyName": "My MacBook Touch ID",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Example:**

```bash
curl -X POST https://api.clouddesk.edu/api/auth/passkey/register-verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credential": { ... },
    "friendlyName": "My MacBook Touch ID"
  }'
```

---

### Authentication

#### Generate Authentication Options

Generate WebAuthn authentication options for passkey login.

**Endpoint:** `POST /api/auth/passkey/login-options`

**Authentication:** Not required (public endpoint)

**Request Body:**

```json
{
  "userEmail": "user@example.com" // optional, for 2FA flow
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userEmail | string | No | User email for 2FA flow (from temp token). Omit for standalone login. |

**Response (200 OK):**

```json
{
  "success": true,
  "options": {
    "challenge": "base64-encoded-challenge",
    "rpId": "clouddesk.edu",
    "allowCredentials": [
      {
        "type": "public-key",
        "id": "base64-encoded-credential-id",
        "transports": ["internal"]
      }
    ],
    "timeout": 60000,
    "userVerification": "preferred"
  }
}
```

**Example:**

```bash
curl -X POST https://api.clouddesk.edu/api/auth/passkey/login-options \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

#### Verify Authentication Response

Verify WebAuthn authentication response and generate JWT.

**Endpoint:** `POST /api/auth/passkey/login-verify`

**Authentication:** Not required (public endpoint)

**Request Body:**

```json
{
  "credential": {
    "id": "credential-id",
    "rawId": "base64-encoded-raw-id",
    "response": {
      "clientDataJSON": "base64-encoded-client-data",
      "authenticatorData": "base64-encoded-authenticator-data",
      "signature": "base64-encoded-signature",
      "userHandle": "base64-encoded-user-handle"
    },
    "type": "public-key"
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| credential | object | Yes | WebAuthn PublicKeyCredential from navigator.credentials.get() |

**Response (200 OK):**

```json
{
  "success": true,
  "accessToken": "jwt-token-here",
  "user": {
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Example:**

```bash
curl -X POST https://api.clouddesk.edu/api/auth/passkey/login-verify \
  -H "Content-Type: application/json" \
  -d '{
    "credential": { ... }
  }'
```

---

### Management

#### List Passkeys

List all passkeys enrolled by the authenticated user.

**Endpoint:** `GET /api/auth/passkey/list`

**Authentication:** Required (JWT)

**Response (200 OK):**

```json
{
  "success": true,
  "passkeys": [
    {
      "id": "pk_abc123",
      "authenticatorType": "platform",
      "friendlyName": "My MacBook Touch ID",
      "lastUsedAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-10T08:00:00Z"
    },
    {
      "id": "pk_def456",
      "authenticatorType": "cross-platform",
      "friendlyName": "YubiKey 5C",
      "lastUsedAt": null,
      "createdAt": "2025-01-12T14:20:00Z"
    }
  ]
}
```

**Example:**

```bash
curl https://api.clouddesk.edu/api/auth/passkey/list \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Delete Passkey

Delete a passkey. Automatically disables 2FA if this is the last passkey.

**Endpoint:** `DELETE /api/auth/passkey/:id`

**Authentication:** Required (JWT)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Passkey ID (e.g., pk_abc123) |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Passkey deleted successfully"
}
```

Or if last passkey:

```json
{
  "success": true,
  "message": "Passkey deleted. 2FA has been automatically disabled as you have no remaining passkeys."
}
```

**Example:**

```bash
curl -X DELETE https://api.clouddesk.edu/api/auth/passkey/pk_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Update Passkey Name

Update the friendly name of a passkey.

**Endpoint:** `PATCH /api/auth/passkey/:id/name`

**Authentication:** Required (JWT)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Passkey ID (e.g., pk_abc123) |

**Request Body:**

```json
{
  "name": "My New Passkey Name"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | New friendly name (max 100 characters) |

**Response (200 OK):**

```json
{
  "success": true,
  "passkey": {
    "id": "pk_abc123",
    "authenticatorType": "platform",
    "friendlyName": "My New Passkey Name",
    "lastUsedAt": "2025-01-15T10:30:00Z",
    "createdAt": "2025-01-10T08:00:00Z",
    "updatedAt": "2025-01-16T14:20:00Z"
  }
}
```

**Example:**

```bash
curl -X PATCH https://api.clouddesk.edu/api/auth/passkey/pk_abc123/name \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Passkey Name"
  }'
```

---

### Two-Factor Authentication

#### Get 2FA Status

Get the user's 2FA passkey status.

**Endpoint:** `GET /api/auth/passkey/2fa-status`

**Authentication:** Required (JWT)

**Response (200 OK):**

```json
{
  "success": true,
  "enabled": true
}
```

**Example:**

```bash
curl https://api.clouddesk.edu/api/auth/passkey/2fa-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### Set 2FA Status

Enable or disable 2FA passkey mode. Requires at least one enrolled passkey to enable.

**Endpoint:** `PUT /api/auth/passkey/2fa-status`

**Authentication:** Required (JWT)

**Request Body:**

```json
{
  "enabled": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| enabled | boolean | Yes | Whether to enable or disable 2FA |

**Response (200 OK):**

```json
{
  "success": true,
  "enabled": true
}
```

**Example:**

```bash
curl -X PUT https://api.clouddesk.edu/api/auth/passkey/2fa-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true
  }'
```

---

## Error Codes

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Invalid or missing JWT token |
| 403 | Forbidden | Valid credentials but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (e.g., duplicate passkey) |
| 500 | Internal Server Error | Something went wrong on the server |
| 503 | Service Unavailable | Database or service temporarily unavailable |

### Registration Errors

| Status | Error Message |
|--------|---------------|
| 400 | Invalid or expired challenge |
| 400 | Invalid credential format |
| 400 | Challenge has expired (5 minute timeout) |
| 400 | Challenge does not match user session |
| 400 | Registration verification failed |
| 400 | authenticatorType must be either "platform" or "cross-platform" |
| 409 | This authenticator is already registered |
| 500 | Failed to generate registration options |
| 500 | Failed to store challenge |
| 500 | Failed to store passkey |
| 503 | Database service temporarily unavailable |

### Authentication Errors

| Status | Error Message |
|--------|---------------|
| 400 | Invalid credential format |
| 401 | Invalid or expired challenge |
| 401 | Challenge mismatch |
| 401 | Challenge has expired (5 minute timeout) |
| 401 | Invalid challenge type |
| 401 | Passkey not recognized |
| 401 | Invalid passkey signature |
| 401 | Passkey may be cloned. Please contact support. |
| 403 | Account not authorized |
| 500 | Failed to generate authentication options |
| 500 | Failed to store challenge |
| 500 | Failed to generate access token |
| 503 | Database service temporarily unavailable |

### Management Errors

| Status | Error Message |
|--------|---------------|
| 400 | Passkey ID is required |
| 400 | Name is required and must be a string |
| 400 | Name cannot be empty |
| 400 | Name must be 100 characters or less |
| 404 | Passkey not found |
| 503 | Database service temporarily unavailable |

### 2FA Errors

| Status | Error Message |
|--------|---------------|
| 400 | enabled must be a boolean value |
| 400 | Cannot enable 2FA without at least one enrolled passkey |
| 503 | Database service temporarily unavailable |

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Bad Request",
  "message": "Invalid or expired challenge"
}
```

## Security Considerations

### Challenge Management

- Challenges are cryptographically random (32 bytes)
- Challenges expire after 5 minutes
- Challenges are one-time use (deleted after verification)
- Challenges are session-bound to prevent cross-session attacks

### Credential Storage

- Only public keys are stored, never private keys
- Signature counters are validated to detect cloned credentials
- Counter validation failures result in authentication rejection

### Origin Validation

- All WebAuthn responses are validated against the expected Relying Party ID
- Cross-origin requests are rejected

### Rate Limiting

Recommended rate limits:
- Registration: 5 attempts per hour per user
- Authentication: 10 attempts per minute per IP

### HTTPS Requirement

- WebAuthn requires HTTPS in production
- Exception: `localhost` for development only

### Browser Compatibility

Supported browsers:
- Chrome/Edge 67+ (Windows, macOS, Android)
- Firefox 60+ (Windows, macOS, Android)
- Safari 13+ (macOS, iOS)

Use feature detection:

```javascript
const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined &&
         navigator.credentials !== undefined;
};
```

## Integration Examples

### Frontend Integration (TypeScript)

```typescript
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

// Enroll a passkey
async function enrollPasskey(authenticatorType: 'platform' | 'cross-platform') {
  // Get registration options from server
  const optionsResponse = await fetch('/api/auth/passkey/register-options', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ authenticatorType })
  });
  
  const { options } = await optionsResponse.json();
  
  // Start WebAuthn registration
  const credential = await startRegistration(options);
  
  // Verify with server
  const verifyResponse = await fetch('/api/auth/passkey/register-verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      credential,
      friendlyName: 'My Device'
    })
  });
  
  return await verifyResponse.json();
}

// Authenticate with passkey
async function authenticateWithPasskey() {
  // Get authentication options from server
  const optionsResponse = await fetch('/api/auth/passkey/login-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  
  const { options } = await optionsResponse.json();
  
  // Start WebAuthn authentication
  const credential = await startAuthentication(options);
  
  // Verify with server
  const verifyResponse = await fetch('/api/auth/passkey/login-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential })
  });
  
  const { accessToken, user } = await verifyResponse.json();
  
  // Store JWT and user data
  localStorage.setItem('accessToken', accessToken);
  
  return user;
}
```

## Support

For questions or issues with the Passkey Authentication API:

- Email: support@clouddesk.edu
- Documentation: https://clouddesk.edu/docs
- Status: https://status.clouddesk.edu

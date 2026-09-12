# SahkaarSetu Admin Portal — Admin-Only Demo Mode

## 1. Overview
The SahkaarSetu Admin Portal is configured for **Admin-Only Demo Mode** to provide a seamless, frictionless operator experience for demonstrations, evaluations, and field pilots.

In this mode:
- The portal opens directly into the **Operations Dashboard** (`role = 'ADMIN'`).
- There is **no login screen**, **no role toggle selector**, and **no STAFF restrictions** in the UI.
- All administrative features (Kiosk Fleet Monitoring, Governed Knowledge Base, Grievance Triage & Resolution, and Operational Insights) are immediately accessible.

---

## 2. Security & Architecture Preservation

### 2.1 Backend Dual-Mode Architecture
The underlying FastAPI backend (`/Users/pranav/SIH26088-Cooperative-AI/backend`) preserves all production security implementations developed in Phase 2A:
- `POST /api/admin/auth/login`: Real PBKDF2-SHA256 password verification and signed HMAC-SHA256 JWT generation.
- `GET /api/admin/auth/me`: Verification of access tokens and claims.
- `POST /api/admin/auth/logout`: Stateless session invalidation contract.
- Role-Based Access Control (RBAC): Hierarchical permission barriers enforcing `ADMIN` vs `STAFF` isolation.

### 2.2 Environment Configuration: `ADMIN_DEMO_MODE`
The backend authentication dependency (`get_current_admin_user` in `app/dependencies.py`) inspects the application setting:
```bash
ADMIN_DEMO_MODE=true  # or false (default in production)
```

| Mode | Authorization Header Present | Authorization Header Missing |
| :--- | :--- | :--- |
| **`ADMIN_DEMO_MODE=true`** | Decodes & cryptographically verifies JWT (rejects invalid/expired tokens with `401`) | Supplies neutral demo administrator context (`role='ADMIN'`) |
| **`ADMIN_DEMO_MODE=false`** *(Production)* | Decodes & cryptographically verifies JWT | Strictly rejects unauthenticated access with `HTTP 401 Unauthorized` |

### 2.3 Zero Frontend Credential Exposure
- No usernames, plaintext passwords, or fake JWT tokens are stored or committed in frontend source files.
- In demo mode, API requests from the browser execute cleanly without embedding fake credentials.
- When an administrator logs in with valid credentials, the resulting Bearer token is automatically stored in `localStorage` and attached to requests.

---

## 3. UI/UX Changes in Admin Frontend
1. **Direct Entry**: `App.tsx` initializes immediately in `activeTab = 'dashboard'` with administrator privileges.
2. **Operations Console Branding**: Header and navigation present the console as the *SahkaarSetu Operations & Administration Portal*.
3. **Role Indicator**: Replaced role switcher buttons with a static `Administrator` status badge.
4. **Profile Page**: Dedicated to Administrator profile attributes and capability matrices; role toggles removed.
5. **Clean Navigation**: Streamlined sidebar with system version and operational indicators.

---

## 4. Verification & Regression Coverage
The following test suites verify compliance:
- `test_admin_demo_mode.py`: 10/10 tests validating both `ADMIN_DEMO_MODE=true` and `ADMIN_DEMO_MODE=false`.
- `test_admin_auth.py`: 12/12 tests validating token generation, invalid password rejection, and session handling.
- `test_admin_grievances.py`: 19/19 tests validating triage and PII protection.
- `test_admin_kiosks.py`: 19/19 tests validating telemetry and heartbeat ingestion.
- `test_citizen_regression.py`: 6/6 tests confirming citizen RAG and query APIs remain untouched.

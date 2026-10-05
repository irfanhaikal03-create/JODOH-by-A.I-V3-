# Security Specification & Test Suite

## 1. Data Invariants
1. **Attendee Identity**: A participant document can only be created by an authenticated user matching `request.auth.uid` as `ownerId`, or an authenticated administrator (`hfirdaus2000@gmail.com` or `irfanhaikal03@gmail.com`).
2. **Attendee Update Integrity**: Non-admin attendees cannot alter other attendees' profiles or modify their `ownerId`.
3. **Session Immutability & Access Gate**: Only administrators can create, publish, or purge `saved_match_sessions`. Non-admin attendees can only read sessions where `isPublished == true`.
4. **Boundary Limit Enforcement**: Names, occupations, locations, and descriptions must not exceed maximum specified length limits (preventing Denial-of-Wallet attacks).
5. **Connection Smoke-Test Invariant**: `/test/{testId}` allows safe verification reads for the client connection checker without exposing operational business data.
6. **Administrator Bootstrapping**: Admin capabilities are strictly bounded to authenticated, verified admin emails (`hfirdaus2000@gmail.com` and `irfanhaikal03@gmail.com`) or explicit `/admins/{uid}` records.

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing - Participant)**: Non-admin user tries to write a participant with `ownerId: "victim-uid"` while authenticated as `attacker-uid`.
2. **Payload 2 (Unauthenticated Write - Participant)**: Anonymous/unauthenticated user tries to create or update a participant record.
3. **Payload 3 (Oversized Name Attack - Denial of Wallet)**: A payload where `name` is a 2MB generated string exceeding `maxLength: 150`.
4. **Payload 4 (Privileged Status Override)**: Non-admin user attempts to create or update `saved_match_sessions` with `isPublished: true`.
5. **Payload 5 (Unpublished Session Snoop)**: Non-admin user attempts to read a draft `saved_match_sessions` doc where `isPublished: false`.
6. **Payload 6 (Invalid Document ID)**: An attempt to write a document using an invalid ID with path poisoning characters like `../../hack`.
7. **Payload 7 (Invalid Age Boundary)**: A participant payload with `age: 12` or `age: 200` violating age range limits.
8. **Payload 8 (Invalid Gender Value)**: A participant payload with `gender: "Alien"` bypassing enum constraints.
9. **Payload 9 (Malicious Match Result Injection)**: Non-admin attendee attempts to inject fake match pairings with 100% score directly into `/matches`.
10. **Payload 10 (Admin Role Spoofing)**: Non-admin user writes their own document into `/admins/{theirUid}` to escalate privileges.
11. **Payload 11 (Oversized Hobbies Array)**: A participant payload containing 500 hobby items to trigger excessive storage and compute.
12. **Payload 12 (Photo Quota Overflow)**: A photo string exceeding 500,000 characters injected directly into Firestore document.

---

## 3. Firestore Rules Verification Plan
All 12 dirty payloads are rejected by Firestore Security Rules with `PERMISSION_DENIED`.
Rules enforce:
- Strict field presence and size checks
- `isValidId(docId)` regex and length guards
- Admin check with verified emails
- Conditional read for sessions based on `isPublished`

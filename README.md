## SmartShooter — Sprint 1 (MVP Setup)
- Live: https://<your-vercel-url>
- Auth: Google + Email/Password
- Protected routes, blank dashboard

## v0.2.0 — Sprint 2 (Sessions CRUD)
- Sessions: create/edit/delete with 5 positions per round
- Round-level range (paint/midrange/3pt) and shots/round (5/10/20)
- Auto-filled attempts per position; made is clamped to attempts
- Dashboard list with accuracy %
- Firestore rules for ownership & basic schema checks
- Composite index: sessions(userId ASC, date DESC)

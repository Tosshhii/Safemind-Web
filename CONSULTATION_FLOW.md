# Consultation Request Flow

## Overview
The system now uses a two-step confirmation flow to prevent unauthorized calendar entries:

1. **Mobile App**: User requests a consultation → writes to `consultationRequests` (status: `pending`)
2. **Admin Dashboard**: Admin reviews pending requests → clicks "Confirm" → creates `bookedSlots` entry (status: `confirmed`)
3. **Calendar**: Only `confirmed` bookings appear on the calendar

## Collections & Fields

### `consultationRequests` (Mobile app writes here)
```
{
  userId: "user-uid",           // User requesting the consultation
  date: "23/11/2025",           // Format: DD/MM/YYYY
  time: "08:00-09:00",          // Format: HH:MM-HH:MM
  status: "pending",            // Options: 'pending', 'confirmed', 'declined'
  requestedAt: <timestamp>,     // Server timestamp
  name: "Patient Name"          // For admin reference
}
```

### `bookedSlots` (Admin creates here after confirming)
```
{
  userId: "user-uid",           // Patient user ID
  date: "23/11/2025",           // Format: DD/MM/YYYY
  time: "08:00-09:00",          // Format: HH:MM-HH:MM
  status: "confirmed",          // Must be 'confirmed' to appear on calendar
  createdAt: <timestamp>,       // Server timestamp
  createdBy: "admin-uid"        // Admin who confirmed
}
```

## Mobile App Changes Required

Your mobile app must:
1. Write to `consultationRequests` collection (NOT `bookedSlots`)
2. Set `status: 'pending'` in the request
3. Include fields: `userId`, `date`, `time`, `requestedAt`, optionally `name`

See `MOBILE_APP_EXAMPLE.js` for code template.

## Firestore Rules

- **Mobile users** can CREATE `consultationRequests` but CANNOT write to `bookedSlots`
- **Admin only** can CREATE/UPDATE/DELETE `bookedSlots`
- **Admin only** can change `consultationRequests` status from `pending` → `confirmed` or `declined`

## Web Admin Dashboard

- **Pending Consultation Requests** section shows all requests with `status: 'pending'`
- Admin clicks **"Confirm"** → creates `bookedSlots` entry with `status: 'confirmed'` → appears on calendar
- Admin clicks **"Decline"** → updates request to `status: 'declined'` → request disappears from pending list

## Troubleshooting

If pending requests don't appear on dashboard:

1. **Check browser console** (F12 → Console):
   - Look for error messages about `consultationRequests`
   - Common errors:
     - `permission-denied` → Firestore rules blocking read
     - `not-found` → No requests in database
     - `failed-precondition` → Missing database index (Firebase offers link to create)

2. **Verify Firestore data**:
   - Open Firebase Console → Firestore Database
   - Check `consultationRequests` collection
   - Verify request documents have `status: 'pending'`

3. **Verify Firestore rules**:
   - Deploy latest rules: `firebase deploy --only firestore:rules`
   - Rules allow admin to read `consultationRequests`

## Next Steps

1. Update mobile app to write to `consultationRequests` (use `MOBILE_APP_EXAMPLE.js` as template)
2. Deploy updated Firestore rules: `firebase deploy --only firestore:rules`
3. Test: Create a consultation request from mobile app → verify it appears in admin dashboard pending list
4. Admin confirms → verify it appears on calendar as a booked appointment

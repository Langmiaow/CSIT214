# 90-second presentation flow

## Scenario A — Successful booking

1. Open **Book**.
2. Select a facility such as **Harbour Sports Court**.
3. Choose a future date and a free one-hour time slot.
4. Click **Check availability** and show the successful availability feedback.
5. Enter a name, email and purpose, then submit the booking request.
6. Note the generated `CL-XXXXXX` reference and show the **Pending** result.
7. Open **Staff**, locate the new pending booking and approve it.
8. Open **My Booking**, use the reference and show that the result is now **Approved**.

This demonstrates the complete end-to-end scenario:

**Facility Search → Availability Check → Booking Request → Conflict Detection → Staff Approval → Booking Result**

## Scenario B — Conflict detection

The right sidebar on **Book** shows a seeded conflict example. Select **Oceanview Community Hall** and use the displayed date with a time overlapping 10:00–12:00.

The availability request should return a conflict warning and prevent the booking from being submitted.

## Scenario C — Rejection feedback

1. Submit another free booking request.
2. Open **Staff**.
3. Enter a rejection reason and reject the request.
4. Look up its reference in **My Booking** and show the rejected status and feedback.

## Before presenting

- Open **Staff** and click **Reset demo data** if the sample conflict date has passed or the demo database has been changed heavily.
- Keep the backend and frontend terminal windows visible in case the tutor asks about architecture.
- Capture report screenshots from the real running prototype, not mock-ups.

## Suggested report screenshots

- Facility search results
- Successful availability check
- Conflict-detection warning
- Booking request form
- Pending booking result with reference
- Staff approval/rejection screen
- Approved or rejected booking lookup result

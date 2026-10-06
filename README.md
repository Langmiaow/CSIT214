# CoastLink Community Facility Booking Prototype

A small end-to-end prototype for the CSIT214 Community Facility and Maintenance Management System project.

## Prototype scope

The implemented workflow is deliberately focused on the approved core scenario:

**Facility Search → Availability Check → Booking Request → Conflict Detection → Staff Approval / Rejection → Booking Result**

The broader product design may include maintenance reporting, facility closures, utilisation reporting and audit history, but those functions are outside this prototype implementation.

## Technology

- React + Vite
- Material UI
- Flask
- SQLite (Python built-in `sqlite3`, no ORM)

The frontend intentionally follows the same restrained visual and code style as CoursePath: Montserrat typography, light grey navigation, simple bordered content blocks, Material UI components, and component-local `sx` styling rather than a large custom design system.

## Run locally

### 1. Backend

From the project root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

macOS / Linux:

```bash
source .venv/bin/activate
```

Install Flask and start the API:

```bash
pip install -r requirements.txt
python app.py
```

The backend runs on `http://127.0.0.1:5000`.

The SQLite database is created automatically in `backend/data/coastlink.db` and is seeded with fictional facilities plus two demonstration bookings.

### 2. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`).

## Presentation demo

A reliable presentation flow is:

1. Open **Book** and select a facility.
2. Check an available future time.
3. Submit a booking request and note the generated reference.
4. Open **Staff**, find the pending request, then approve it.
5. Open **My Booking**, enter the reference, and show the approved result.
6. Return to **Book** and use the Conflict demo date/time shown in the right sidebar to demonstrate conflict detection.

The Staff page includes **Reset demo data** so the seeded demonstration state can be restored before another run.

## Sample seeded data

The backend always creates fictional sample data. It includes:

- six CoastLink Council facilities;
- one approved booking used to demonstrate time conflict detection; and
- one pending booking (`CL-PENDING`) so the Staff screen is never empty during a demo.

The exact conflict-demo date is generated relative to the day the database is first created and is displayed automatically in the frontend.

## API endpoints

- `GET /api/health`
- `GET /api/facilities`
- `GET /api/facilities/<id>`
- `GET /api/availability`
- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/<reference>`
- `PATCH /api/bookings/<id>/decision`
- `GET /api/demo-info`
- `POST /api/demo/reset`

## Backend tests

From `backend/` after installing Flask:

```bash
python -m unittest discover -s tests -v
```

The tests cover seeded facilities, conflict detection, booking creation, approval, lookup, and rejection validation.

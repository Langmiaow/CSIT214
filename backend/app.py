import os
import sqlite3
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

from flask import Flask, jsonify, request


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / 'data' / 'coastlink.db'


FACILITIES = [
    (
        'Oceanview Community Hall',
        'Community Hall',
        'Oceanview Precinct',
        120,
        'Large flexible hall suitable for community meetings, classes and local events.'
    ),
    (
        'Coral Bay Meeting Room',
        'Meeting Room',
        'Coral Bay Library',
        18,
        'Quiet meeting room with presentation space for small groups and committees.'
    ),
    (
        'Harbour Sports Court',
        'Sports Facility',
        'Harbour Recreation Centre',
        40,
        'Indoor multi-purpose court for training sessions and community sport activities.'
    ),
    (
        'Seaview Workshop Studio',
        'Workshop Space',
        'Seaview Community Hub',
        24,
        'Practical workshop room with movable tables and easy-clean work surfaces.'
    ),
    (
        'Lakeside Function Room',
        'Function Room',
        'Lakeside Pavilion',
        70,
        'Medium-sized function room for community events, workshops and information sessions.'
    ),
    (
        'Northside Activity Room',
        'Activity Room',
        'Northside Neighbourhood Centre',
        32,
        'Accessible activity room designed for clubs, classes and regular community programs.'
    )
]


def create_app(db_path=None):
    app = Flask(__name__)
    app.config['DB_PATH'] = Path(
        db_path or os.environ.get('COASTLINK_DB_PATH', DEFAULT_DB_PATH)
    )

    @app.after_request
    def add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PATCH, OPTIONS'
        return response

    @app.route('/api/<path:path>', methods=['OPTIONS'])
    def options(path):
        return ('', 204)

    @app.get('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    @app.get('/api/facilities')
    def get_facilities():
        search = request.args.get('search', '').strip()
        facility_type = request.args.get('type', '').strip()
        capacity = request.args.get('capacity', '').strip()

        query = 'SELECT * FROM facilities WHERE 1 = 1'
        params = []

        if search:
            query += ' AND (LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(description) LIKE ?)'
            term = f'%{search.lower()}%'
            params.extend([term, term, term])

        if facility_type:
            query += ' AND type = ?'
            params.append(facility_type)

        if capacity:
            try:
                minimum_capacity = int(capacity)
            except ValueError:
                return jsonify({'error': 'Capacity must be a number.'}), 400

            query += ' AND capacity >= ?'
            params.append(minimum_capacity)

        query += ' ORDER BY name'

        with get_db(app) as connection:
            rows = connection.execute(query, params).fetchall()

        return jsonify({
            'facilities': [dict(row) for row in rows]
        })

    @app.get('/api/facilities/<int:facility_id>')
    def get_facility(facility_id):
        with get_db(app) as connection:
            row = connection.execute(
                'SELECT * FROM facilities WHERE id = ?',
                (facility_id,)
            ).fetchone()

        if not row:
            return jsonify({'error': 'Facility not found.'}), 404

        return jsonify({'facility': dict(row)})

    @app.get('/api/availability')
    def availability():
        try:
            facility_id = int(request.args.get('facility_id', ''))
        except ValueError:
            return jsonify({'error': 'A valid facility is required.'}), 400

        booking_date = request.args.get('date', '').strip()
        start_time = request.args.get('start_time', '').strip()
        end_time = request.args.get('end_time', '').strip()

        validation_error = validate_slot(booking_date, start_time, end_time)
        if validation_error:
            return jsonify({'error': validation_error}), 400

        with get_db(app) as connection:
            facility = connection.execute(
                'SELECT id, name FROM facilities WHERE id = ?',
                (facility_id,)
            ).fetchone()

            if not facility:
                return jsonify({'error': 'Facility not found.'}), 404

            conflict = find_conflict(
                connection,
                facility_id,
                booking_date,
                start_time,
                end_time
            )

        if conflict:
            return jsonify({
                'available': False,
                'message': 'This time overlaps with an existing pending or approved booking.',
                'conflict': {
                    'reference': conflict['reference'],
                    'start_time': conflict['start_time'],
                    'end_time': conflict['end_time'],
                    'status': conflict['status']
                }
            })

        return jsonify({
            'available': True,
            'message': f'{facility["name"]} is available for this time.'
        })

    @app.post('/api/bookings')
    def create_booking():
        payload = request.get_json(silent=True) or {}

        required_fields = [
            'facility_id',
            'customer_name',
            'email',
            'purpose',
            'date',
            'start_time',
            'end_time'
        ]

        missing_fields = [
            field for field in required_fields
            if not str(payload.get(field, '')).strip()
        ]

        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}.'
            }), 400

        try:
            facility_id = int(payload['facility_id'])
        except (TypeError, ValueError):
            return jsonify({'error': 'A valid facility is required.'}), 400

        email = str(payload['email']).strip()
        if '@' not in email or email.startswith('@') or email.endswith('@'):
            return jsonify({'error': 'Enter a valid email address.'}), 400

        validation_error = validate_slot(
            str(payload['date']).strip(),
            str(payload['start_time']).strip(),
            str(payload['end_time']).strip()
        )
        if validation_error:
            return jsonify({'error': validation_error}), 400

        reference = create_reference()

        with get_db(app) as connection:
            connection.execute('BEGIN IMMEDIATE')

            facility = connection.execute(
                'SELECT id FROM facilities WHERE id = ?',
                (facility_id,)
            ).fetchone()

            if not facility:
                connection.rollback()
                return jsonify({'error': 'Facility not found.'}), 404

            conflict = find_conflict(
                connection,
                facility_id,
                str(payload['date']).strip(),
                str(payload['start_time']).strip(),
                str(payload['end_time']).strip()
            )

            if conflict:
                connection.rollback()
                return jsonify({
                    'error': 'This time is no longer available. Please choose another time.'
                }), 409

            cursor = connection.execute(
                '''
                INSERT INTO bookings (
                    reference,
                    facility_id,
                    customer_name,
                    email,
                    purpose,
                    date,
                    start_time,
                    end_time,
                    status,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
                ''',
                (
                    reference,
                    facility_id,
                    str(payload['customer_name']).strip(),
                    email,
                    str(payload['purpose']).strip(),
                    str(payload['date']).strip(),
                    str(payload['start_time']).strip(),
                    str(payload['end_time']).strip(),
                    datetime.now().isoformat(timespec='seconds')
                )
            )

            booking_id = cursor.lastrowid
            connection.commit()

            booking = fetch_booking_by_id(connection, booking_id)

        return jsonify({'booking': booking}), 201

    @app.get('/api/bookings')
    def get_bookings():
        status = request.args.get('status', '').strip().lower()

        if status and status not in {'pending', 'approved', 'rejected'}:
            return jsonify({'error': 'Invalid booking status.'}), 400

        query = '''
            SELECT
                b.*,
                f.name AS facility_name,
                f.location AS location,
                f.type AS facility_type
            FROM bookings b
            JOIN facilities f ON f.id = b.facility_id
        '''
        params = []

        if status:
            query += ' WHERE b.status = ?'
            params.append(status)

        query += '''
            ORDER BY
                CASE b.status
                    WHEN 'pending' THEN 0
                    WHEN 'approved' THEN 1
                    ELSE 2
                END,
                b.date,
                b.start_time,
                b.created_at DESC
        '''

        with get_db(app) as connection:
            rows = connection.execute(query, params).fetchall()

        return jsonify({'bookings': [dict(row) for row in rows]})

    @app.get('/api/bookings/<reference>')
    def get_booking(reference):
        with get_db(app) as connection:
            row = connection.execute(
                '''
                SELECT
                    b.*,
                    f.name AS facility_name,
                    f.location AS location,
                    f.type AS facility_type
                FROM bookings b
                JOIN facilities f ON f.id = b.facility_id
                WHERE UPPER(b.reference) = UPPER(?)
                ''',
                (reference.strip(),)
            ).fetchone()

        if not row:
            return jsonify({'error': 'Booking reference not found.'}), 404

        return jsonify({'booking': dict(row)})

    @app.patch('/api/bookings/<int:booking_id>/decision')
    def booking_decision(booking_id):
        payload = request.get_json(silent=True) or {}
        action = str(payload.get('action', '')).strip().lower()
        reason = str(payload.get('reason', '')).strip()

        if action not in {'approve', 'reject'}:
            return jsonify({'error': 'Decision must be approve or reject.'}), 400

        if action == 'reject' and not reason:
            return jsonify({'error': 'A rejection reason is required.'}), 400

        with get_db(app) as connection:
            booking = connection.execute(
                'SELECT * FROM bookings WHERE id = ?',
                (booking_id,)
            ).fetchone()

            if not booking:
                return jsonify({'error': 'Booking not found.'}), 404

            if booking['status'] != 'pending':
                return jsonify({'error': 'Only pending bookings can be changed.'}), 409

            if action == 'approve':
                approved_conflict = find_conflict(
                    connection,
                    booking['facility_id'],
                    booking['date'],
                    booking['start_time'],
                    booking['end_time'],
                    exclude_booking_id=booking_id,
                    statuses=('approved',)
                )

                if approved_conflict:
                    return jsonify({
                        'error': 'Another approved booking now conflicts with this request.'
                    }), 409

            new_status = 'approved' if action == 'approve' else 'rejected'
            decision_reason = '' if action == 'approve' else reason

            connection.execute(
                '''
                UPDATE bookings
                SET status = ?, decision_reason = ?, decided_at = ?
                WHERE id = ?
                ''',
                (
                    new_status,
                    decision_reason,
                    datetime.now().isoformat(timespec='seconds'),
                    booking_id
                )
            )
            connection.commit()

            updated = fetch_booking_by_id(connection, booking_id)

        return jsonify({'booking': updated})

    @app.get('/api/demo-info')
    def demo_info():
        with get_db(app) as connection:
            conflict = connection.execute(
                '''
                SELECT b.*, f.name AS facility_name
                FROM bookings b
                JOIN facilities f ON f.id = b.facility_id
                WHERE b.reference = 'CL-CONFLICT'
                '''
            ).fetchone()

            sample_pending = connection.execute(
                "SELECT reference FROM bookings WHERE reference = 'CL-PENDING'"
            ).fetchone()

        return jsonify({
            'conflict_example': {
                'facility': conflict['facility_name'],
                'date': conflict['date'],
                'start_time': conflict['start_time'],
                'end_time': conflict['end_time']
            } if conflict else None,
            'sample_pending_reference': sample_pending['reference'] if sample_pending else None
        })

    @app.post('/api/demo/reset')
    def reset_demo_endpoint():
        reset_demo_data(app)
        return jsonify({'status': 'reset'})

    init_db(app)
    return app


def get_db(app):
    db_path = Path(app.config['DB_PATH'])
    db_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    return connection


def init_db(app):
    with get_db(app) as connection:
        connection.executescript(
            '''
            CREATE TABLE IF NOT EXISTS facilities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                location TEXT NOT NULL,
                capacity INTEGER NOT NULL,
                description TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference TEXT NOT NULL UNIQUE,
                facility_id INTEGER NOT NULL,
                customer_name TEXT NOT NULL,
                email TEXT NOT NULL,
                purpose TEXT NOT NULL,
                date TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
                decision_reason TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                decided_at TEXT,
                FOREIGN KEY (facility_id) REFERENCES facilities(id)
            );

            CREATE INDEX IF NOT EXISTS idx_bookings_slot
            ON bookings (facility_id, date, start_time, end_time, status);
            '''
        )

        facility_count = connection.execute(
            'SELECT COUNT(*) AS count FROM facilities'
        ).fetchone()['count']

        if facility_count == 0:
            connection.executemany(
                '''
                INSERT INTO facilities (name, type, location, capacity, description)
                VALUES (?, ?, ?, ?, ?)
                ''',
                FACILITIES
            )

        booking_count = connection.execute(
            'SELECT COUNT(*) AS count FROM bookings'
        ).fetchone()['count']

        connection.commit()

    if booking_count == 0:
        seed_demo_bookings(app)


def reset_demo_data(app):
    with get_db(app) as connection:
        connection.execute('DELETE FROM bookings')
        connection.commit()

    seed_demo_bookings(app)


def seed_demo_bookings(app):
    conflict_date = (date.today() + timedelta(days=2)).isoformat()
    pending_date = (date.today() + timedelta(days=3)).isoformat()
    created_at = datetime.now().isoformat(timespec='seconds')

    with get_db(app) as connection:
        oceanview = connection.execute(
            "SELECT id FROM facilities WHERE name = 'Oceanview Community Hall'"
        ).fetchone()
        coral_bay = connection.execute(
            "SELECT id FROM facilities WHERE name = 'Coral Bay Meeting Room'"
        ).fetchone()

        connection.execute(
            '''
            INSERT INTO bookings (
                reference, facility_id, customer_name, email, purpose,
                date, start_time, end_time, status, created_at, decided_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)
            ''',
            (
                'CL-CONFLICT',
                oceanview['id'],
                'CoastLink Community Group',
                'sample@coastlink.example',
                'Existing approved community program',
                conflict_date,
                '10:00',
                '12:00',
                created_at,
                created_at
            )
        )

        connection.execute(
            '''
            INSERT INTO bookings (
                reference, facility_id, customer_name, email, purpose,
                date, start_time, end_time, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            ''',
            (
                'CL-PENDING',
                coral_bay['id'],
                'Alex Morgan',
                'alex@example.com',
                'Community committee meeting',
                pending_date,
                '14:00',
                '15:00',
                created_at
            )
        )

        connection.commit()


def validate_slot(booking_date, start_time, end_time):
    try:
        parsed_date = datetime.strptime(booking_date, '%Y-%m-%d').date()
        parsed_start = datetime.strptime(start_time, '%H:%M').time()
        parsed_end = datetime.strptime(end_time, '%H:%M').time()
    except ValueError:
        return 'Use a valid date and time.'

    if parsed_end <= parsed_start:
        return 'End time must be later than start time.'

    if parsed_date < date.today():
        return 'Booking date cannot be in the past.'

    return None


def find_conflict(
    connection,
    facility_id,
    booking_date,
    start_time,
    end_time,
    exclude_booking_id=None,
    statuses=('pending', 'approved')
):
    placeholders = ','.join('?' for _ in statuses)

    query = f'''
        SELECT *
        FROM bookings
        WHERE facility_id = ?
          AND date = ?
          AND status IN ({placeholders})
          AND start_time < ?
          AND end_time > ?
    '''

    params = [
        facility_id,
        booking_date,
        *statuses,
        end_time,
        start_time
    ]

    if exclude_booking_id is not None:
        query += ' AND id != ?'
        params.append(exclude_booking_id)

    query += ' ORDER BY start_time LIMIT 1'

    return connection.execute(query, params).fetchone()


def fetch_booking_by_id(connection, booking_id):
    row = connection.execute(
        '''
        SELECT
            b.*,
            f.name AS facility_name,
            f.location AS location,
            f.type AS facility_type
        FROM bookings b
        JOIN facilities f ON f.id = b.facility_id
        WHERE b.id = ?
        ''',
        (booking_id,)
    ).fetchone()

    return dict(row)


def create_reference():
    return f'CL-{uuid.uuid4().hex[:6].upper()}'


app = create_app()


if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)

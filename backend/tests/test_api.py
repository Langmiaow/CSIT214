import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path

from app import create_app


class CoastLinkApiTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        db_path = Path(self.temp_dir.name) / 'test.db'

        self.app = create_app(db_path)
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_facilities_are_seeded(self):
        response = self.client.get('/api/facilities')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.get_json()['facilities']), 6)

    def test_conflict_is_detected(self):
        demo = self.client.get('/api/demo-info').get_json()['conflict_example']
        facilities = self.client.get('/api/facilities?search=Oceanview').get_json()['facilities']

        response = self.client.get(
            '/api/availability',
            query_string={
                'facility_id': facilities[0]['id'],
                'date': demo['date'],
                'start_time': '11:00',
                'end_time': '11:30'
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()['available'])

    def test_end_to_end_booking_and_approval(self):
        facilities = self.client.get('/api/facilities?search=Harbour').get_json()['facilities']
        booking_date = (date.today() + timedelta(days=5)).isoformat()

        create_response = self.client.post(
            '/api/bookings',
            json={
                'facility_id': facilities[0]['id'],
                'customer_name': 'Test User',
                'email': 'test@example.com',
                'purpose': 'Integration test',
                'date': booking_date,
                'start_time': '09:00',
                'end_time': '10:00'
            }
        )

        self.assertEqual(create_response.status_code, 201)
        booking = create_response.get_json()['booking']
        self.assertEqual(booking['status'], 'pending')

        approve_response = self.client.patch(
            f"/api/bookings/{booking['id']}/decision",
            json={'action': 'approve', 'reason': ''}
        )

        self.assertEqual(approve_response.status_code, 200)
        self.assertEqual(approve_response.get_json()['booking']['status'], 'approved')

        lookup_response = self.client.get(f"/api/bookings/{booking['reference']}")
        self.assertEqual(lookup_response.status_code, 200)
        self.assertEqual(lookup_response.get_json()['booking']['status'], 'approved')

    def test_rejection_requires_reason(self):
        pending = self.client.get('/api/bookings/CL-PENDING').get_json()['booking']

        response = self.client.patch(
            f"/api/bookings/{pending['id']}/decision",
            json={'action': 'reject', 'reason': ''}
        )

        self.assertEqual(response.status_code, 400)


if __name__ == '__main__':
    unittest.main()

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
        throw new Error(data.error || 'Request failed.')
    }

    return data
}

export function fetchFacilities(filters = {}) {
    const params = new URLSearchParams()

    if (filters.search) params.set('search', filters.search)
    if (filters.type) params.set('type', filters.type)
    if (filters.capacity) params.set('capacity', filters.capacity)

    const query = params.toString()

    return request(`/facilities${query ? `?${query}` : ''}`)
}

export function fetchAvailability({ facilityId, date, startTime, endTime }) {
    const params = new URLSearchParams({
        facility_id: String(facilityId),
        date,
        start_time: startTime,
        end_time: endTime
    })

    return request(`/availability?${params.toString()}`)
}

export function createBooking(payload) {
    return request('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
    })
}

export function fetchBooking(reference) {
    return request(`/bookings/${encodeURIComponent(reference)}`)
}

export function fetchBookings(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return request(`/bookings${query}`)
}

export function decideBooking(bookingId, action, reason = '') {
    return request(`/bookings/${bookingId}/decision`, {
        method: 'PATCH',
        body: JSON.stringify({ action, reason })
    })
}

export function fetchDemoInfo() {
    return request('/demo-info')
}

export function resetDemo() {
    return request('/demo/reset', {
        method: 'POST'
    })
}

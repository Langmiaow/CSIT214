import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
    createBooking,
    fetchAvailability,
    fetchDemoInfo,
    fetchFacilities
} from '../lib/api'

function BookFacility({ onBookingCreated, onOpenBooking }) {
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        capacity: ''
    })

    const [facilities, setFacilities] = useState([])
    const [selectedFacility, setSelectedFacility] = useState(null)
    const [loadingFacilities, setLoadingFacilities] = useState(true)
    const [facilityError, setFacilityError] = useState('')

    const [slot, setSlot] = useState({
        date: '',
        startTime: '10:00',
        endTime: '11:00'
    })

    const [availability, setAvailability] = useState(null)
    const [checkingAvailability, setCheckingAvailability] = useState(false)

    const [bookingForm, setBookingForm] = useState({
        customerName: '',
        email: '',
        purpose: ''
    })

    const [booking, setBooking] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const [bookingError, setBookingError] = useState('')
    const [demoInfo, setDemoInfo] = useState(null)

    useEffect(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)

        setSlot((previous) => ({
            ...previous,
            date: tomorrow.toISOString().slice(0, 10)
        }))

        loadFacilities()
        loadDemoInfo()
    }, [])

    async function loadFacilities(nextFilters = filters) {
        setLoadingFacilities(true)
        setFacilityError('')

        try {
            const data = await fetchFacilities(nextFilters)
            setFacilities(data.facilities)

            if (
                selectedFacility &&
                !data.facilities.some((facility) => facility.id === selectedFacility.id)
            ) {
                setSelectedFacility(null)
            }
        } catch (error) {
            setFacilityError(error.message)
        } finally {
            setLoadingFacilities(false)
        }
    }

    async function loadDemoInfo() {
        try {
            const data = await fetchDemoInfo()
            setDemoInfo(data)
        } catch (error) {
            console.log('Unable to load demo information:', error.message)
        }
    }

    function handleFilterChange(field, value) {
        setFilters((previous) => ({
            ...previous,
            [field]: value
        }))
    }

    function handleSelectFacility(facility) {
        setSelectedFacility(facility)
        setAvailability(null)
        setBooking(null)
        setBookingError('')
    }

    async function handleCheckAvailability() {
        if (!selectedFacility) return

        setCheckingAvailability(true)
        setAvailability(null)
        setBooking(null)
        setBookingError('')

        try {
            const data = await fetchAvailability({
                facilityId: selectedFacility.id,
                date: slot.date,
                startTime: slot.startTime,
                endTime: slot.endTime
            })

            setAvailability(data)
        } catch (error) {
            setAvailability({
                available: false,
                message: error.message
            })
        } finally {
            setCheckingAvailability(false)
        }
    }

    async function handleSubmitBooking(event) {
        event.preventDefault()

        if (!selectedFacility || !availability?.available) return

        setSubmitting(true)
        setBookingError('')

        try {
            const data = await createBooking({
                facility_id: selectedFacility.id,
                customer_name: bookingForm.customerName,
                email: bookingForm.email,
                purpose: bookingForm.purpose,
                date: slot.date,
                start_time: slot.startTime,
                end_time: slot.endTime
            })

            setBooking(data.booking)
            setAvailability(null)
            onBookingCreated(data.booking.reference)
        } catch (error) {
            setBookingError(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const facilityTypes = [
        'Community Hall',
        'Meeting Room',
        'Sports Facility',
        'Workshop Space',
        'Function Room',
        'Activity Room'
    ]

    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: {
                    xs: '1fr',
                    lg: 'minmax(230px, 17vw) 1fr minmax(240px, 18vw)'
                },
                width: '100%',
                columnGap: 4,
                rowGap: 4,
                paddingLeft: 4,
                paddingRight: 4,
                paddingTop: 6,
                paddingBottom: 4,
                alignItems: 'start'
            }}
        >
            <Box>
                <Typography variant="h4" sx={{ marginBottom: 1 }}>
                    Find a facility
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
                    Search CoastLink Council facilities and check a time before booking.
                </Typography>

                <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    placeholder="Hall, room, sports..."
                    value={filters.search}
                    onChange={(event) => handleFilterChange('search', event.target.value)}
                    sx={{ marginBottom: 2 }}
                />

                <FormControl fullWidth size="small" sx={{ marginBottom: 2 }}>
                    <InputLabel>Facility type</InputLabel>
                    <Select
                        label="Facility type"
                        value={filters.type}
                        onChange={(event) => handleFilterChange('type', event.target.value)}
                    >
                        <MenuItem value="">All types</MenuItem>
                        {facilityTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Minimum capacity"
                    value={filters.capacity}
                    onChange={(event) => handleFilterChange('capacity', event.target.value)}
                    inputProps={{ min: 1 }}
                    sx={{ marginBottom: 2 }}
                />

                <Button
                    fullWidth
                    variant="contained"
                    onClick={() => loadFacilities()}
                >
                    Search facilities
                </Button>
            </Box>

            <Box sx={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 1,
                        minHeight: 36
                    }}
                >
                    <Typography variant="h5">
                        Facilities
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        {facilities.length} result{facilities.length === 1 ? '' : 's'}
                    </Typography>
                </Box>

                {facilityError && (
                    <Alert severity="error" sx={{ marginBottom: 2 }}>
                        {facilityError}
                    </Alert>
                )}

                {loadingFacilities ? (
                    <Typography color="text.secondary">
                        Loading facilities...
                    </Typography>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                        {facilities.length === 0 && (
                            <Box sx={{ padding: 3, border: '1px solid #ddd', borderRadius: 2 }}>
                                <Typography color="text.secondary">
                                    No facilities match these filters.
                                </Typography>
                            </Box>
                        )}

                        {facilities.map((facility) => (
                            <Box
                                key={facility.id}
                                sx={{
                                    padding: 2,
                                    border: selectedFacility?.id === facility.id
                                        ? '2px solid #1976d2'
                                        : '1px solid #ddd',
                                    borderRadius: 2,
                                    backgroundColor: 'white'
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: 2,
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <Box>
                                        <Typography variant="h6">
                                            {facility.name}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary">
                                            {facility.type} · {facility.location} · Capacity {facility.capacity}
                                        </Typography>

                                        <Typography variant="body2" sx={{ marginTop: 1 }}>
                                            {facility.description}
                                        </Typography>
                                    </Box>

                                    <Button
                                        variant={selectedFacility?.id === facility.id ? 'contained' : 'outlined'}
                                        onClick={() => handleSelectFacility(facility)}
                                    >
                                        {selectedFacility?.id === facility.id ? 'Selected' : 'Select'}
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {selectedFacility && (
                    <Box
                        sx={{
                            marginTop: 3,
                            border: '1px solid #ddd',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{ padding: '12px 16px', backgroundColor: '#f4f6f8' }}
                        >
                            Check availability
                        </Typography>

                        <Box sx={{ padding: 2 }}>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', sm: '1.3fr 1fr 1fr' },
                                    gap: 2
                                }}
                            >
                                <TextField
                                    type="date"
                                    size="small"
                                    label="Date"
                                    value={slot.date}
                                    onChange={(event) => {
                                        setSlot((previous) => ({ ...previous, date: event.target.value }))
                                        setAvailability(null)
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    type="time"
                                    size="small"
                                    label="Start"
                                    value={slot.startTime}
                                    onChange={(event) => {
                                        setSlot((previous) => ({ ...previous, startTime: event.target.value }))
                                        setAvailability(null)
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <TextField
                                    type="time"
                                    size="small"
                                    label="End"
                                    value={slot.endTime}
                                    onChange={(event) => {
                                        setSlot((previous) => ({ ...previous, endTime: event.target.value }))
                                        setAvailability(null)
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Box>

                            <Button
                                variant="contained"
                                disabled={checkingAvailability || !slot.date}
                                onClick={handleCheckAvailability}
                                sx={{ marginTop: 2 }}
                            >
                                {checkingAvailability ? 'Checking...' : 'Check availability'}
                            </Button>

                            {availability && (
                                <Alert
                                    severity={availability.available ? 'success' : 'warning'}
                                    sx={{ marginTop: 2 }}
                                >
                                    {availability.message}
                                </Alert>
                            )}

                            {availability?.available && (
                                <>
                                    <Divider sx={{ marginTop: 3, marginBottom: 3 }} />

                                    <Typography variant="h6" sx={{ marginBottom: 2 }}>
                                        Booking request
                                    </Typography>

                                    <Box component="form" onSubmit={handleSubmitBooking}>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                                gap: 2
                                            }}
                                        >
                                            <TextField
                                                required
                                                size="small"
                                                label="Your name"
                                                value={bookingForm.customerName}
                                                onChange={(event) => setBookingForm((previous) => ({
                                                    ...previous,
                                                    customerName: event.target.value
                                                }))}
                                            />

                                            <TextField
                                                required
                                                size="small"
                                                type="email"
                                                label="Email"
                                                value={bookingForm.email}
                                                onChange={(event) => setBookingForm((previous) => ({
                                                    ...previous,
                                                    email: event.target.value
                                                }))}
                                            />
                                        </Box>

                                        <TextField
                                            required
                                            fullWidth
                                            multiline
                                            minRows={2}
                                            size="small"
                                            label="Purpose of booking"
                                            value={bookingForm.purpose}
                                            onChange={(event) => setBookingForm((previous) => ({
                                                ...previous,
                                                purpose: event.target.value
                                            }))}
                                            sx={{ marginTop: 2 }}
                                        />

                                        {bookingError && (
                                            <Alert severity="error" sx={{ marginTop: 2 }}>
                                                {bookingError}
                                            </Alert>
                                        )}

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={submitting}
                                            sx={{ marginTop: 2 }}
                                        >
                                            {submitting ? 'Submitting...' : 'Submit booking request'}
                                        </Button>
                                    </Box>
                                </>
                            )}

                            {booking && (
                                <Alert severity="success" sx={{ marginTop: 2 }}>
                                    <Typography sx={{ fontWeight: 600 }}>
                                        Booking request submitted
                                    </Typography>
                                    <Typography variant="body2" sx={{ marginTop: 0.5 }}>
                                        Reference: <strong>{booking.reference}</strong> · Status: Pending approval
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={onOpenBooking}
                                        sx={{ marginTop: 1, paddingLeft: 0 }}
                                    >
                                        Check booking status
                                    </Button>
                                </Alert>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            <Box>
                <Typography variant="h6" sx={{ marginBottom: 1 }}>
                    Demo guide
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    1. Select a facility and time.<br />
                    2. Check availability and submit a booking.<br />
                    3. Approve or reject it from the Staff tab.<br />
                    4. Look up the reference from My Booking.
                </Typography>

                {selectedFacility && (
                    <Box
                        sx={{
                            marginTop: 3,
                            padding: 2,
                            border: '1px solid #ddd',
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            Selected facility
                        </Typography>
                        <Typography sx={{ fontWeight: 600, marginTop: 0.5 }}>
                            {selectedFacility.name}
                        </Typography>
                        <Typography variant="body2" sx={{ marginTop: 0.5 }}>
                            {selectedFacility.location}
                        </Typography>
                        <Chip
                            size="small"
                            label={`Capacity ${selectedFacility.capacity}`}
                            sx={{ marginTop: 1 }}
                        />
                    </Box>
                )}

                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', marginTop: 3, lineHeight: 1.6 }}
                >
                    This prototype uses fictional sample data and implements the approved booking workflow only.
                    Maintenance functions remain part of the complete product design.
                </Typography>

                {demoInfo?.conflict_example && (
                    <Box
                        sx={{
                            marginTop: 3,
                            padding: 2,
                            backgroundColor: '#f4f6f8',
                            borderRadius: 2
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Conflict demo
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ marginTop: 1, lineHeight: 1.6 }}>
                            {demoInfo.conflict_example.facility}<br />
                            {demoInfo.conflict_example.date}<br />
                            {demoInfo.conflict_example.start_time}–{demoInfo.conflict_example.end_time}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    )
}

export default BookFacility

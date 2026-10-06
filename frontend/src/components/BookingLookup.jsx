import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { fetchBooking } from '../lib/api'

function BookingLookup({ initialReference = '' }) {
    const [reference, setReference] = useState('')
    const [booking, setBooking] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        if (initialReference) {
            setReference(initialReference)
        }
    }, [initialReference])

    async function handleLookup(event) {
        event.preventDefault()

        if (!reference.trim()) return

        setLoading(true)
        setErrorMessage('')
        setBooking(null)

        try {
            const data = await fetchBooking(reference.trim().toUpperCase())
            setBooking(data.booking)
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    function getStatusColor(status) {
        if (status === 'approved') return 'success'
        if (status === 'rejected') return 'error'
        return 'warning'
    }

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
                    My booking
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Enter the reference shown after submitting your request to view its current status.
                </Typography>
            </Box>

            <Box sx={{ width: '100%', maxWidth: 760, margin: '0 auto' }}>
                <Typography variant="h5" sx={{ marginBottom: 2 }}>
                    Booking status
                </Typography>

                <Box component="form" onSubmit={handleLookup} sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Booking reference"
                        placeholder="CL-ABC123"
                        value={reference}
                        onChange={(event) => setReference(event.target.value)}
                    />
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Checking...' : 'Look up'}
                    </Button>
                </Box>

                {errorMessage && (
                    <Alert severity="error" sx={{ marginTop: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                {booking && (
                    <Box
                        sx={{
                            marginTop: 3,
                            border: '1px solid #ddd',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                padding: 2,
                                backgroundColor: '#f4f6f8',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 2
                            }}
                        >
                            <Box>
                                <Typography variant="h6">
                                    {booking.facility_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Reference {booking.reference}
                                </Typography>
                            </Box>

                            <Chip
                                label={booking.status.toUpperCase()}
                                color={getStatusColor(booking.status)}
                                size="small"
                            />
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                                gap: 2,
                                padding: 2
                            }}
                        >
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Date and time
                                </Typography>
                                <Typography>
                                    {booking.date} · {booking.start_time}–{booking.end_time}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Location
                                </Typography>
                                <Typography>
                                    {booking.location}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Booked by
                                </Typography>
                                <Typography>
                                    {booking.customer_name}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Purpose
                                </Typography>
                                <Typography>
                                    {booking.purpose}
                                </Typography>
                            </Box>
                        </Box>

                        {booking.status === 'rejected' && booking.decision_reason && (
                            <Alert severity="error" sx={{ margin: 2, marginTop: 0 }}>
                                Rejection reason: {booking.decision_reason}
                            </Alert>
                        )}

                        {booking.status === 'pending' && (
                            <Alert severity="info" sx={{ margin: 2, marginTop: 0 }}>
                                Your request is waiting for Council staff review.
                            </Alert>
                        )}

                        {booking.status === 'approved' && (
                            <Alert severity="success" sx={{ margin: 2, marginTop: 0 }}>
                                Your booking has been approved.
                            </Alert>
                        )}
                    </Box>
                )}
            </Box>

            <Box>
                <Typography variant="h6" sx={{ marginBottom: 1 }}>
                    Status guide
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    <strong>Pending</strong> — waiting for staff review.<br />
                    <strong>Approved</strong> — the facility is confirmed.<br />
                    <strong>Rejected</strong> — the request was declined with a reason.
                </Typography>
            </Box>
        </Box>
    )
}

export default BookingLookup

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
    decideBooking,
    fetchBookings,
    resetDemo
} from '../lib/api'

function StaffBookings() {
    const [bookings, setBookings] = useState([])
    const [statusFilter, setStatusFilter] = useState('pending')
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [decisionReasons, setDecisionReasons] = useState({})
    const [processingId, setProcessingId] = useState(null)
    const [notice, setNotice] = useState('')

    useEffect(() => {
        loadBookings()
    }, [statusFilter])

    async function loadBookings() {
        setLoading(true)
        setErrorMessage('')

        try {
            const data = await fetchBookings(statusFilter === 'all' ? '' : statusFilter)
            setBookings(data.bookings)
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleDecision(booking, action) {
        const reason = decisionReasons[booking.id] || ''

        if (action === 'reject' && !reason.trim()) {
            setErrorMessage('Enter a rejection reason before rejecting the booking.')
            return
        }

        setProcessingId(booking.id)
        setErrorMessage('')
        setNotice('')

        try {
            await decideBooking(booking.id, action, reason.trim())
            setNotice(`Booking ${booking.reference} ${action === 'approve' ? 'approved' : 'rejected'}.`)
            await loadBookings()
        } catch (error) {
            setErrorMessage(error.message)
        } finally {
            setProcessingId(null)
        }
    }

    async function handleResetDemo() {
        if (!window.confirm('Reset all demo bookings to the original sample data?')) {
            return
        }

        setErrorMessage('')
        setNotice('')

        try {
            await resetDemo()
            setNotice('Demo data reset.')
            await loadBookings()
        } catch (error) {
            setErrorMessage(error.message)
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
                    Staff review
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 3 }}>
                    Review community booking requests and record an approval decision.
                </Typography>

                <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                        label="Status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                        <MenuItem value="all">All bookings</MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    fullWidth
                    onClick={loadBookings}
                    sx={{ marginTop: 2 }}
                >
                    Refresh
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
                        Booking requests
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {bookings.length} shown
                    </Typography>
                </Box>

                {errorMessage && (
                    <Alert severity="error" sx={{ marginBottom: 2 }}>
                        {errorMessage}
                    </Alert>
                )}

                {notice && (
                    <Alert severity="success" sx={{ marginBottom: 2 }}>
                        {notice}
                    </Alert>
                )}

                {loading ? (
                    <Typography color="text.secondary">
                        Loading bookings...
                    </Typography>
                ) : bookings.length === 0 ? (
                    <Box sx={{ padding: 3, border: '1px solid #ddd', borderRadius: 2 }}>
                        <Typography color="text.secondary">
                            No bookings match this status.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'grid', gap: 2 }}>
                        {bookings.map((booking) => (
                            <Box
                                key={booking.id}
                                sx={{
                                    padding: 2,
                                    border: '1px solid #ddd',
                                    borderRadius: 2
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        gap: 2
                                    }}
                                >
                                    <Box>
                                        <Typography variant="h6">
                                            {booking.facility_name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {booking.date} · {booking.start_time}–{booking.end_time} · {booking.location}
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
                                        gap: 1.5,
                                        marginTop: 2
                                    }}
                                >
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Requester
                                        </Typography>
                                        <Typography variant="body2">
                                            {booking.customer_name} · {booking.email}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Reference
                                        </Typography>
                                        <Typography variant="body2">
                                            {booking.reference}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="body2" sx={{ marginTop: 2 }}>
                                    <strong>Purpose:</strong> {booking.purpose}
                                </Typography>

                                {booking.status === 'pending' && (
                                    <Box sx={{ marginTop: 2 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Rejection reason (required only when rejecting)"
                                            value={decisionReasons[booking.id] || ''}
                                            onChange={(event) => setDecisionReasons((previous) => ({
                                                ...previous,
                                                [booking.id]: event.target.value
                                            }))}
                                        />

                                        <Box sx={{ display: 'flex', gap: 1, marginTop: 1.5 }}>
                                            <Button
                                                variant="contained"
                                                disabled={processingId === booking.id}
                                                onClick={() => handleDecision(booking, 'approve')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                disabled={processingId === booking.id}
                                                onClick={() => handleDecision(booking, 'reject')}
                                            >
                                                Reject
                                            </Button>
                                        </Box>
                                    </Box>
                                )}

                                {booking.status === 'rejected' && booking.decision_reason && (
                                    <Alert severity="error" sx={{ marginTop: 2 }}>
                                        {booking.decision_reason}
                                    </Alert>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            <Box>
                <Typography variant="h6" sx={{ marginBottom: 1 }}>
                    Staff actions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Approval confirms the request. Rejection requires a reason so the community user receives meaningful feedback.
                </Typography>

                <Box sx={{ marginTop: 3, paddingTop: 3, borderTop: '1px solid #eee' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 1 }}>
                        Presentation helper
                    </Typography>
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={handleResetDemo}
                        sx={{ paddingLeft: 0 }}
                    >
                        Reset demo data
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default StaffBookings

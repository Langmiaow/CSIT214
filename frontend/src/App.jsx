import { useState } from 'react'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import BookFacility from './components/BookFacility'
import BookingLookup from './components/BookingLookup'
import StaffBookings from './components/StaffBookings'

function App() {
    const [currentSection, setCurrentSection] = useState(0)
    const [lastBookingReference, setLastBookingReference] = useState('')

    const theme = createTheme({
        typography: {
            fontFamily: 'Montserrat, sans-serif'
        }
    })

    function handleSectionChange(event, newValue) {
        if (newValue === currentSection) return

        setCurrentSection(newValue)
    }

    return (
        <ThemeProvider theme={theme}>
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    backgroundColor: '#f4f6f8',
                    color: 'black',
                    borderBottom: '1px solid #ddd'
                }}
            >
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">
                            CoastLink Facilities
                        </Typography>
                    </Box>

                    <Tabs
                        value={currentSection}
                        onChange={handleSectionChange}
                        sx={{ marginRight: 2 }}
                    >
                        <Tab label="Book" />
                        <Tab label="My Booking" />
                        <Tab label="Staff" />
                    </Tabs>

                    <Chip
                        size="small"
                        label="Prototype"
                        variant="outlined"
                    />
                </Toolbar>
            </AppBar>

            {currentSection === 0 && (
                <BookFacility
                    onBookingCreated={setLastBookingReference}
                    onOpenBooking={() => setCurrentSection(1)}
                />
            )}
            {currentSection === 1 && (
                <BookingLookup initialReference={lastBookingReference} />
            )}
            {currentSection === 2 && <StaffBookings />}
        </ThemeProvider>
    )
}

export default App

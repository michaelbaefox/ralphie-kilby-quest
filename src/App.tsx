import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TripProvider, useTrip } from './context/TripContext'
import { WeatherProvider } from './context/WeatherProvider'
import { AppShell } from './components/AppShell'
import { PressStartIntro } from './components/intro/PressStartIntro'
import { Home } from './pages/Home'
import { Overworld } from './pages/Overworld'
import { RoadScroll } from './pages/RoadScroll'
import { Supplies } from './pages/Supplies'
import { Achievements } from './pages/Achievements'
import { Settings } from './pages/Settings'
import { QuestLog } from './pages/QuestLog'

const RoutedShell = () => {
  const trip = useTrip()
  return (
    <>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/overworld" element={<Overworld />} />
          <Route path="/road" element={<RoadScroll />} />
          <Route path="/supplies" element={<Supplies />} />
          <Route path="/quest-log" element={<QuestLog />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {!trip.settings.introCompleted && <PressStartIntro />}
    </>
  )
}

const App = () => {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined
  return (
    <BrowserRouter basename={basename}>
      <TripProvider>
        <WeatherProvider>
          <RoutedShell />
        </WeatherProvider>
      </TripProvider>
    </BrowserRouter>
  )
}

export default App

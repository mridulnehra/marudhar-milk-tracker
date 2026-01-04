import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AddEntry from './pages/AddEntry'
import ViewEntries from './pages/ViewEntries'
import DailyReport from './pages/reports/DailyReport'
import WeeklyReport from './pages/reports/WeeklyReport'
import MonthlyReport from './pages/reports/MonthlyReport'
import PaymentReport from './pages/reports/PaymentReport'
import LeftoverReport from './pages/reports/LeftoverReport'
import Settings from './pages/Settings'

function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add" element={<AddEntry />} />
                <Route path="/entries" element={<ViewEntries />} />
                <Route path="/reports/daily" element={<DailyReport />} />
                <Route path="/reports/weekly" element={<WeeklyReport />} />
                <Route path="/reports/monthly" element={<MonthlyReport />} />
                <Route path="/reports/payment" element={<PaymentReport />} />
                <Route path="/reports/leftover" element={<LeftoverReport />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </Layout>
    )
}

export default App

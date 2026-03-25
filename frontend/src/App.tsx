import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/auth-context'
import { ToastProvider } from './lib/toast-context'
import { CoderSpeakProvider } from './lib/coder-speak-context'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Compiler from './pages/Compiler'
import Snippets from './pages/Snippets'
import Auth from './pages/Auth'
import ShareView from './pages/ShareView'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Gallery from './pages/Gallery'
import PublicProfile from './pages/PublicProfile'
import NotFound from './pages/NotFound'
import './styles/globals.css'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <CoderSpeakProvider>
            <div className="app-container">
              <div className="grid-overlay" />
              <Navbar />
              <main className="content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/compiler" element={<Compiler />} />
                  <Route path="/snippets" element={<Snippets />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/share/:id" element={<ShareView />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/u/:username" element={<PublicProfile />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </CoderSpeakProvider>
        </Router>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './pages/Home';
import Forbidden from './pages/errors/Forbidden';
import NotFound from './pages/errors/NotFound';
import Rules from './pages/Rules';
import Lobby from './pages/Lobby';
import Table from './pages/Table';
import { NotificationProvider } from './utils/NotificationContext';
import Notifications from './components/modals/Notifications';
import TermsOfService from './pages/TermsOfService';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AdminRoute, AuthorizedRoute } from './utils/RouteGuards';
import AdminPanel from './pages/AdminPanel';
import UserProfile from './pages/UserProfile';

function App() {
  return (
    <GoogleOAuthProvider clientId="449791143541-3spu0n4o0s3mmkl37nr8rji7dtepl3ng.apps.googleusercontent.com">

      <NotificationProvider>
        <Notifications />
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 via-gray-900 to-blue-950">
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/join/:joinCode?" element={<Home />} />
              <Route path="/lobby/:gameCode" element={<Lobby />} />
              <Route path="/game/:gameCode" element={<Table />} />
              <Route path='/rules' element={<Rules />} />
              <Route path='/tos' element={<TermsOfService />} />
              {/* Protected routes */}
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="/profile" element={<AuthorizedRoute><UserProfile /></AuthorizedRoute>} />
              {/* Error pages */}
              <Route path="/403" element={<Forbidden />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

          </BrowserRouter>
        </div>
      </NotificationProvider>
    </GoogleOAuthProvider>

  )
}

export default App

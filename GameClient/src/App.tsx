import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'
import Home from './pages/Home';
import Forbidden from './pages/errors/Forbidden';
import NotFound from './pages/errors/NotFound';
import Footer from './components/Footer';
import Rules from './pages/Rules';
import Lobby from './pages/Lobby';
import Table from './pages/Table';

function App() {
  return (<>
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 via-gray-900 to-blue-950">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join/:joinCode?" element={<Home />} />
          <Route path="/lobby/:gameCode" element={<Lobby />} />
          <Route path="/game/:gameCode" element={<Table />} />
          <Route path='/rules' element={<Rules />} />
          {/* Error pages */}
          <Route path="/403" element={<Forbidden />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

      </BrowserRouter>
    </div>
    <Footer />
  </>
  )
}

export default App

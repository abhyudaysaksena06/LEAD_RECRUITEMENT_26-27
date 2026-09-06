import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Registration from './sections/Registration/Registration'
import Admin from './sections/Admin/Admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The recruitment form is the whole site. /registration stays as an
            alias so previously shared links keep working. */}
        <Route path="/" element={<Registration />} />
        <Route path="/registration" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

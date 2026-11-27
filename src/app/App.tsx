import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { AuthProvider } from '../features/auth/AuthContext'
import { SiteMotion } from '../components/motion/SiteMotion'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SiteMotion>
          <AppRoutes />
        </SiteMotion>
      </AuthProvider>
    </BrowserRouter>
  )
}

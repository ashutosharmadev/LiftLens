import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import { configureAuth } from './auth/amplify'
import './index.css'
import { AppLayout } from './screens/AppLayout'
import { CheckIn } from './screens/CheckIn'
import { ForgotPassword } from './screens/ForgotPassword'
import { History } from './screens/History'
import { SignIn } from './screens/SignIn'
import { SignUp } from './screens/SignUp'
import { Verify } from './screens/Verify'

configureAuth()

const router = createBrowserRouter([
  { path: '/signin', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/verify', element: <Verify /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/history', element: <History /> },
      { path: '/check-in', element: <CheckIn /> },
    ],
  },
  { path: '*', element: <Navigate to="/history" replace /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

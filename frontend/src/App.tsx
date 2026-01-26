import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ErrorBoundary } from "./components/error/ErrorBoundary";
import { ErrorFallback } from "./components/error/ErrorFallback";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { PublicRoute } from "./components/auth/PublicRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import BoardsPage from "./pages/BoardsPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import CalendarPage from "./pages/CalendarPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import BoardInfoPage from "./pages/BoardInfoPage";

// Miller route redirect helper
const MillerRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/boards/${slug}`} replace />;
};

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback variant="page" />}>
      <ThemeProvider>
        <BrowserRouter>
          {/* Bildirimlerin çıkacağı yer */}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "var(--bg-card)",
                color: "var(--text-main)",
                border: "1px solid var(--border)",
              },
            }}
          />

          <Routes>
            {/* Public routes - only accessible when NOT logged in */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />

            {/* Protected routes - only accessible when logged in */}
            <Route
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route path="/home" element={<HomePage />} />
              <Route path="/boards" element={<BoardsPage />} />
              <Route path="/boards/info/:slug" element={<BoardInfoPage />} />
              <Route
                path="/boards/:slug"
                element={
                  <ErrorBoundary
                    fallback={<ErrorFallback variant="section" />}
                  >
                    <BoardDetailPage />
                  </ErrorBoundary>
                }
              />
              {/* Redirect old Miller route to main board page */}
              <Route path="/boards/:slug/miller" element={<MillerRedirect />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

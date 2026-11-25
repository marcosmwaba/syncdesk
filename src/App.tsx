import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/AppRouter';
import { AppShell } from './app/AppShell';
import { ErrorBoundary } from './app/ErrorBoundary';
import { AuthProvider } from './core/auth';
import { ThemeProvider } from './core/theme';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <AppShell>
              <AppRouter />
            </AppShell>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

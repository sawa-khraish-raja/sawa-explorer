import './App.css';
import { Toaster } from '@/shared/components/ui/toaster';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { AppProvider } from '@/shared/context/AppContext';
import Pages from '@/pages/index.jsx';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Pages />
        <Toaster />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;

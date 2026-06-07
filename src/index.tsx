import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './auth';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

import { ClerkProvider } from '@clerk/react';
import { shadcn } from '@clerk/ui/themes';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ClerkProvider afterSignOutUrl="/" appearance={{ theme: shadcn }}>
    <App />
  </ClerkProvider>,
);

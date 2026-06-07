import { ClerkProvider } from '@clerk/react';
import { shadcn } from '@clerk/ui/themes';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

createRoot(document.getElementById('root')!).render(
  <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/" appearance={{ theme: shadcn }}>
    <App />
  </ClerkProvider>,
);

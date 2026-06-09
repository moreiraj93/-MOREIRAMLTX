import { ClerkProvider } from '@clerk/react';
import { shadcn } from '@clerk/ui/themes';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const app = <App />;

if (!clerkPublishableKey) {
  console.warn('Missing VITE_CLERK_PUBLISHABLE_KEY; rendering without ClerkProvider.');
}

createRoot(document.getElementById('root')!).render(
  clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey} afterSignOutUrl="/" appearance={{ theme: shadcn }}>
      {app}
    </ClerkProvider>
  ) : app,
);

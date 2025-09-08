
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from '@/queryClient';
import { ThemeProvider } from "@/components/theme-provider"
import { TitleUpdater } from '@/hooks/title-updater';
import { FloatingAlertProvider } from "@/context/FloatingAlertContext"
import { AppProvider } from "@/context/AppContext";

import '@/i18n'
import '@/index.css'

import App from '@/App'

createRoot(document.getElementById('root')!).render(

  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TitleUpdater />
        <AppProvider>
          <FloatingAlertProvider>
            <App />
          </FloatingAlertProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>

)

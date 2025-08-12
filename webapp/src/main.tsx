import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from '@/queryClient';
import { ThemeProvider } from "@/components/theme-provider"
import { TitleUpdater } from '@/hooks/title-updater';
import { DegreeProvider } from "@/context/DegreeContext"
import { CourseProvider } from '@/context/CourseContext';

import '@/i18n'
import '@/index.css'

import App from '@/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <TitleUpdater />
          <DegreeProvider>
            <CourseProvider>
              <App />
            </CourseProvider>
          </DegreeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)

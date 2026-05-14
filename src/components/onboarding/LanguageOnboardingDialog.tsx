'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useAuth } from '@/components/providers/AuthProvider';
import { languageLabel } from '@/lib/utils';
import type { LanguageCode } from '@/types';

const LANGUAGES: LanguageCode[] = ['en', 'es', 'sr'];
const STORAGE_KEY = 'lang_chosen';

export function LanguageOnboardingDialog() {
  const { isAuthorized, isLoading, setLanguage } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthorized && !localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, [isLoading, isAuthorized]);

  function pick(lang: LanguageCode) {
    setLanguage(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    setOpen(false);
  }

  return (
    <Dialog open={open} fullWidth maxWidth="xs" disableEscapeKeyDown>
      <DialogContent sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Which language do you want to practice?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          You can change this later in Settings.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {LANGUAGES.map((lang) => (
            <Button
              key={lang}
              variant="outlined"
              size="large"
              fullWidth
              onClick={() => pick(lang)}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              {languageLabel(lang)}
            </Button>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

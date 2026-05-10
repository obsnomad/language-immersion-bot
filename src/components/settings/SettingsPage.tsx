'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import SaveIcon from '@mui/icons-material/SaveRounded';
import CheckIcon from '@mui/icons-material/CheckRounded';
import TranslateIcon from '@mui/icons-material/TranslateRounded';
import NotificationsIcon from '@mui/icons-material/NotificationsRounded';
import TrackChangesIcon from '@mui/icons-material/TrackChangesRounded';
import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import { useAuth } from '@/components/providers/AuthProvider';
import { languageLabel } from '@/lib/utils';
import type { FeedbackStyle, LanguageCode, LanguageLevel } from '@/types';
import styles from './SettingsPage.module.css';

const LANGUAGES: LanguageCode[] = ['en', 'es', 'sr'];
const LEVELS: LanguageLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const NATIVE_LANGUAGES = [
  { value: 'ru', label: 'Russian' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'zh', label: 'Chinese' },
];
const FEEDBACK_STYLES: Array<{ value: FeedbackStyle; label: string }> = [
  { value: 'delayed', label: 'Delayed - corrections at end' },
  { value: 'inline', label: 'Inline - correct immediately' },
  { value: 'critical_only', label: 'Critical only - major errors' },
];

export function SettingsPage() {
  const { token, language, profile, isAuthorized, setLanguage, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [level, setLevel] = useState<LanguageLevel | ''>('');
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>('delayed');
  const [goals, setGoals] = useState('');
  const [nativeLang, setNativeLang] = useState('ru');

  useEffect(() => {
    setLevel(profile?.currentLevel ?? '');
    setFeedbackStyle(profile?.feedbackStyle ?? 'delayed');
    setGoals(profile?.goals ?? '');
    setNativeLang(profile?.nativeLanguage ?? 'ru');
  }, [profile]);

  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Language': language,
        },
        body: JSON.stringify({
          currentLevel: level || null,
          feedbackStyle,
          goals: goals || null,
          nativeLanguage: nativeLang,
        }),
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box className={styles.page}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Settings</Typography>

      <div className={styles.infoGrid}>
        <Card>
          <CardHeader
            title="Language-specific profile"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent sx={{ pt: 0 }} className={styles.infoList}>
            <Chip
              icon={<TranslateIcon />}
              label={`${languageLabel(language)} profile`}
              sx={{ width: 'fit-content' }}
            />
            <Typography variant="body2" color="text.secondary">
              Level: {profile?.currentLevel ?? 'A2-B1'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Goals: {profile?.goals ?? 'Build practical conversation confidence'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Correction style: {profile?.feedbackStyle ?? 'delayed'}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Global preferences"
            titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
          />
          <CardContent sx={{ pt: 0 }} className={styles.infoList}>
            <Chip icon={<NotificationsIcon />} label="Reminders: 19:00" sx={{ width: 'fit-content' }} />
            <Chip icon={<TrackChangesIcon />} label="Timezone: Europe/Moscow" sx={{ width: 'fit-content' }} />
            <Chip icon={<DarkModeIcon />} label="Theme: adaptive" sx={{ width: 'fit-content' }} />
          </CardContent>
        </Card>
      </div>

      {!isAuthorized && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Open this mini-app from Telegram to save profile settings.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Language to learn"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 0 }}>
          <div className={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <Button
                key={lang}
                variant={language === lang ? 'contained' : 'outlined'}
                size="small"
                fullWidth
                onClick={() => setLanguage(lang)}
                sx={{ borderRadius: 2 }}
              >
                {languageLabel(lang)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Learning profile"
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 0 }} className={styles.form}>
          <FormControl fullWidth size="small">
            <InputLabel>Native language</InputLabel>
            <Select
              value={nativeLang}
              label="Native language"
              onChange={(e) => setNativeLang(e.target.value)}
            >
              {NATIVE_LANGUAGES.map((l) => (
                <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Current level
            </Typography>
            <div className={styles.levelRow}>
              {LEVELS.map((l) => (
                <Chip
                  key={l}
                  label={l}
                  size="small"
                  variant={level === l ? 'filled' : 'outlined'}
                  color={level === l ? 'primary' : 'default'}
                  onClick={() => setLevel(level === l ? '' : l)}
                />
              ))}
            </div>
          </Box>

          <FormControl fullWidth size="small">
            <InputLabel>Feedback style</InputLabel>
            <Select
              value={feedbackStyle}
              label="Feedback style"
              onChange={(e) => setFeedbackStyle(e.target.value as FeedbackStyle)}
            >
              {FEEDBACK_STYLES.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Learning goals"
            multiline
            rows={3}
            fullWidth
            size="small"
            placeholder="e.g. Pass B2 exam, travel to Spain, work in tech..."
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={save}
            disabled={saving || !isAuthorized}
            startIcon={saved ? <CheckIcon /> : saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ borderRadius: 2 }}
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

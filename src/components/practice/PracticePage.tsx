'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import SendIcon from '@mui/icons-material/SendRounded';
import MicIcon from '@mui/icons-material/MicRounded';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOverRounded';
import SchoolIcon from '@mui/icons-material/SchoolRounded';
import { useAuth } from '@/components/providers/AuthProvider';
import { markdownToHtml } from '@/lib/markdown';
import { languageLabel } from '@/lib/utils';
import type { LearningMode, MistakeRecord, PracticeHistoryResponse } from '@/types';
import styles from './PracticePage.module.css';

interface ModeOption {
  id: string;
  mode: LearningMode;
  label: string;
  description: string;
  promptPrefix?: string;
  icon: React.ReactElement;
}

const MODES: ModeOption[] = [
  {
    id: 'conversation',
    mode: 'conversation',
    label: 'Conversation',
    description: 'Open-ended tutor chat',
    icon: <MicIcon />,
  },
  {
    id: 'roleplay',
    mode: 'scenario',
    label: 'Roleplay',
    description: 'Practice a real-world situation',
    promptPrefix: 'Roleplay scenario:',
    icon: <RecordVoiceOverIcon />,
  },
  {
    id: 'interview',
    mode: 'exam',
    label: 'Interview',
    description: 'Answer structured questions',
    promptPrefix: 'Interview practice:',
    icon: <SchoolIcon />,
  },
  {
    id: 'grammar',
    mode: 'grammar',
    label: 'Grammar',
    description: 'Rules, examples, and drills',
    icon: <SchoolIcon />,
  },
  {
    id: 'vocabulary',
    mode: 'vocabulary',
    label: 'Vocabulary',
    description: 'Learn and reuse new words',
    icon: <SchoolIcon />,
  },
  {
    id: 'writing',
    mode: 'writing',
    label: 'Writing',
    description: 'Improve longer written answers',
    icon: <SchoolIcon />,
  },
];

const SCENARIOS = ['job interview', 'airport', 'doctor', 'renting apartment', 'small talk'];

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  feedback?: string | null;
  mistakes?: MistakeRecord[];
}

export function PracticePage() {
  const { token, language, isAuthorized } = useAuth();
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const initialMode =
    MODES.find((m) => m.id === requestedMode || m.mode === requestedMode)?.id ?? 'conversation';
  const [modeId, setModeId] = useState(initialMode);
  const [scenario, setScenario] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  type MicState = 'idle' | 'recording' | 'transcribing';
  const [micState, setMicState] = useState<MicState>('idle');
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeMode = MODES.find((m) => m.id === modeId) ?? MODES[0];
  const showScenarios = activeMode.mode === 'scenario' || activeMode.id === 'roleplay';
  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${token ?? ''}`, 'X-Language': language }),
    [token, language],
  );

  useEffect(() => {
    if (!token) {
      setMessages([]);
      setHistoryLoading(false);
      return;
    }

    let ignore = false;
    setHistoryLoading(true);

    fetch('/api/learning/session/history', { headers: authHeaders })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load history');
        return res.json() as Promise<PracticeHistoryResponse>;
      })
      .then((data) => {
        if (ignore) return;
        setMessages(
          data.messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
          })),
        );

        if (data.session?.mode) {
          const restoredMode = MODES.find((m) => m.mode === data.session?.mode);
          if (restoredMode) setModeId(restoredMode.id);
        }

        setScenario(data.session?.scenarioHint ?? null);
      })
      .catch(() => {
        if (!ignore) setMessages([]);
      })
      .finally(() => {
        if (!ignore) setHistoryLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [token, language, authHeaders]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, historyLoading]);

  async function send() {
    if (!input.trim() || !token || loading) return;

    const prefix = [
      activeMode.promptPrefix,
      showScenarios && scenario ? `Scenario: ${scenario}` : null,
      activeMode.mode !== 'conversation' ? `Mode: ${activeMode.mode}` : null,
    ]
      .filter(Boolean)
      .join(' ');
    const text = prefix ? `${prefix}\n${input}` : input;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/learning/session/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Language': language,
        },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          feedback: data.feedback,
          mistakes: data.mistakes,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  async function toggleRecording() {
    setMicError(null);

    if (micState === 'recording') {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (micState === 'transcribing') return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError('Microphone permission denied');
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];

      if (blob.size === 0) {
        setMicState('idle');
        setMicError('No audio captured');
        return;
      }

      setMicState('transcribing');
      const form = new FormData();
      form.append('audio', blob, 'audio.webm');

      try {
        const res = await fetch('/api/learning/session/transcribe', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token ?? ''}`, 'X-Language': language },
          body: form,
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed');
        const data = await res.json();
        console.log('transcribe response:', data);
        const { text } = data;
        if (text) {
          setInput((prev) => (prev ? `${prev} ${text}` : text));
          inputRef.current?.focus();
        }
      } catch (err) {
        setMicError(err instanceof Error ? err.message : 'Transcription failed');
      } finally {
        setMicState('idle');
      }
    };

    recorder.start();
    setMicState('recording');
  }

  return (
    <Box className={styles.page}>
      <Box className={styles.toolbar}>
        <FormControl size="small" className={styles.modeSelect}>
          <InputLabel>Mode</InputLabel>
          <Select value={modeId} label="Mode" onChange={(event) => setModeId(event.target.value)}>
            {MODES.map((mode) => (
              <MenuItem key={mode.id} value={mode.id}>
                {mode.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {showScenarios ? (
          <FormControl size="small" className={styles.scenarioSelect}>
            <InputLabel>Scenario</InputLabel>
            <Select
              value={scenario ?? ''}
              label="Scenario"
              displayEmpty
              onChange={(event) => setScenario(event.target.value || null)}
            >
              <MenuItem value="">Any scenario</MenuItem>
              {SCENARIOS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}

        <Chip
          icon={activeMode.icon}
          label={activeMode.description}
          size="small"
          variant="outlined"
          className={styles.modeHint}
        />
      </Box>

      {!isAuthorized && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Open this mini-app from Telegram to send practice messages.
            </Typography>
          </CardContent>
        </Card>
      )}

      <div className={styles.chat}>
        {historyLoading ? (
          <Box className={styles.typingIndicator}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">
              Loading history...
            </Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            Start a conversation in {languageLabel(language)}
          </Typography>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        {loading && (
          <Box className={styles.typingIndicator}>
            <CircularProgress size={14} />
            <Typography variant="caption" color="text.secondary">
              Tutor is typing...
            </Typography>
          </Box>
        )}
        <div ref={bottomRef} />
      </div>

      <Box className={styles.inputRow}>
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder={`Type in ${languageLabel(language)}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send();
          }}
          disabled={loading || historyLoading || !isAuthorized || micState === 'transcribing'}
          size="small"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '20px' } }}
        />
        <Tooltip
          title={
            micState === 'recording'
              ? 'Tap to stop'
              : micState === 'transcribing'
                ? 'Transcribing…'
                : 'Record voice'
          }
          placement="top"
        >
          <span>
            <IconButton
              color={micState === 'recording' ? 'error' : 'default'}
              onClick={toggleRecording}
              disabled={loading || historyLoading || !isAuthorized || micState === 'transcribing'}
              className={micState === 'recording' ? styles.micButtonRecording : undefined}
              sx={{ flexShrink: 0 }}
              aria-label={micState === 'recording' ? 'Stop recording' : 'Start recording'}
            >
              {micState === 'transcribing' ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <MicIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <IconButton
          color="primary"
          onClick={send}
          disabled={!input.trim() || loading || historyLoading || !isAuthorized}
          sx={{ flexShrink: 0 }}
        >
          <SendIcon />
        </IconButton>
      </Box>

      {micError && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 'calc(60px + var(--safe-area-bottom) + 64px)',
            left: 12,
            right: 12,
            zIndex: 1200,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            borderRadius: 2,
            px: 2,
            py: 1,
            cursor: 'pointer',
          }}
          onClick={() => setMicError(null)}
        >
          <Typography variant="caption">{micError}</Typography>
        </Box>
      )}
    </Box>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <Box className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}>
      <Card
        sx={{
          maxWidth: '85%',
          bgcolor: isUser ? 'primary.main' : 'background.paper',
        }}
      >
        <CardContent sx={{ py: '8px !important', px: '12px !important' }}>
          {isUser ? (
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', color: 'primary.contrastText' }}
            >
              {msg.content}
            </Typography>
          ) : (
            <Typography
              component="div"
              variant="body2"
              className={styles.markdownMessage}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
            />
          )}

          {msg.feedback && (
            <>
              <Divider sx={{ my: 1, borderColor: 'divider' }} />
              <Typography
                component="div"
                variant="caption"
                color="text.secondary"
                className={styles.markdownMessage}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(`Feedback: ${msg.feedback}`) }}
              />
            </>
          )}

          {msg.mistakes && msg.mistakes.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              {msg.mistakes.map((m, i) => (
                <Box key={i} sx={{ mt: 0.5 }}>
                  <Chip
                    label={m.type}
                    size="small"
                    color={m.severity >= 4 ? 'error' : 'warning'}
                    sx={{ mb: 0.5 }}
                  />
                  <Typography variant="caption" display="block">
                    <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                      {m.sourceText}
                    </span>
                    {' -> '}
                    <strong>{m.correction}</strong>
                  </Typography>
                  {m.explanation && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {m.explanation}
                    </Typography>
                  )}
                </Box>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

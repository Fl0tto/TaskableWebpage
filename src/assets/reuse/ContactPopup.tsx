import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Modal } from '@mui/material';
import { THEME, FONTS } from '../../style';
import TaskableButton from './TaskableButton';
import TaskableModelRenderer from './TaskableModelRenderer';
import { Model as PaperplaneModel } from './Models/Paperplane';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContactPopupProps {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (v: string) => EMAIL_RE.test(v);

const LAMBDA_URL = 'https://YOUR_LAMBDA_URL_HERE'; // TODO: replace with your API Gateway URL

// ─── Shared field styles ──────────────────────────────────────────────────────

const fieldSx = {
  width: '100%',
  fontFamily: FONTS.body,
  fontSize: '0.9375rem',
  color: THEME.textPrimary,
  backgroundColor: THEME.surface,
  border: `1.5px solid ${THEME.border}`,
  borderRadius: '999px',
  padding: '0.6875rem 1.25rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box' as const,
  '&:focus': { borderColor: THEME.textMuted },
};

const textareaSx = {
  ...fieldSx,
  borderRadius: '1rem',
  resize: 'vertical' as const,
  minHeight: '7rem',
  lineHeight: 1.6,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <Box
    component="label"
    sx={{
      fontFamily: FONTS.body,
      fontSize: '0.8125rem',
      fontWeight: 600,
      color: THEME.textSecondary,
      letterSpacing: '0.03em',
      display: 'block',
      mb: '0.375rem',
    }}
  >
    {children}
  </Box>
);

const Field = ({
  label,
  value,
  onChange,
  error,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  onBlur?: () => void;
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <Label>{label}</Label>
    <Box
      component="input"
      type="text"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      onBlur={onBlur}
      sx={{ ...fieldSx, ...(error && { borderColor: '#C0392B' }) }}
    />
  </Box>
);

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'form' | 'loading' | 'success' | 'fatalError';

const EMPTY_FORM = {
  email: '',
  firstName: '',
  lastName: '',
  company: '',
  subject: '',
  message: '',
};

const ContactPopup: React.FC<ContactPopupProps> = ({ open, onClose }) => {
  const [fields, setFields]           = useState(EMPTY_FORM);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phase, setPhase]             = useState<Phase>('form');
  const [fatalMessage, setFatalMessage] = useState('');
  const [inlineError, setInlineError] = useState('');
  const inlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setFields(EMPTY_FORM);
      setEmailTouched(false);
      setPhase('form');
      setFatalMessage('');
      setInlineError('');
    }
  }, [open]);

  const setField = (key: keyof typeof EMPTY_FORM) => (v: string) =>
    setFields(f => ({ ...f, [key]: v }));

  const emailInvalid = emailTouched && fields.email !== '' && !isValidEmail(fields.email);

  const allFilled =
    fields.email.trim() !== '' &&
    isValidEmail(fields.email) &&
    fields.firstName.trim() !== '' &&
    fields.message.trim() !== '';

  const showInlineError = (msg: string) => {
    setInlineError(msg);
    if (inlineTimer.current) clearTimeout(inlineTimer.current);
    inlineTimer.current = setTimeout(() => setInlineError(''), 3000);
  };

  const handleSubmit = async () => {
    setPhase('loading');

    const requestBody = {
      email:     fields.email.trim(),
      firstName: fields.firstName.trim(),
      lastName:  fields.lastName.trim() || undefined,
      company:   fields.company.trim()  || undefined,
      subject:   fields.subject.trim()  || undefined,
      message:   fields.message.trim(),
    };

    try {
      const res = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.status === 200) {
        setPhase('success');
      } else {
        setFatalMessage('Something went wrong. Please try again later.');
        setPhase('fatalError');
      }
    } catch {
      setFatalMessage('Something went wrong. Please try again later.');
      setPhase('fatalError');
    }
  };

  const handleClose = () => {
    if (inlineTimer.current) clearTimeout(inlineTimer.current);
    onClose();
  };

  // ─── Overlay content ───────────────────────────────────────────────────────

  const renderContent = () => {
    if (phase === 'loading') {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: '3rem' }}>
          <CircularProgress size={40} sx={{ color: THEME.accent }} />
        </Box>
      );
    }

    if (phase === 'success') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', py: '1rem', textAlign: 'center' }}>
          <Box sx={{ fontFamily: FONTS.body, fontSize: '1.5rem' }}>✓</Box>
          <Box sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: THEME.textSecondary, lineHeight: 1.6 }}>
            Your message has been sent successfully.<br />
            We'll get back to you as soon as possible.
          </Box>
          <TaskableButton buttonType="Highlight" text="Close" onClick={handleClose} />
        </Box>
      );
    }

    if (phase === 'fatalError') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', py: '1rem', textAlign: 'center' }}>
          <Box sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: THEME.textSecondary, lineHeight: 1.6 }}>
            {fatalMessage}
          </Box>
          <TaskableButton buttonType="Active" text="Close" onClick={handleClose} />
        </Box>
      );
    }

    // phase === 'form'
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <Field label="First Name *" value={fields.firstName} onChange={setField('firstName')} />
          <Field label="Last Name"    value={fields.lastName}  onChange={setField('lastName')}  />
        </Box>

        {/* Email */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Label>Email *</Label>
          <Box
            component="input"
            type="text"
            value={fields.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('email')(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            sx={{ ...fieldSx, ...(emailInvalid && { borderColor: '#C0392B' }) }}
          />
          {emailInvalid && (
            <Box sx={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: '#C0392B', mt: '0.25rem', pl: '1rem' }}>
              Please enter a valid email address.
            </Box>
          )}
        </Box>

        <Field label="Company"  value={fields.company} onChange={setField('company')} />
        <Field label="Subject"  value={fields.subject} onChange={setField('subject')} />

        {/* Message */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Label>Message *</Label>
          <Box
            component="textarea"
            value={fields.message}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setField('message')(e.target.value)}
            sx={textareaSx}
          />
        </Box>

        {/* Inline error */}
        <Box
          sx={{
            fontFamily: FONTS.body,
            fontSize: '0.8125rem',
            color: '#C0392B',
            minHeight: '1.1rem',
            transition: 'opacity 0.3s ease',
            opacity: inlineError ? 1 : 0,
          }}
        >
          {inlineError || ' '}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', mt: '0.25rem' }}>
          <TaskableButton buttonType="Active" text="Cancel" onClick={handleClose} />
          <TaskableButton
            buttonType={allFilled ? 'Highlight' : 'Disabled'}
            text="Send"
            onClick={allFilled ? handleSubmit : undefined}
          />
        </Box>
      </Box>
    );
  };

  return (
    <Modal open={open} onClose={phase === 'form' ? handleClose : undefined}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '92vw', md: '700px' },
          backgroundColor: THEME.bg,
          border: `1.5px solid ${THEME.border}`,
          borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          outline: 'none',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          minHeight: '420px',
        }}
      >
        {/* ── Left panel (2/3) — form ─────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: '1.5rem', sm: '2rem' },
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              fontFamily: FONTS.body,
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: THEME.textMuted,
              mb: '1.5rem',
              pb: '1rem',
              borderBottom: `1px solid ${THEME.border}`,
            }}
          >
            Contact us
          </Box>

          {renderContent()}
        </Box>

        {/* ── Right panel (1/3) — model ───────────────────────────────────── */}
        <Box
          sx={{
            width: '33.333%',
            flexShrink: 0,
            backgroundColor: THEME.bgAlt,
            borderLeft: `1.5px solid ${THEME.border}`,
            overflow: 'hidden',
            p: '10px',
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flex: 1, borderRadius: '16px', overflow: 'hidden' }}>
            <TaskableModelRenderer
              model={PaperplaneModel}
              modelScale={1}
              modelRotation={[0, 0, -.2]}
              modelOffset={[0, 0, 0]}
              gridSize={77}
              cameraDistance={7}
              rotationVelocity={Math.PI / 2}
              bobAmplitude={2.5}
              bobFrequency={0.33}
              foregroundColor={THEME.accent}
              backgroundColor={THEME.complementary}
              width="100%"
              height="100%"
            />
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default ContactPopup;

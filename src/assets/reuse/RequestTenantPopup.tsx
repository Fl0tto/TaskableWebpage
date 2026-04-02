import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Modal } from '@mui/material';
import { THEME, FONTS } from '../../style';
import TaskableButton from './TaskableButton';

// ─── Props ────────────────────────────────────────────────────────────────────

interface RequestTenantPopupProps {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TENANT_ID_RE = /^[a-z0-9-]+$/;

const isValidEmail    = (v: string) => EMAIL_RE.test(v);
const isValidTenantId = (v: string) => TENANT_ID_RE.test(v);

// ─── Shared field style ───────────────────────────────────────────────────────

const fieldSx = {
  width: '100%',
  fontFamily: FONTS.body,
  fontSize: '0.9375rem',
  color: THEME.textPrimary,
  backgroundColor: THEME.surface,
  border: `1.5px solid ${THEME.border}`,
  borderRadius: '0.5rem',
  padding: '0.6875rem 1rem',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box' as const,
  '&:focus': {
    borderColor: THEME.textMuted,
  },
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
    <Label>{label}</Label>
    <Box
      component="input"
      type="text"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      sx={{
        ...fieldSx,
        ...(error && { borderColor: '#C0392B' }),
      }}
    />
  </Box>
);

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = 'form' | 'loading' | 'success' | 'fatalError';

const EMPTY_FORM = { tenantId: '', company: '', email: '', firstName: '', lastName: '' };

const RequestTenantPopup: React.FC<RequestTenantPopupProps> = ({ open, onClose }) => {
  const [fields, setFields] = useState(EMPTY_FORM);
  const [emailTouched, setEmailTouched]       = useState(false);
  const [tenantIdTouched, setTenantIdTouched] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [fatalMessage, setFatalMessage] = useState('');
  const [inlineError, setInlineError] = useState('');
  const inlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset everything when the popup opens fresh
  useEffect(() => {
    if (open) {
      setFields(EMPTY_FORM);
      setEmailTouched(false);
      setTenantIdTouched(false);
      setPhase('form');
      setFatalMessage('');
      setInlineError('');
    }
  }, [open]);

  const setField = (key: keyof typeof EMPTY_FORM) => (v: string) =>
    setFields(f => ({ ...f, [key]: v }));

  const emailInvalid    = emailTouched    && fields.email    !== '' && !isValidEmail(fields.email);
  const tenantIdInvalid = tenantIdTouched && fields.tenantId !== '' && !isValidTenantId(fields.tenantId);
  const allFilled =
    fields.tenantId.trim() !== '' &&
    isValidTenantId(fields.tenantId) &&
    fields.company.trim() !== '' &&
    fields.email.trim() !== '' &&
    fields.firstName.trim() !== '' &&
    fields.lastName.trim() !== '' &&
    isValidEmail(fields.email);

  const showInlineError = (msg: string) => {
    setInlineError(msg);
    if (inlineTimer.current) clearTimeout(inlineTimer.current);
    inlineTimer.current = setTimeout(() => setInlineError(''), 3000);
  };

  const handleConfirm = async () => {
    setPhase('loading');

    const requestBody = {
      slug:           fields.tenantId.trim(),
      companyName:    fields.company.trim(),
      adminEmail:     fields.email.trim(),
      adminFirstName: fields.firstName.trim(),
      adminLastName:  fields.lastName.trim(),
    };

    console.group('[RequestTenantPopup] POST /taskable-request-tenant');
    console.log('Request body:', requestBody);

    try {
      const res = await fetch(
        'https://z2c1ip4oba.execute-api.eu-north-1.amazonaws.com/default/taskable-request-tenant',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('Status:', res.status, res.statusText);
      console.log('Headers:', Object.fromEntries(res.headers.entries()));

      let responseBody: unknown = null;
      try {
        responseBody = await res.clone().json();
      } catch {
        responseBody = await res.clone().text();
      }
      console.log('Response body:', responseBody);
      console.groupEnd();

      if (res.status === 201) {
        setPhase('success');
      } else if (res.status === 409) {
        setPhase('form');
        showInlineError('This Tenant ID is already taken. Please choose a different one.');
      } else {
        setFatalMessage('Something went wrong. Please try again later.');
        setPhase('fatalError');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      console.groupEnd();
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
            Your test tenant has been created successfully.<br />
            You will receive your admin password via email shortly.
          </Box>
          <TaskableButton buttonType="Highlight" text="Accept" onClick={handleClose} />
        </Box>
      );
    }

    if (phase === 'fatalError') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', py: '1rem', textAlign: 'center' }}>
          <Box sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: THEME.textSecondary, lineHeight: 1.6 }}>
            {fatalMessage}
          </Box>
          <TaskableButton buttonType="Active" text="Accept" onClick={handleClose} />
        </Box>
      );
    }

    // phase === 'form'
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Tenant ID — validated format */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Label>Tenant ID</Label>
          <Box
            component="input"
            type="text"
            value={fields.tenantId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('tenantId')(e.target.value)}
            onBlur={() => setTenantIdTouched(true)}
            sx={{ ...fieldSx, ...(tenantIdInvalid && { borderColor: '#C0392B' }) }}
          />
          {tenantIdInvalid && (
            <Box sx={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: '#C0392B', mt: '0.25rem' }}>
              Only lowercase letters, numbers, and hyphens ( - ) are allowed.
            </Box>
          )}
        </Box>

        <Field label="Company"    value={fields.company}   onChange={setField('company')} />

        {/* Email — own row for error hint */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Label>Email</Label>
          <Box
            component="input"
            type="text"
            value={fields.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('email')(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            sx={{ ...fieldSx, ...(emailInvalid && { borderColor: '#C0392B' }) }}
          />
          {emailInvalid && (
            <Box sx={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: '#C0392B', mt: '0.25rem' }}>
              Please enter a valid email address.
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <Field label="First Name" value={fields.firstName} onChange={setField('firstName')} />
          <Field label="Last Name"  value={fields.lastName}  onChange={setField('lastName')} />
        </Box>

        {/* Inline conflict / transient error */}
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
          {inlineError}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', mt: '0.25rem' }}>
          <TaskableButton buttonType="Active"    text="Cancel"  onClick={handleClose} />
          <TaskableButton
            buttonType={allFilled ? 'Highlight' : 'Disabled'}
            text="Confirm"
            onClick={allFilled ? handleConfirm : undefined}
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
          width: { xs: '90vw', sm: '480px' },
          backgroundColor: THEME.bg,
          border: `1.5px solid ${THEME.border}`,
          borderRadius: '1rem',
          boxShadow: `0 8px 40px rgba(0,0,0,0.10)`,
          p: { xs: '1.5rem', sm: '2rem' },
          outline: 'none',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            fontFamily: FONTS.heading,
            fontSize: '1.125rem',
            fontWeight: 700,
            color: THEME.textPrimary,
            letterSpacing: '-0.01em',
            mb: '1.5rem',
            pb: '1rem',
            borderBottom: `1.5px solid ${THEME.border}`,
          }}
        >
          Requesting your Taskable test tenant
        </Box>

        {renderContent()}
      </Box>
    </Modal>
  );
};

export default RequestTenantPopup;

import React, { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Modal } from '@mui/material';
import { THEME, FONTS } from '../../style';
import TaskableButton from './TaskableButton';
import TaskableModelRenderer from './TaskableModelRenderer';
import { Model as WebsiteRocket } from './WebsiteRocket';
import { Model as HourglassModel}  from './Models/Hourglass';

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
  borderRadius: '999px',
  padding: '0.6875rem 1.25rem',
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
          <TaskableButton buttonType="Highlight" text="Confirm" onClick={handleClose} />
        </Box>
      );
    }

    if (phase === 'fatalError') {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', py: '1rem', textAlign: 'center' }}>
          <Box sx={{ fontFamily: FONTS.body, fontSize: '0.9375rem', color: THEME.textSecondary, lineHeight: 1.6 }}>
            {fatalMessage}
          </Box>
          <TaskableButton buttonType="Active" text="Confirm" onClick={handleClose} />
        </Box>
      );
    }

    // phase === 'form'
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* URL Prefix — with .taskable.app suffix */}
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Label>URL Prefix</Label>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: THEME.surface,
              border: `1.5px solid ${tenantIdInvalid ? '#C0392B' : THEME.border}`,
              borderRadius: '999px',
              transition: 'border-color 0.2s ease',
              '&:focus-within': {
                borderColor: tenantIdInvalid ? '#C0392B' : THEME.textMuted,
              },
            }}
          >
            <Box
              component="input"
              type="text"
              value={fields.tenantId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField('tenantId')(e.target.value)}
              onBlur={() => setTenantIdTouched(true)}
              sx={{
                flex: 1,
                fontFamily: FONTS.body,
                fontSize: '0.9375rem',
                color: THEME.textPrimary,
                backgroundColor: 'transparent',
                border: 'none',
                padding: '0.6875rem 0 0.6875rem 1.25rem',
                outline: 'none',
                minWidth: 0,
                boxSizing: 'border-box' as const,
              }}
            />
            <Box
              sx={{
                fontFamily: FONTS.body,
                fontSize: '0.8125rem',
                color: THEME.textMuted,
                fontWeight: 500,
                pr: '1.25rem',
                pl: '0.25rem',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              .taskable.app
            </Box>
          </Box>
          {tenantIdInvalid && (
            <Box sx={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: '#C0392B', mt: '0.25rem', pl: '1rem' }}>
              Only lowercase letters, numbers, and hyphens ( - ) are allowed.
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: '1rem' }}>
          <Field label="First Name" value={fields.firstName} onChange={setField('firstName')} />
          <Field label="Last Name"  value={fields.lastName}  onChange={setField('lastName')} />
        </Box>

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
            <Box sx={{ fontFamily: FONTS.body, fontSize: '0.75rem', color: '#C0392B', mt: '0.25rem', pl: '1rem' }}>
              Please enter a valid email address.
            </Box>
          )}
        </Box>

        <Field label="Company" value={fields.company} onChange={setField('company')} />

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
        {/* ── Left panel (1/3) — accent placeholder ──────────────────────── */}
        <Box
          sx={{
            width: '33.333%',
            flexShrink: 0,
            backgroundColor: THEME.bgAlt,
            borderRight: `1.5px solid ${THEME.border}`,

            overflow: 'hidden',
            p: '20px',
            display: { xs: 'none', sm: 'flex' },
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flex: 1, borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px', overflow: 'hidden' }}>
            <TaskableModelRenderer
              model={WebsiteRocket}
              modelScale={0.66}
              modelRotation={[0, -45, 0]}
              modelOffset={[0,-2.5,0]}
              gridSize={66}
              cameraDistance={7}
              rotationVelocity={Math.PI / 2}
              bobAmplitude={2.5}
              bobFrequency={.33}
              foregroundColor={THEME.textPrimary}
              backgroundColor={THEME.bgAlt}
              width="100%"
              height="100%"
            />
          </Box>
        </Box>

        {/* ── Right panel (2/3) — form ────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            p: { xs: '1.5rem', sm: '2rem' },
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          {/* Header */}
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
            Request a test tenant
          </Box>

          {renderContent()}
        </Box>
      </Box>
    </Modal>
  );
};

export default RequestTenantPopup;

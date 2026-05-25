import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { Button } from '@/components/common/Button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AUTH_PASSWORD_MIN_LENGTH } from '@/types/auth.types';
import styles from './AuthPage.module.scss';

type LocationState = {
  from?: { pathname?: string };
};

export function LoginPage() {
  const { t } = useI18n();
  const { login, authErrorMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (!employeeId.trim() || !password) {
      setError(t('authValidationRequired'));
      return;
    }

    if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
      setError(t('authValidationPasswordMin'));
      return;
    }

    setBusy(true);
    try {
      await login({ employeeId: employeeId.trim(), password });
      const from = (location.state as LocationState | null)?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>{t('authLoginTitle')}</h1>
      <p className={styles.lead}>{t('authLoginLead')}</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-employee-id">
            {t('authEmployeeIdLabel')}
          </label>
          <input
            id="login-employee-id"
            className={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
            type="text"
            autoComplete="username"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder={t('authEmployeeIdPlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-password">
            {t('authPasswordLabel')}
          </label>
          <PasswordInput
            id="login-password"
            inputClassName={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            placeholder={t('authPasswordPlaceholder')}
          />
        </div>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className={styles.submit}
          disabled={busy}
        >
          {busy ? '…' : t('authLoginSubmit')}
        </Button>
      </form>

      <p className={styles.footer}>
        {t('authNoAccount')}{' '}
        <Link className={styles.link} to="/signup">
          {t('authGoSignup')}
        </Link>
      </p>
    </>
  );
}

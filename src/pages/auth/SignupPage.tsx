import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { useI18n } from '@/app/providers/I18nProvider';
import { Button } from '@/components/common/Button';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { AUTH_PASSWORD_MIN_LENGTH } from '@/types/auth.types';
import styles from './AuthPage.module.scss';

export function SignupPage() {
  const { t } = useI18n();
  const { signup, authErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (
      !fullName.trim() ||
      !employeeId.trim() ||
      !phone.trim() ||
      !password ||
      !adminSecret.trim()
    ) {
      setError(t('authValidationRequired'));
      return;
    }

    if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
      setError(t('authValidationPasswordMin'));
      return;
    }

    setBusy(true);
    try {
      await signup({
        fullName: fullName.trim(),
        employeeId: employeeId.trim(),
        phone: phone.trim(),
        password,
        adminSecret: adminSecret.trim(),
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>{t('authSignupTitle')}</h1>
      <p className={styles.lead}>{t('authSignupLead')}</p>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-name">
            {t('authFullNameLabel')}
          </label>
          <input
            id="signup-name"
            className={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('authFullNamePlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-employee-id">
            {t('authEmployeeIdLabel')}
          </label>
          <input
            id="signup-employee-id"
            className={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
            type="text"
            autoComplete="username"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder={t('authEmployeeIdPlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-phone">
            {t('authPhoneLabel')}
          </label>
          <input
            id="signup-phone"
            className={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('authPhonePlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-password">
            {t('authPasswordLabel')}
          </label>
          <PasswordInput
            id="signup-password"
            inputClassName={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            placeholder={t('authPasswordPlaceholder')}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="signup-admin-secret">
            {t('authAdminSecretLabel')}
          </label>
          <PasswordInput
            id="signup-admin-secret"
            inputClassName={`${styles.input} ${error ? styles.inputError : ''}`.trim()}
            autoComplete="off"
            value={adminSecret}
            onChange={setAdminSecret}
            placeholder={t('authAdminSecretPlaceholder')}
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
          {busy ? '…' : t('authSignupSubmit')}
        </Button>
      </form>

      <p className={styles.footer}>
        {t('authHaveAccount')}{' '}
        <Link className={styles.link} to="/login">
          {t('authGoLogin')}
        </Link>
      </p>
    </>
  );
}

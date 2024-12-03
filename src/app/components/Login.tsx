import React from 'react';
import { useSession, signIn } from 'next-auth/react';
import styles from './Login.module.css';

export default function Login() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>ログインしてください</h1>
          <p className={styles.subtitle}>サービスを利用するにはログインが必要です</p>

          <div className={styles.buttonContainer}>
            <button 
              onClick={() => signIn('google', {}, { prompt: 'login' })}
              className={`${styles.button} ${styles.googleButton}`}
            >
              <svg className={styles.icon} viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Googleでログイン
            </button>

            <button 
              onClick={() => signIn('azure-ad', {}, { prompt: 'login' })}
              className={`${styles.button} ${styles.azureButton}`}
            >
              <svg className={styles.icon} viewBox="0 0 23 23">
                <path fill="#00A4EF" d="M0 0h11v11H0z" />
                <path fill="#FFB900" d="M12 0h11v11H12z" />
                <path fill="#7FBA00" d="M0 12h11v11H0z" />
                <path fill="#F25022" d="M12 12h11v11H12z" />
              </svg>
              Azureでログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
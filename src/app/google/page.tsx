'use client';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Login from '../components/Login';
import styles from '../page.module.css';
import { signOut } from 'next-auth/react';

export default function GooglePage() {
  const { data: session, status } = useSession();

  // Redirect Azure users to their page
  if (session?.provider === 'azure-ad') {
    redirect('/azure');
  }

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {status === 'authenticated' ? (
        <div className={styles.card}>
          <div className={styles.profile}>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className={styles.avatar}
              />
            )}
            <div className={styles.userInfo}>
              <h1 className={styles.welcome}>ようこそ、{session.user?.name}さん</h1>
              <p className={styles.sessionInfo}>
                セッションの期限：{new Date(session.expires).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>

          {/* ここにGoogleユーザー向けの独自のUIを実装 */}

          <button
            onClick={() => signOut()} 
            className={styles.logoutButton}
          >
            ログアウト
          </button>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}
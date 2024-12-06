'use client';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Login from './components/Login';
import styles from './page.module.css';

export default function Home() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  // Redirect authenticated users based on their provider
  if (status === 'authenticated') {
    if (session.provider === 'azure-ad') {
      redirect('/azure');
    } else if (session.provider === 'google') {
      redirect('/google');
    } else if (session.provider === 'box') {
      redirect('/box');
    }
  }

  return (
    <div className={styles.container}>
      <Login />
    </div>
  );
}
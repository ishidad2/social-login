'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import axios from 'axios';
import Login from './components/Login';
import styles from './page.module.css';
import { signOut } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const [copySuccess, setCopySuccess] = useState(false);
  const [fileId, setFileId] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  const truncateToken = (token: string) => {
    if (!token) return '';
    return token.length > 50 ? `${token.substring(0, 50)}...` : token;
  };

  const handleCopyToken = async () => {
    if (session?.accessToken) {
      try {
        await navigator.clipboard.writeText(session.accessToken);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  };

  const handleGetFilePath = async () => {
    setIsLoading(true);
    setError('');
    setFilePath('');

    try {
      const res = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      console.log("Files: ", res.data);

      setFilePath(res.data.webUrl);
    } catch (error) {
      console.error("Error fetching files: ", error);
      setError('ファイルパスの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

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
              <div className={styles.tokenContainer}>
                <p className={styles.tokenInfo}>
                  トークン：{truncateToken(session.accessToken!)}
                </p>
                <button
                  onClick={handleCopyToken}
                  className={styles.copyButton}
                  aria-label="トークンをコピー"
                >
                  {copySuccess ? (
                    <span className={styles.copySuccess}>✓ コピーしました</span>
                  ) : (
                    'コピー'
                  )}
                </button>
              </div>
              <div className={styles.tokenContainer}>
                <p className={styles.tokenInfo}>
                  スコープ：{session.scope}
                </p>
              </div>
            </div>
          </div>

          <div className={styles.fileSection}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                placeholder="ファイルIDを入力"
                className={styles.fileInput}
              />
              <button
                onClick={handleGetFilePath}
                className={styles.fileButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className={styles.buttonLoader}></div>
                ) : (
                  'ファイルパス取得'
                )}
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {filePath && (
              <div className={styles.filePathContainer}>
                <p className={styles.filePath}>ファイルパス: {filePath}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(filePath);
                    alert('ファイルパスをコピーしました');
                  }}
                  className={styles.copyButton}
                >
                  コピー
                </button>
              </div>
            )}
          </div>

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
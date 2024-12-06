'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { redirect } from 'next/navigation';
import Login from '../components/Login';
import styles from '../page.module.css';
import { signOut } from 'next-auth/react';
import axios from 'axios';

export default function BoxPage() {
  const { data: session, status } = useSession();
  const [copySuccess, setCopySuccess] = useState(false);
  const [fileId, setFileId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rootInfo, setRootInfo] = useState<any>(null);
  const [isLoadingRoot, setIsLoadingRoot] = useState(false);
  const [rootError, setRootError] = useState('');
  const [copyItem, setCopyItem] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (session?.provider === 'azure-ad') {
    redirect('/azure');
  }else if (session?.provider === 'google') {
    redirect('/google');
  }

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
    if (session?.access_token) {
      try {
        await navigator.clipboard.writeText(session.access_token);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  };

  const handleGetRootDirectory = async () => {
    setIsLoadingRoot(true);
    setRootError('');
    setRootInfo(null);

    try {
      const res = await axios.get('https://api.box.com/2.0/folders/0/items', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      console.log(res.data);

      setRootInfo(res.data.entries);
    } catch (error) {
      console.error("Error fetching root directory: ", error);
      setRootError('ルートディレクトリの取得に失敗しました');
    } finally {
      setIsLoadingRoot(false);
    }
  };


  const handleDownloadFile = async () => {
    if (!fileId || !session?.access_token) return;

    try {
      setIsLoading(true);
      setError('');

      const fileInfo = await fetch(
        `https://api.box.com/2.0/files/${fileId}/content`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + session?.access_token,
          },
        }
      );

      //レスポンス：https://ja.developer.box.com/reference/get-files-id/#response
      console.log(copyItem);

      if (copyItem.type != 'file') {
        throw new Error('ファイル以外はダウンロードできません。');
      }

      const url = fileInfo.url;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', copyItem.name); // ファイル名はIDをデフォルトとして使用
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file: ", error);
      setError('ファイル以外はダウンロードできません。');
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
                  トークン：{truncateToken(session.access_token!)}
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
            <div className={styles.rootSection}>
              <button
                onClick={handleGetRootDirectory}
                className={`${styles.rootButton} ${isLoadingRoot ? styles.loading : ''}`}
                disabled={isLoadingRoot}
              >
                {isLoadingRoot ? (
                  <div className={styles.buttonLoader}></div>
                ) : (
                  'ファイル一覧取得'
                )}
              </button>
              {rootError && <p className={styles.error}>{rootError}</p>}
              {rootInfo && (
                <div className={styles.rootInfo}>
                  <h3>ファイル一覧</h3>
                  {rootInfo.map((item: any, index: number) => (
                    <div key={item.id} className={styles.infoGrid}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>ID:</span>
                        <span>{item.id}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.id);
                            setCopyItem(item);
                            setCopiedId(item.id);
                            setTimeout(() => setCopiedId(null), 2000); // 2秒後に非表示
                          }}
                          className={`${styles.miniCopyButton} ${copiedId === item.id ? styles.copied : ''}`}
                        >
                          {copiedId === item.id ? '✓ コピー済' : 'コピー'}
                        </button>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>名前:</span>
                        <span>{item.name}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>種別:</span>
                        <span>{item.type}</span>
                      </div>
                      {item.webViewLink && (
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>WebURL:</span>
                          <a href={item.webViewLink} target="_blank" rel="noopener noreferrer" className={styles.infoValue}>
                            {truncateToken(item.webViewLink)}【クリックで開く】
                          </a>
                        </div>
                      )}
                      {index !== rootInfo.length - 1 && <div className={styles.itemDivider}></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.divider}></div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                placeholder="ファイルIDを入力"
                className={styles.fileInput}
              />
              <button
                onClick={handleDownloadFile}
                className={`${styles.downloadButton} ${isLoading ? styles.loading : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className={styles.buttonLoader}></div>
                ) : (
                  'ダウンロード'
                )}
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
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
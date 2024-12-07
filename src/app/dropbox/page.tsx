'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { redirect } from 'next/navigation';
import Login from '../components/Login';
import styles from '../page.module.css';
import { signOut } from 'next-auth/react';

export default function DropboxPage() {
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
  const [fileInfo, setFileInfo] = useState<any>(null);

  if (session?.provider === 'azure-ad') {
    redirect('/azure');
  } else if (session?.provider === 'box') {
    redirect('/box');
  } else if (session?.provider === 'google') {
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
      const response = await fetch(
        "https://api.dropboxapi.com/2/files/list_folder",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + session?.access_token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "path": "",
            "recursive": false,
            "include_media_info": false,
            "include_deleted": false,
            "include_has_explicit_shared_members": false
          })
        }
      );

      if (!response.ok) {
        throw new Error('ファイル一覧の取得に失敗しました');
      }

      const data = await response.json();
      setRootInfo(data.entries);
    } catch (error) {
      console.error("Error fetching root directory: ", error);
      setRootError('ファイル一覧の取得に失敗しました');
    } finally {
      setIsLoadingRoot(false);
    }
  };

  const handleShowFile = async () => {
    if (!fileId || !session?.access_token) return;

    try {
      setIsLoading(true);
      setError('');
      setFileInfo(null);

      const response = await fetch(
        "https://api.dropboxapi.com/2/files/get_metadata",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + session?.access_token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "path": fileId,
            "include_media_info": true,
            "include_deleted": false,
            "include_has_explicit_shared_members": false
          })
        }
      );

      if (!response.ok) {
        throw new Error('ファイル情報の取得に失敗しました');
      }

      const data = await response.json();
      setFileInfo(data);
      setCopyItem(data);
    } catch (error) {
      console.error("Error fetching file info: ", error);
      setError('ファイル情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    if (!fileId || !session?.access_token) return;

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(
        "https://content.dropboxapi.com/2/files/download",
        {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + session?.access_token,
            "Dropbox-API-Arg": JSON.stringify({
              "path": fileId
            })
          }
        }
      );

      if (!response.ok) {
        throw new Error('ファイルのダウンロードに失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', copyItem.name || 'download');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file: ", error);
      setError('ファイルのダウンロードに失敗しました');
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
                        <span className={styles.infoLabel}>パス:</span>
                        <span>{item.path_display}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.path_display);
                            setCopyItem(item);
                            setCopiedId(item.path_display);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className={`${styles.miniCopyButton} ${copiedId === item.path_display ? styles.copied : ''}`}
                        >
                          {copiedId === item.path_display ? '✓ コピー済' : 'コピー'}
                        </button>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>名前:</span>
                        <span>{item.name}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>種別:</span>
                        <span>{item[".tag"]}</span>
                      </div>
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
                placeholder="ファイルパスを入力"
                className={styles.fileInput}
              />
              <button
                onClick={handleShowFile}
                className={`${styles.downloadButton} ${isLoading ? styles.loading : ''}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className={styles.buttonLoader}></div>
                ) : (
                  'ファイル情報取得'
                )}
              </button>
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
            {fileInfo && (
              <div className={styles.fileInfo}>
                <h3>ファイル情報</h3>
                <pre className={styles.jsonDisplay}>
                  {JSON.stringify(fileInfo, null, 2)}
                </pre>
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
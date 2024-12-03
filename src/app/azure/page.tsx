'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import axios from 'axios';
import { redirect } from 'next/navigation';
import Login from '../components/Login';
import styles from '../page.module.css';
import { signOut } from 'next-auth/react';

export default function AzurePage() {
  const { data: session, status } = useSession();
  const [copySuccess, setCopySuccess] = useState(false);
  const [fileId, setFileId] = useState('');
  const [filePath, setFilePath] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rootInfo, setRootInfo] = useState<any>(null);
  const [isLoadingRoot, setIsLoadingRoot] = useState(false);
  const [rootError, setRootError] = useState('');
  const [isFile, setIsFile] = useState(false);

  if (session?.provider === 'google') {
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

  const handleGetRootDirectory = async () => {
    setIsLoadingRoot(true);
    setRootError('');
    setRootInfo(null);

    try {
      const res = await axios.get('https://graph.microsoft.com/v1.0/me/drive/root/children', {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      console.log(res.data);

      setRootInfo(res.data.value);
    } catch (error) {
      console.error("Error fetching root directory: ", error);
      setRootError('ルートディレクトリの取得に失敗しました');
    } finally {
      setIsLoadingRoot(false);
    }
  };

  const handleGetFilePath = async () => {
    setIsLoading(true);
    setError('');
    setFilePath('');
    setFileName('');

    try {
      const res = await axios.get(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      setFilePath(res.data.webUrl);
      setFileName(res.data.name);
      // file かどうかの情報も保存
      setIsFile(!!res.data.file);  // 新しいstate
    } catch (error) {
      console.error("Error fetching files: ", error);
      setError('ファイルパスの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = async () => {
    if (!fileId || !session?.accessToken) return;

    try {
      setIsLoading(true);
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
          responseType: 'blob',
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');

      // Append to html link element page
      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up and remove the link
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
            <div className={styles.rootSection}>
              <button
                onClick={handleGetRootDirectory}
                className={`${styles.rootButton} ${isLoadingRoot ? styles.loading : ''}`}
                disabled={isLoadingRoot}
              >
                {isLoadingRoot ? (
                  <div className={styles.buttonLoader}></div>
                ) : (
                  'ルートディレクトリ取得'
                )}
              </button>
              {rootError && <p className={styles.error}>{rootError}</p>}
              {rootInfo && (
                <div className={styles.rootInfo}>
                  <h3>ルートディレクトリ情報</h3>
                  {rootInfo.map((item: any, index: number) => (
                    <div key={item.id} className={styles.infoGrid}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>ID:</span>
                        <span>{item.id}</span>
                        <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.id);
                              alert('idをコピーしました');
                            }}
                            className={styles.miniCopyButton}
                          >
                            コピー
                          </button>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>名前:</span>
                        <span>{item.name}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>種別:</span>
                        <span>{item.file ? 'ファイル' : item.folder ? 'フォルダー' : '-'}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>WebURL:</span>
                        <a href={item.webUrl} target="_blank" rel="noopener noreferrer" className={styles.infoValue}>
                          {truncateToken(item.webUrl)}【クリックで開く】
                        </a>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>作成日時:</span>
                        <span>
                          {new Date(item.createdDateTime).toLocaleString('ja-JP')}
                        </span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>更新日時:</span>
                        <span>
                          {new Date(item.lastModifiedDateTime).toLocaleString('ja-JP')}
                        </span>
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
                placeholder="ファイルIDを入力"
                className={styles.fileInput}
              />
              <button
                onClick={handleGetFilePath}
                className={`${styles.fileButton} ${isLoading ? styles.loading : ''}`}
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
                <div className={styles.fileInfo}>
                  <p className={styles.filePath}>
                    ファイル名: {fileName}
                  </p>
                  <div className={styles.pathRow}>
                    <p className={styles.filePath}>
                      ファイルパス: {filePath}
                    </p>
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
                </div>
                <div className={styles.downloadSection}>
                  {isFile ? (
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
                  ) : (
                    <p className={styles.folderMessage}>フォルダはダウンロードできません</p>
                  )}
                </div>
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
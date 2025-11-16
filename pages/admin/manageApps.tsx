import React, { useState, useEffect } from 'react';
import Head from 'next/head';

// Firebase SDKからのインポート
import { 
  db, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  QueryDocumentSnapshot,
  DocumentData // DocumentData型をインポート
} from '@/lib/firebase'; 

// --- 型定義 ---
interface AppData {
  id: string; // FirestoreのドキュメントID
  name: string; // アプリ名
  genre: string; // ✅ 追加: ジャンル
  createdAt: string; // ✅ 登録日 (文字列で受け取る)
  area: string; // 地域 (アプリ独自の管理フィールド)
  url: string; // studio.firebaseのアプリURL（特売情報URL）
  isActive: boolean; // 公開ステータス (アプリ独自の管理フィールド)
}

// エリアの選択肢 (新規作成・編集用として維持)
const areas = ['那須塩原市・那須町', '大田原市', 'その他エリアA', 'その他エリアB'];
const APPS_COLLECTION = 'apps'; // Firestoreのコレクション名

// 日付フォーマットヘルパー関数
const formatDate = (timestamp: string): string => {
    try {
        // Firestoreのタイムスタンプ文字列をDateオブジェクトに変換
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return '日付エラー';
        }
        // 年/月/日 (時間) 形式で表示
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Tokyo'
        });
    } catch {
        return '日付なし';
    }
};

const ManageAppsPage: React.FC = () => {
  const [apps, setApps] = useState<AppData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState<AppData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null); // ✅ 追加: エラー状態を管理

  // 新規作成用の初期値
  const emptyApp: AppData = {
    id: '', 
    name: '',
    genre: '', // 新規時は空
    createdAt: new Date().toISOString(), // 新規時は現在日時
    area: areas[0],
    url: '',
    isActive: true,
  };

  // データの取得 (R: Read)
  const fetchApps = async () => {
    setIsLoading(true);
    setFetchError(null); // エラーをリセット
    try {
      const appsCol = collection(db, APPS_COLLECTION);
      const appSnapshot = await getDocs(appsCol);
      
      const appList = appSnapshot.docs.map((doc: QueryDocumentSnapshot) => {
        // rawDataをDocumentDataとして取得
        const rawData = doc.data() as DocumentData; 

        let processedCreatedAt: string;
        
        const rawCreatedAt = rawData.createdAt;

        // Timestamp型または文字列型に対応する処理
        if (rawCreatedAt && typeof rawCreatedAt === 'object' && 'toDate' in rawCreatedAt && typeof rawCreatedAt.toDate === 'function') {
            // Timestampオブジェクトの場合
            processedCreatedAt = rawCreatedAt.toDate().toISOString();
        } else if (typeof rawCreatedAt === 'string') {
            // 文字列の場合
            processedCreatedAt = rawCreatedAt;
        } else {
            // 該当するデータがない場合
            processedCreatedAt = new Date().toISOString();
        }

        // 必要なプロパティのみを抽出し、createdAtを上書きする問題を解消
        const dataWithoutCreatedAt: Omit<AppData, 'id' | 'createdAt'> = {
            name: rawData.name || '',
            genre: rawData.genre || '',
            area: rawData.area || areas[0],
            url: rawData.url || '',
            isActive: rawData.isActive === undefined ? false : rawData.isActive,
        };

        return {
            id: doc.id,
            createdAt: processedCreatedAt, // 処理済みの createdAt を設定
            ...dataWithoutCreatedAt // その他のフィールドを展開
        } as AppData;
      });
      
      setApps(appList); 

    } catch (error: any) { // ✅ エラー型をanyにキャスト
      console.error("データの取得中にエラーが発生しました:", error);
      // ✅ 権限エラーの場合、具体的なメッセージをセット
      if (error.code === 'permission-denied' || error.message.includes('permission')) {
          setFetchError("Firestoreのセキュリティルールにより、データの読み込みが拒否されました。ルール設定を確認してください。");
      } else {
          setFetchError("データの読み込み中に不明なエラーが発生しました。コンソールを確認してください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // 編集/新規作成モーダルを開く
  const openModal = (app: AppData | null = null) => {
    // 編集時は既存のデータを、新規作成時はemptyAppをセット
    setCurrentApp(app ? app : emptyApp);
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentApp(null);
  };

  // 保存処理 (C: Create / U: Update)
  const handleSave = async (app: AppData) => {
    try {
      // データの保存時には createdAt, genre は自動更新・自動生成を前提とするため、
      // ユーザーが編集可能な name, area, url, isActive, genre のみを更新対象とする
      const updatePayload = {
        name: app.name,
        area: app.area,
        url: app.url,
        isActive: app.isActive,
        genre: app.genre, // 編集可能に設定
        // 新規作成時のみ createdAt に新しい Date() オブジェクトを追加（FirestoreがTimestampとして保存）
        ...(app.id === '' && { createdAt: new Date() }), 
      };

      if (app.id === '') {
        // 新規作成 (C: Create)
        await addDoc(collection(db, APPS_COLLECTION), updatePayload);
        alert(`アプリ「${app.name}」を新規追加しました。`);
      } else {
        // 更新 (U: Update)
        const appDocRef = doc(db, APPS_COLLECTION, app.id);
        await updateDoc(appDocRef, updatePayload);
        alert(`アプリ「${app.name}」の情報を更新しました。`);
      }
      
      closeModal();
      await fetchApps(); // データを再取得してリストを更新

    } catch (error) {
      console.error("データの保存中にエラーが発生しました:", error);
      alert("データの保存に失敗しました。コンソールを確認してください。");
    }
  };

  // 削除処理 (D: Delete)
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`本当にアプリ「${name}」を削除しますか？`)) {
      return;
    }
    try {
      const appDocRef = doc(db, APPS_COLLECTION, id);
      await deleteDoc(appDocRef);
      alert(`アプリ「${name}」を削除しました。`);
      await fetchApps(); 
    } catch (error) {
      console.error("データの削除中にエラーが発生しました:", error);
      alert("データの削除に失敗しました。コンソールを確認してください。");
    }
  };

  return (
    <div style={styles.container}>
      <Head>
        <title>アプリ管理 (CRUD) | Admin</title>
      </Head>

      <h1 style={styles.h1}>アプリ管理 (CRUD)</h1>
      
      <button 
        style={styles.addButton} 
        onClick={() => openModal()}
        disabled={isLoading}
      >
        + 新しいアプリを追加
      </button>
      
      {isLoading ? (
        <p style={styles.loading}>データ読み込み中...</p>
      ) : fetchError ? ( // ✅ 修正: エラーメッセージの表示
        <div style={styles.errorBox}>
            <p style={{ fontWeight: 'bold' }}>エラーが発生しました:</p>
            <p>{fetchError}</p>
            <p style={{ marginTop: '10px', fontSize: '14px' }}>
                **確認事項:** 1. Firebaseの**セキュリティルール**で `apps` コレクションへの読み込みが許可されていますか？ 
                2. 認証が必要な場合、管理者は正しくログインしていますか？
            </p>
            <button style={{...styles.addButton, backgroundColor: '#f44336'}} onClick={fetchApps}>
                再試行
            </button>
        </div>
      ) : (
        // アプリリスト（R: Read）
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>番号 (ID)</th>
                <th style={styles.th}>アプリ名</th>
                <th style={styles.th}>ジャンル</th> 
                <th style={styles.th}>登録日</th> 
                <th style={styles.th}>編集</th>
                <th style={styles.th}>削除</th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 ? (
                <tr style={styles.tr}>
                    <td colSpan={6} style={{...styles.td, textAlign: 'center'}}>登録されているアプリがありません。</td>
                </tr>
              ) : (
                apps.map((app, index) => (
                    <tr key={app.id} style={styles.tr}>
                      {/* 番号 (ID) はインデックス + 1 で表示 */}
                      <td style={styles.td}>{index + 1}</td> 
                      <td style={styles.td}>{app.name}</td>
                      <td style={styles.td}>{app.genre || '未設定'}</td> 
                      <td style={styles.td}>{formatDate(app.createdAt)}</td> 
                      <td style={styles.td}>
                        <button style={styles.editButton} onClick={() => openModal(app)}>
                          編集 (URL登録)
                        </button>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.deleteButton} onClick={() => handleDelete(app.id, app.name)}>
                          削除
                        </button>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 編集/新規作成モーダル (C: Create, U: Update) */}
      {isModalOpen && currentApp && (
        <AppModal 
          app={currentApp} 
          onSave={handleSave} 
          onClose={closeModal} 
          areas={areas}
        />
      )}
    </div>
  );
};

// 編集/新規作成モーダルのコンポーネント (省略)
interface ModalProps {
    app: AppData;
    onSave: (app: AppData) => Promise<void>; 
    onClose: () => void;
    areas: string[];
}

const AppModal: React.FC<ModalProps> = ({ app, onSave, onClose, areas }) => {
    const [data, setData] = useState<AppData>(app);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const newValue: string | boolean = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setData({ ...data, [name]: newValue });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(data);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <h3 style={modalStyles.h3}>{data.id === '' ? '新規アプリ 追加' : 'アプリ情報 編集 (URL登録)'}</h3>
                <form onSubmit={handleSubmit}>
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>登録日:</label>
                        <input type="text" value={formatDate(data.createdAt)} style={{...modalStyles.input, backgroundColor: '#eee'}} disabled />
                    </div>
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>アプリ名:</label>
                        <input type="text" name="name" value={data.name} onChange={handleChange} style={modalStyles.input} required />
                    </div>
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>ジャンル:</label>
                        <input type="text" name="genre" value={data.genre} onChange={handleChange} style={modalStyles.input} required />
                    </div>
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>エリア:</label>
                        <select name="area" value={data.area} onChange={handleChange} style={modalStyles.input} required>
                            {areas.map(area => <option key={area} value={area}>{area}</option>)}
                        </select>
                    </div>
                    {/* studio.firebaseのアプリURLに対応するフィールド */}
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>アプリURL (studio.firebase/特売情報):</label>
                        <input type="url" name="url" value={data.url} onChange={handleChange} style={modalStyles.input} required />
                    </div>
                    <div style={modalStyles.formGroup}>
                        <label style={modalStyles.label}>
                            <input 
                                type="checkbox" 
                                name="isActive" 
                                checked={data.isActive} 
                                onChange={handleChange} 
                                style={{marginRight: '10px'}}
                            />
                            公開する
                        </label>
                    </div>
                    <div style={modalStyles.buttonGroup}>
                        <button type="submit" style={modalStyles.saveButton} disabled={isSaving}>
                          {isSaving ? '保存中...' : '保存'}
                        </button>
                        <button type="button" onClick={onClose} style={modalStyles.cancelButton} disabled={isSaving}>キャンセル</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- スタイル定義 (エラーボックスを追加) ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' },
  h1: { color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' },
  addButton: {
    backgroundColor: '#0070f3', color: 'white', padding: '10px 15px', border: 'none', 
    borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontSize: '16px'
  },
  loading: { textAlign: 'center', fontSize: '18px', color: '#0070f3', padding: '50px' },
  errorBox: {
    padding: '20px',
    backgroundColor: '#ffe0e0',
    border: '1px solid #ff0000',
    borderRadius: '8px',
    color: '#333',
    textAlign: 'center',
    marginBottom: '20px'
  },
  tableContainer: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.1)' },
  th: { backgroundColor: '#f4f4f4', padding: '12px', textAlign: 'left', border: '1px solid #ddd' },
  td: { padding: '12px', border: '1px solid #ddd', verticalAlign: 'middle' },
  tr: {}, 
  editButton: { backgroundColor: '#ffc107', color: 'black', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' },
  deleteButton: { backgroundColor: '#dc3545', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

const modalStyles: { [key: string]: React.CSSProperties } = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  h3: { marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  formGroup: { marginBottom: '15px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', marginTop: '20px' },
  saveButton: { backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '10px' },
  cancelButton: { backgroundColor: '#6c757d', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' },
};

export default ManageAppsPage;


import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

// --- 定数定義 ---
type ProjectCategory = 'VOLUNTEER' | 'EXCHANGE' | 'DISASTER' | 'REVITALIZATION' | 'OTHER';

const CATEGORIES: { id: ProjectCategory; label: string; desc: string; color: string }[] = [
  { id: 'VOLUNTEER', label: 'ボランティア・清掃', desc: '清掃, 植林, 動物保護, 見守り', color: 'ring-green-500 bg-green-50 text-green-700' },
  { id: 'EXCHANGE', label: '交流・文化・趣味', desc: '地域交流, 文化祭, 趣味, 学習会', color: 'ring-orange-500 bg-orange-50 text-orange-700' },
  { id: 'DISASTER', label: '防災・緊急支援', desc: '緊急, 物資支援, 安否確認', color: 'ring-red-500 bg-red-50 text-red-700' },
  { id: 'REVITALIZATION', label: '地域活性化・新企画', desc: '新企画, アイデア募集', color: 'ring-blue-500 bg-blue-50 text-blue-700' },
  { id: 'OTHER', label: 'その他', desc: '上記に当てはまらない活動', color: 'ring-gray-500 bg-gray-50 text-gray-700' },
];

const TAG_OPTIONS: Record<ProjectCategory, string[]> = {
  VOLUNTEER: ['清掃活動', '植林・自然保護', '動物保護', '見守り・防犯', 'ゴミ拾い'],
  EXCHANGE: ['地域交流会', '文化祭・お祭り', '趣味の集い', '学習会', 'ワークショップ', 'スポーツ'],
  DISASTER: ['【緊急】物資支援', '【緊急】安否確認', '【緊急】人手募集', '災害ボランティア', '防災訓練', '情報共有'],
  REVITALIZATION: ['新企画アイデア募集', 'アンケート協力', 'イベント実行委員募集', '空き家活用', 'マルシェ開催'],
  OTHER: ['相談', '募集', '告知'] 
};

export default function CreateProject() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAI, setIsCheckingAI] = useState(false); // AI審査中のステート
  const [aiCheckError, setAiCheckError] = useState<string | null>(null); // AI審査のエラーメッセージ
  
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    category: '' as ProjectCategory | '',
    customCategory: '', 
    title: '',
    tags: [] as string[],
    description: '',
    location: '',
    dateStr: '',
    maxMembers: '',
    requirements: '',
    contactLineUrl: '',
    otherInfo: '' 
  });

  // カテゴリ選択時の処理
  const handleCategorySelect = (cat: ProjectCategory) => {
    setFormData(prev => ({ ...prev, category: cat, tags: [] }));
  };

  // タグのトグル処理
  const toggleTag = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  // 自由入力タグの追加処理
  const handleAddCustomTag = () => {
    if (!tagInput.trim()) return;
    if (!formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
    }
    setTagInput(''); 
  };

  // ▼▼▼ AIによるコンテンツ審査関数 ▼▼▼
  const checkContentWithAI = async (textToCheck: string): Promise<{ safe: boolean; reason?: string }> => {
    try {
      const res = await fetch('/api/check-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToCheck }),
      });

      if (!res.ok) {
        console.error('AI Check API failed');
        // APIエラー時は一旦安全側に倒して投稿を許可する（UX優先）
        return { safe: true }; 
      }

      const data = await res.json();
      return { safe: data.safe, reason: data.reason };

    } catch (error) {
      console.error('AI Check Error:', error);
      return { safe: true };
    }
  };

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiCheckError(null);
    
    // 必須チェック
    const isCategoryValid = formData.category !== 'OTHER' || (formData.category === 'OTHER' && formData.customCategory.trim() !== '');
    if (!formData.category || !isCategoryValid || !formData.title || !formData.location || !formData.contactLineUrl) {
      alert('必須項目を入力してください');
      return;
    }

    // LINE URLチェック
    if (!formData.contactLineUrl.includes('line.me')) {
        if(!confirm('LINEのURLではないようです。「line.me」を含むURLの入力を推奨します。このまま続けますか？')) {
            return;
        }
    }

    // 1. AI審査開始
    setIsCheckingAI(true);

    // 審査対象のテキストを結合（タイトル + 説明文 + その他 + カスタムカテゴリ）
    const textToCheck = `${formData.title} ${formData.description} ${formData.otherInfo} ${formData.customCategory}`;
    
    try {
        const checkResult = await checkContentWithAI(textToCheck);

        if (!checkResult.safe) {
            // 審査落ち：エラーを表示して中断
            setIsCheckingAI(false);
            setAiCheckError(checkResult.reason || '不適切な内容が含まれている可能性があります。');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    } catch (error) {
        console.error("AI Check Error:", error);
    }

    setIsCheckingAI(false);

    // 2. 審査OKなら送信処理へ
    setIsSubmitting(true);

    // TODO: ここで Firebase への保存処理 (addDoc) を行う
    // import { addDoc, collection } from 'firebase/firestore';
    // import { db } from '@/lib/firebase-client'; // 実際のパスに合わせてください
    // await addDoc(collection(db, 'projects'), { ...formData, createdAt: new Date() });
    
    console.log('Submission Data:', formData);

    setTimeout(() => {
      setIsSubmitting(false);
      alert('AI審査を通過しました。\n募集を開始します！');
      router.push('/projects');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Head>
        <title>新規プロジェクト作成 | ADTOWN-ISHIGE</title>
      </Head>

      {/* ヘッダー */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-gray-500 text-sm">キャンセル</button>
        <h1 className="font-bold text-gray-800">活動の発起</h1>
        <div className="w-16"></div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        
        {/* ▼▼▼ AI審査エラー表示エリア ▼▼▼ */}
        {aiCheckError && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md animate-pulse">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-bold text-red-800">投稿できませんでした</h3>
                        <p className="text-sm text-red-700 mt-1">
                            {aiCheckError}
                        </p>
                        <p className="text-xs text-red-600 mt-2">
                            内容を修正して、再度お試しください。
                        </p>
                    </div>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* 1. カテゴリ選択 */}
          <section>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              活動の種類を選んでください <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    formData.category === cat.id
                      ? `border-transparent ring-2 shadow-md ${cat.color}`
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold">{cat.label}</div>
                  <div className="text-xs text-gray-500 mt-1 opacity-80">{cat.desc}</div>
                </button>
              ))}
            </div>

            {formData.category === 'OTHER' && (
              <div className="mt-3 animate-fade-in-up">
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  具体的な活動の種類を入力してください <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="例：部員募集、迷い犬探しなど"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                />
              </div>
            )}
          </section>

          {/* 2. タグ選択 */}
          {formData.category && (
            <section className="animate-fade-in-up">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                タグを選択・追加 (複数可)
              </label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {TAG_OPTIONS[formData.category].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {formData.tags
                  .filter(t => !TAG_OPTIONS[formData.category as ProjectCategory].includes(t))
                  .map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="px-3 py-1.5 rounded-full text-sm border bg-blue-600 text-white border-blue-600"
                    >
                      {tag} ×
                    </button>
                  ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="新しいタグを入力"
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!tagInput.trim()}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  追加
                </button>
              </div>
            </section>
          )}

          {/* 3. LINE連携設定 */}
          <section className="bg-green-50 border border-green-200 p-5 rounded-xl shadow-sm">
            <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
               <span className="text-xl">💬</span> 連絡用LINEの設定 <span className="text-red-600 text-xs ml-1">*必須</span>
            </h3>
            <p className="text-xs text-green-700 mb-4 leading-relaxed">
              <strong>このアプリはマッチングのみを行い、その後のやり取りには関与しません。</strong><br/>
              参加者との連絡手段として、LINEの招待URLを入力してください。<br/>
              <span className="opacity-80">※個人のプライバシー保護のため、<strong>「LINEオープンチャット」</strong>の作成・利用を強く推奨します。</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-green-800 mb-1">LINE オープンチャット / 公式アカウント / 招待URL</label>
              <input
                type="url"
                placeholder="https://line.me/ti/g2/..."
                className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-sm"
                value={formData.contactLineUrl}
                onChange={(e) => setFormData({ ...formData, contactLineUrl: e.target.value })}
                required
              />
              <p className="text-xs text-green-600 mt-1 text-right">
                <a href="https://guide.line.me/ja/services/openchat.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">
                   オープンチャットの作り方はこちら
                </a>
              </p>
            </div>
          </section>

          {/* 4. 基本情報 */}
          <section className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">タイトル <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="例：那須街道ゴミ拾い参加者募集"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={40}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{formData.title.length}/40</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">活動内容の詳細 <span className="text-red-500">*</span></label>
              <textarea
                rows={6}
                placeholder={`活動の目的や当日の流れを具体的に書いてください。\n\n(例)\n集合時間：9:00\n解散時間：11:00\n雨天時の対応：中止`}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </section>

          {/* 5. 開催情報 */}
          <section className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4">開催情報</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">開催日時・期限</label>
                <input
                  type="text" 
                  placeholder="例：2025/11/30 10:00〜"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.dateStr}
                  onChange={(e) => setFormData({ ...formData, dateStr: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">開催場所 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="例：那須町役場前"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">募集人数 (任意)</label>
                <input
                  type="number"
                  placeholder="例：10"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                />
              </div>
               <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">持ち物・参加条件</label>
                <input
                  type="text"
                  placeholder="例：軍手、汚れてもいい服"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">その他・特記事項</label>
              <textarea
                rows={2}
                placeholder="例：駐車場あり、雨天時の連絡方法、遅刻厳禁など"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={formData.otherInfo}
                onChange={(e) => setFormData({ ...formData, otherInfo: e.target.value })}
              />
            </div>
          </section>

          {/* 注意書き */}
          <div className="bg-gray-100 p-4 rounded-lg text-xs text-gray-600 leading-relaxed">
            <span className="font-bold block mb-1">📝 投稿のガイドライン：</span>
            誹謗中傷、公序良俗に反する内容、政治・宗教活動への勧誘、個人的な売買（フリマ）目的の投稿は禁止されています。
            <strong className="text-blue-600">投稿内容はAIによって自動的に審査され、不適切と判断された場合は投稿できません。</strong>
          </div>

          {/* 送信ボタンエリア */}
          <div className="pt-4 pb-10">
            <button
              type="submit"
              disabled={isSubmitting || isCheckingAI || !formData.category || !formData.contactLineUrl || (formData.category === 'OTHER' && !formData.customCategory)}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                isSubmitting || isCheckingAI || !formData.category || !formData.contactLineUrl || (formData.category === 'OTHER' && !formData.customCategory)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:shadow-xl hover:from-green-500 hover:to-green-400'
              }`}
            >
              {isCheckingAI ? (
                  <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    AIが内容を審査中...
                  </>
              ) : isSubmitting ? (
                  '送信中...' 
              ) : (
                  'この内容で募集を開始する'
              )}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
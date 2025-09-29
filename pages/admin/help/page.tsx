'use client';

export default function AdminHelpPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📘 ChatGPT 質問ガイド（操作マニュアル）</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">❓ 操作で困ったら</h2>
        <p className="mb-2">以下のようにChatGPTに質問してください：</p>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">
※これは「みんなの那須アプリ」本番プロジェクトの続きです。

ChatGPTがやってくれない理由①②③を理解した前提で進めてください。

✅やってほしいこと：/admin/landing-editor にLINE登録セクションを追加したい  
✅現在地：LINEセクションは未追加、他は完成済みです  
✅ゴール：LINEセクションをデザイン付きで挿入し、保存 → 反映されること

✅Canvasを使わず、ここに全コードを貼ってください。説明不要です。
        </pre>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">✅ 操作一覧（どこで何ができるか）</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li><strong>/admin/landing-editor：</strong> ランディングページの文言を編集・保存</li>
          <li><strong>/admin/apps：</strong> アプリ名・URL・カテゴリを一覧・編集</li>
          <li><strong>/admin/users：</strong> ユーザー一覧と詳細編集（紹介者IDなど）</li>
          <li><strong>/admin/inquiries：</strong> 問い合わせ内容の確認</li>
          <li><strong>/admin/rewards：</strong> 月ごとの紹介報酬の集計確認</li>
          <li><strong>/admin/export：</strong> CSVファイルの出力・ダウンロード</li>
          <li><strong>/admin/functions：</strong> 紹介報酬集計やCSV出力をボタンで実行</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">📎 よくある質問</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>編集が反映されない → 保存ボタンを押しましたか？</li>
          <li>エラーが出た → ChatGPTに「保存時にエラー」と伝えてください</li>
          <li>CSVが出ない → `/admin/functions` で「CSV出力」ボタンを実行してください</li>
        </ul>
      </section>

      <footer className="text-sm text-gray-500 mt-12 text-center">
        このシステムは「みんなの那須アプリ」事業向けに構築されています。
      </footer>
    </div>
  );
}

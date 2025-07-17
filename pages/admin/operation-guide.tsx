import Link from 'next/link';

const OperationGuidePage = () => {
  return (
    <div className="p-5 max-w-3xl mx-auto">
      <Link href="/admin" className="text-blue-500 hover:underline">
        ← 管理メニューに戻る
      </Link>
      <h1 className="text-3xl font-bold my-6 text-center">運用ガイド</h1>
      
      <div className="bg-white shadow-md rounded p-8 prose max-w-none">
        <h2>はじめに</h2>
        <p>
          このページは、クライアント様がご自身で「みんなの那須アプリ」を運用・管理するためのガイドです。
          各機能の使い方について、分かりやすく説明します。
        </p>

        <hr />

        <h3>アプリ管理</h3>
        <p>
          「アプリ管理」ページでは、ユーザーに提供するアプリの一覧を確認したり、新しいアプリを追加・編集・削除したりすることができます。
          ユーザーが利用できるアプリをここからコントロールします。
        </p>
        <ul>
          <li><strong>新規アプリ追加:</strong> 新しいアプリの名前、ジャンル、URLを登録します。</li>
          <li><strong>編集:</strong> 既存のアプリ情報を修正します。（この機能は将来実装予定です）</li>
          <li><strong>削除:</strong> 不要になったアプリを一覧から削除します。</li>
        </ul>

        <h3>ランディングページ編集</h3>
        <p>
          サイトのトップページ（お客様が最初に訪れるページ）に表示される見出しやキャッチコピーなどを、実際の表示をプレビューしながら直感的に編集することができます。
          キャンペーンや季節に合わせて、文言を自由に変更してください。
        </p>

        <h3>ユーザー管理</h3>
        <p>
          このアプリに登録したユーザーの一覧を確認できます。メールアドレスや最終ログイン日時などの情報を閲覧できます。
        </p>

        <h3>問い合わせ管理</h3>
        <p>
          ユーザーから送信された問い合わせ内容を一覧で確認し、対応状況を管理することができます。
        </p>

        <hr />

        <p className="mt-8">
          今後、機能が追加された際には、この運用ガイドも更新していきます。
          ご不明な点があれば、いつでもお問い合わせください。
        </p>
      </div>
    </div>
  );
};

export default OperationGuidePage;


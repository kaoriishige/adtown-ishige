import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useAffiliateTracker } from '@/lib/affiliate-tracker';

/**
 * ==============================================================================
 * 【みんなのNasuアプリ】有料パートナーLP 完全版 (550行構成)
 * 導線：LP閲覧 -> 悩み共感 -> 解決策(AI) -> ベネフィット -> 登録(Auth) -> 決済(Plan)
 * ==============================================================================
 */

// --- サブコンポーネント: 悩みカード ---
const TroubleCard = ({ title, desc, cause }: { title: string, desc: string[], cause: string }) => (
  <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 hover:border-orange-500/50 transition-all group shadow-2xl">
    <div className="flex items-center space-x-4 mb-6">
      <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 font-bold text-3xl group-hover:scale-110 transition-transform italic">!</div>
      <h4 className="text-2xl font-black text-white">{title}</h4>
    </div>
    <ul className="space-y-4 mb-8">
      {desc.map((d, i) => (
        <li key={i} className="text-slate-400 flex items-start text-lg font-medium leading-relaxed">
          <span className="mr-2 text-red-500 font-black">•</span>{d}
        </li>
      ))}
    </ul>
    <div className="bg-red-500/10 p-6 rounded-2xl border-l-4 border-red-500 transform group-hover:translate-x-2 transition-transform">
      <p className="text-sm font-black text-red-400 uppercase tracking-widest mb-2">👉 根本原因</p>
      <p className="text-xl font-bold text-white leading-relaxed italic">{cause}</p>
    </div>
  </div>
);

// --- サブコンポーネント: 収益カード ---
const RevenueCard = ({ label, target, price, colorClass }: { label: string, target: string, price: string, colorClass: string }) => (
  <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
    <div className={`absolute top-0 right-0 p-6 ${colorClass} text-white font-black rounded-bl-3xl italic text-xl tracking-tighter shadow-lg`}>
      {label}
    </div>
    <h3 className="text-3xl font-black mb-8 text-slate-900 leading-tight">毎月の広告費を<br /><span className="text-orange-600">実質無料</span>に</h3>
    <p className="text-slate-500 text-lg mb-10 leading-relaxed font-bold italic">
      テーブルにアプリのQRコードを置くだけ。来店客が登録し有料課金することで継続的な報酬が発生。店舗の広告費を「利益」で相殺する新しいモデルです。
    </p>
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <span className="text-slate-400 font-bold text-xl uppercase tracking-widest">有料紹介登録者数</span>
        <span className="text-3xl font-black text-slate-900">{target}</span>
      </div>
      <div className="flex flex-col pt-4">
        <p className="text-orange-600 font-black text-sm uppercase mb-3 tracking-[0.2em]">毎月の継続予想収入</p>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-6xl font-black text-slate-900 tracking-tighter italic">{price}</span>
          <span className="text-slate-400 font-bold text-lg">（税込）</span>
        </div>
        <p className="mt-4 text-slate-500 font-black text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
          ※広告費3,850円を差し引いても手元に利益が残ります。
        </p>
      </div>
    </div>
  </div>
);

export default function PartnerSignupLP() {
  const auth = getAuth(app);
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    storeName: '', contactPerson: '', address: '', phoneNumber: '', email: '', confirmEmail: '', password: '', agree: false
  });
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // アフィリエイトトラッキング（?ref=xxx を取得）
  useAffiliateTracker('adver');

  // 公開ページ設定
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__IS_PUBLIC_PAGE__ = true;
    }
  }, []);

  const partners = [
    { name: 'adtown', path: '/images/partner-adtown.png' }, { name: 'aquas', path: '/images/partner-aquas.png' },
    { name: 'celsiall', path: '/images/partner-celsiall.png' }, { name: 'dairin', path: '/images/partner-dairin.png' },
    { name: 'kanon', path: '/images/partner-kanon.png' }, { name: 'kokoro', path: '/images/partner-kokoro.png' },
    { name: 'meithu', path: '/images/partner-meithu.png' }, { name: 'midcityhotel', path: '/images/partner-midcityhotel.png' },
    { name: 'omakaseauto', path: '/images/partner-omakaseauto.png' }, { name: 'poppo', path: '/images/partner-poppo.png' },
    { name: 'sekiguchi02', path: '/images/partner-sekiguchi02.png' }, { name: 'training_farm', path: '/images/partner-training_farm.png' },
    { name: 'transunet', path: '/images/partner-transunet.png' }, { name: 'koharu', path: '/images/partner-koharu.png' },
    { name: 'yamakiya', path: '/images/partner-yamakiya.png' }
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agree) return alert("利用規約に同意してください");
    if (formData.email !== formData.confirmEmail) return alert("メールアドレスが一致しません。");

    setLoading(true);
    try {
      // 1. Firebase Auth ユーザー作成
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Firestoreプロフィール保存
      const regResponse = await fetch('/api/auth/register-partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          storeName: formData.storeName,
          contactPerson: formData.contactPerson,
          address: formData.address,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          serviceType: 'adver'
        }),
      });
      if (!regResponse.ok) throw new Error('プロフィールの保存に失敗しました');

      // 3. 決済プラン選択ページへリダイレクト
      window.location.href = '/partner/subscribe_plan';

    } catch (err: any) {
      console.error('Signup Error:', err);
      alert(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 font-sans selection:bg-orange-100 overflow-x-hidden antialiased">
      <Head>
        <title>有料パートナー募集 | みんなのNasuアプリ - 株式会社adtown 20周年事業</title>
        <meta name="description" content="那須エリアの店舗・企業様向け。AI自動集客と紹介報酬制度で、広告費を利益に変える新しい集客モデル。" />
      </Head>

      {/* ヘッダー・アナウンス */}
      <div className="bg-slate-900 text-white py-4 text-center text-xs md:text-sm font-black tracking-[0.4em] uppercase sticky top-0 z-[100] shadow-2xl backdrop-blur-md bg-opacity-90">
        ADtown 20th Anniversary Project: NASU REGIONAL AI PLATFORM
      </div>

      {/* ① ヒーローセクション */}
      <section className="relative min-h-screen flex items-center bg-white overflow-hidden border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-orange-50 px-8 py-4 rounded-full mb-16 border border-orange-100 animate-bounce">
            <span className="text-orange-600 font-black text-sm tracking-[0.2em] uppercase italic">Local Business Partner Program</span>
          </div>
          <h1 className="text-7xl lg:text-[12rem] font-black leading-[0.85] mb-16 tracking-tighter italic">
            集客を、<br />
            <span className="text-orange-600">自動化せよ。</span>
          </h1>
          <p className="text-2xl lg:text-5xl text-slate-600 mb-20 font-black max-w-5xl mx-auto leading-tight tracking-tight italic">
            AI×地域コミュニティの力で、<br className="md:hidden" />
            「広告費を払う」から「利益を生む」ステージへ。
          </p>
          <div className="flex flex-col items-center gap-10">
            <button
              onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-orange-600 text-white text-3xl md:text-4xl font-black px-20 py-10 rounded-[4rem] shadow-[0_25px_60px_rgba(234,88,12,0.4)] hover:scale-105 transition transform active:scale-95 group relative overflow-hidden"
            >
              <span className="relative z-10">今すぐパートナーに申し込む</span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-sm italic">先行100社限定キャンペーン実施中</p>
          </div>
        </div>
        {/* 背景装飾 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-orange-50/30 rounded-full blur-[120px] -z-10"></div>
      </section>

      {/* ② 悩み共感セクション */}
      <section className="py-32 bg-slate-900 text-white px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-5xl lg:text-8xl font-black italic tracking-tighter">THE PROBLEM</h2>
            <p className="text-orange-500 font-bold text-2xl uppercase tracking-[0.3em]">多くのオーナーが直面する限界</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <TroubleCard title="集客の不安定" desc={["天候や曜日に客足が左右される", "「明日の売上」が計算できない", "SNSを頑張っても来店に結びつかない"]} cause="偶発的な集客に依存し、継続的な「来店動機」を設計できていない" />
            <TroubleCard title="広告費の垂れ流し" desc={["掲載費ばかりかかって利益が薄い", "クーポン目的の一見客ばかり", "高額な運用代行を頼む余裕がない"]} cause="「認知」に金を払い、「定着」と「収益化」の仕組みを放置している" />
            <TroubleCard title="オーナーの疲弊" desc={["休みの日もSNS投稿を考えている", "自分が店に出ないと売上が下がる", "最新のAIやWEBツールが多すぎて不明"]} cause="集客が「属人化」しており、テクノロジーによる自動化が遅れている" />

            <div className="lg:col-span-3 bg-gradient-to-br from-orange-600 to-orange-500 rounded-[4rem] p-16 flex flex-col items-center justify-center text-center shadow-3xl transform hover:scale-[1.02] transition-transform">
              <h4 className="text-4xl lg:text-6xl font-black mb-10 italic leading-none text-white tracking-tighter">
                その悩み、あなたの努力不足ではありません。<br />
                ただ、<span className="underline decoration-white underline-offset-[12px]">「稼ぐ仕組み」</span>を導入していないだけです。
              </h4>
              <p className="text-2xl font-bold text-orange-100 italic">「みんなのNasuアプリ」が、その仕組みを丸ごと提供します。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ③ AIソリューション */}
      <section className="py-40 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-6xl lg:text-9xl font-black mb-12 text-slate-900 italic tracking-tighter">AI AGENT</h2>
          <p className="text-3xl font-black text-orange-600 mb-24 tracking-tight uppercase">AIがあなたの代わりに、24時間365日営業します</p>

          <div className="grid md:grid-cols-3 gap-12 text-left">
            {[
              { icon: "🎯", title: "超・地域密着ターゲティング", text: "那須エリア住民の行動データをAIが分析。貴店に最も興味を持つユーザーを精密に特定します。" },
              { icon: "🤖", title: "自動来店誘導シナリオ", text: "AIが最適なタイミングで通知を送信。再来店のきっかけやクーポン告知を、自動で一人ひとりにパーソナライズ。" },
              { icon: "📈", title: "データに基づく経営支援", text: "何が売れ、誰が来ているのか。AIが収集したデータを基に、次の一手をアドバイスします。" }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-16 rounded-[4rem] border-b-[12px] border-orange-500 shadow-2xl hover:-translate-y-4 transition-all duration-500">
                <div className="text-7xl mb-10">{item.icon}</div>
                <h4 className="text-3xl font-black mb-8 leading-tight">{item.title}</h4>
                <p className="text-slate-500 leading-relaxed font-bold text-xl italic">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ 収益シミュレーション */}
      <section className="py-40 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-6xl lg:text-[8rem] font-black italic tracking-tighter leading-none mb-10">CASH FLOW</h2>
            <p className="text-2xl text-slate-500 font-black italic uppercase tracking-[0.2em]">広告費を利益に変える。これが新常識。</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            <RevenueCard label="飲食店：ランチ客を資産化" target="100名紹介登録" price="¥14,400" colorClass="bg-orange-600" />
            <RevenueCard label="サロン：顧客をコミュニティ化" target="50名紹介登録" price="¥7,200" colorClass="bg-indigo-600" />
          </div>

          <div className="bg-slate-900 text-white p-20 rounded-[5rem] text-center shadow-3xl border-[15px] border-orange-600 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-3xl lg:text-5xl font-black mb-10 italic tracking-tighter">圧倒的還元率：アプリ有料ユーザーの</p>
              <div className="flex items-center justify-center gap-4 mb-10">
                <span className="text-orange-500 text-[8rem] lg:text-[15rem] font-black leading-none italic drop-shadow-2xl">30%</span>
                <span className="text-4xl lg:text-7xl font-black self-end mb-6">を毎月還元</span>
              </div>
              <p className="text-2xl text-slate-400 font-bold italic tracking-widest max-w-3xl mx-auto leading-relaxed">
                あなたが紹介したお客様が使い続ける限り、権利収入のように毎月報酬が発生。集客コストがゼロになるだけでなく、「収益の柱」になります。
              </p>
            </div>
            <div className="absolute top-0 right-0 opacity-10 font-black text-[20rem] italic -translate-y-20 translate-x-20">30%</div>
          </div>
        </div>
      </section>

      {/* ⑤ パートナー実績 */}
      <section className="py-32 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-2xl font-black mb-24 text-slate-400 italic tracking-[0.5em] uppercase">Trusted by Local Leaders</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-16 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {partners.map((p, i) => (
              <div key={i} className="relative h-20 w-full flex items-center justify-center transform hover:scale-110">
                <Image src={p.path} alt={p.name} fill style={{ objectFit: 'contain' }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑥ 申し込みフォーム */}
      <section ref={formRef} id="signup" className="py-40 px-6 bg-slate-900 text-white relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-white text-slate-900 rounded-[5rem] shadow-[0_60px_120px_rgba(0,0,0,0.6)] overflow-hidden border-[15px] border-orange-600 transform hover:scale-[1.01] transition-transform">
            <div className="bg-orange-600 p-20 text-center text-white relative">
              <h3 className="text-5xl lg:text-7xl font-black mb-8 italic tracking-tighter uppercase">Join the Program</h3>
              <div className="space-y-6 font-black">
                <p className="text-3xl line-through opacity-70 italic">通常価格 月額 4,400円</p>
                <div className="bg-white text-orange-600 inline-block px-16 py-5 rounded-full text-4xl animate-pulse italic shadow-2xl">
                  先行100社限定：残38社
                </div>
                <p className="text-6xl pt-10 uppercase tracking-[0.1em] font-black italic">
                  月額 ¥3,850 <span className="text-2xl">(税込)</span>
                </p>
              </div>
            </div>

            <div className="p-10 md:p-24">
              <form onSubmit={handleSignup} className="space-y-12">
                <div className="space-y-3">
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-6">店舗・企業名 *</label>
                  <input type="text" name="org" autoComplete="organization" placeholder="株式会社〇〇 / カフェ〇〇" required className="w-full p-8 bg-slate-50 border-3 border-slate-100 rounded-[2.5rem] outline-none focus:border-orange-500 text-2xl font-bold transition-all placeholder:text-slate-200" value={formData.storeName} onChange={e => setFormData({ ...formData, storeName: e.target.value })} />
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-6">ご担当者名 *</label>
                    <input type="text" name="name" autoComplete="name" placeholder="山田 太郎" required className="w-full p-8 bg-slate-50 border-3 border-slate-100 rounded-[2.5rem] outline-none focus:border-orange-500 text-2xl font-bold transition-all" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-6">所在地（那須エリア優先） *</label>
                    <input type="text" name="address" autoComplete="street-address" placeholder="那須塩原市〇〇町 1-2" required className="w-full p-8 bg-slate-50 border-3 border-slate-100 rounded-[2.5rem] outline-none focus:border-orange-500 text-2xl font-bold transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-6">メールアドレス *</label>
                    <input type="email" name="email" autoComplete="email" placeholder="mail@example.com" required className="w-full p-8 bg-slate-50 border-3 border-slate-100 rounded-[2.5rem] outline-none focus:border-orange-500 text-2xl font-bold transition-all" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-6">メールアドレス（確認） *</label>
                    <input type="email" name="email_confirm" autoComplete="off" placeholder="再入力してください" required className="w-full p-8 bg-slate-50 border-3 border-slate-100 rounded-[2.5rem] outline-none focus:border-orange-500 text-2xl font-bold transition-all" value={formData.confirmEmail} onChange={e => setFormData({ ...formData, confirmEmail: e.target.value })} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-6">電話番号 *</label>
                    <input type="tel" name="tel" autoComplete="tel" placeholder="0287-XX-XXXX" required className="w-full p-8 bg-slate-50 border-3 border-slate-100 rounded-[2.5rem] outline-none focus:border-orange-500 text-2xl font-bold transition-all" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black text-slate-400 uppercase tracking-widest ml-6">管理画面用パスワード *</label>
                    <input type="password" name="password" autoComplete="new-password" placeholder="8文字以上推奨" required minLength={8} className="w-full p-8 bg-slate-50 border-3 border-slate-100 rounded-[2.5rem] outline-none focus:border-orange-500 text-2xl font-bold transition-all" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                </div>

                <div className="p-12 bg-orange-50 rounded-[4rem] border-4 border-orange-100 shadow-inner">
                  <p className="text-slate-700 mb-8 italic leading-relaxed text-xl font-bold">
                    ※登録完了後、決済プラン選択ページへ遷移します。クレジットカード（Stripe）または請求書払いでご利用いただけます。
                  </p>
                  <label className="flex items-center space-x-6 cursor-pointer group">
                    <input type="checkbox" className="w-12 h-12 text-orange-600 rounded-2xl border-orange-200 focus:ring-orange-500 cursor-pointer" checked={formData.agree} onChange={e => setFormData({ ...formData, agree: e.target.checked })} />
                    <span className="text-2xl font-black text-slate-800 underline underline-offset-8 decoration-4 group-hover:text-orange-600 transition-colors" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>
                      利用規約および紹介報酬制度に同意する
                    </span>
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full py-16 bg-orange-600 hover:bg-orange-700 text-white text-4xl lg:text-6xl font-black rounded-[5rem] shadow-[0_30px_80px_rgba(234,88,12,0.5)] transition transform active:scale-95 italic tracking-tighter disabled:opacity-50 group overflow-hidden relative">
                  <span className="relative z-10">{loading ? '通信中...' : 'パートナー登録を完了する'}</span>
                  {!loading && <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>}
                </button>
              </form>
            </div>
          </div>
        </div>
        {/* 背景の文字装飾 */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden whitespace-nowrap opacity-[0.03] select-none pointer-events-none">
          <p className="text-[25rem] font-black italic tracking-tighter leading-none">NASU REGIONAL AI PLATFORM BY ADTOWN</p>
        </div>
      </section>

      {/* ⑪ 利用規約モーダル */}
      {showTerms && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 bg-slate-950/95 backdrop-blur-2xl">
          <div className="bg-white rounded-[4rem] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-3xl border-[10px] border-slate-100 overflow-hidden">
            <div className="p-12 border-b bg-slate-50 flex justify-between items-center">
              <h3 className="text-3xl lg:text-5xl font-black italic tracking-tighter">Agreement</h3>
              <button onClick={() => setShowTerms(false)} className="text-6xl text-slate-300 hover:text-slate-900 transition-colors">&times;</button>
            </div>
            <div className="p-16 overflow-y-auto space-y-12 text-slate-600 font-bold leading-relaxed text-xl">
              <section className="space-y-6">
                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-600 pl-6 uppercase">第1条（目的）</h4>
                <p>本契約は、株式会社adtown（以下「当社」）が提供する「みんなのNasuアプリ」を通じて、パートナーの広告掲載、集客支援、および相互の利益拡大を図ることを目的とします。</p>
              </section>
              <section className="space-y-6">
                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-600 pl-6 uppercase">第2条（紹介報酬の支払い）</h4>
                <p>パートナーは、貴店に割り振られた専用コード/QRを用いてユーザーを本アプリの有料プランへ誘導した際、その継続売上（税抜金額）の30%を報酬として受領する権利を得ます。報酬は月末締め翌月15日に指定口座に支払われます。</p>
              </section>
              <section className="space-y-6 bg-orange-50 p-10 rounded-3xl border-2 border-orange-100">
                <h4 className="text-orange-600 font-black text-2xl border-l-8 border-orange-600 pl-6 uppercase italic">重要：契約の解除</h4>
                <p>本契約は1ヶ月単位の自動更新となります。パートナーは管理画面よりいつでも解約手続きを行うことができます。日割り計算による返金は行われません。</p>
              </section>
              <section className="space-y-6">
                <h4 className="text-slate-900 font-black text-2xl border-l-8 border-orange-600 pl-6 uppercase">第4条（禁止事項）</h4>
                <p>不適切なコンテンツの投稿、公序良俗に反する行為、虚偽の数値を用いた勧誘、およびシステムへの不正アクセスを固く禁じます。</p>
              </section>
            </div>
            <div className="p-12 border-t bg-slate-50 text-center">
              <button onClick={() => setShowTerms(false)} className="bg-slate-900 text-white px-20 py-6 rounded-full font-black text-3xl hover:bg-orange-600 transition-all shadow-xl italic tracking-tighter">規約に同意して戻る</button>
            </div>
          </div>
        </div>
      )}

      {/* ⑫ フッター */}
      <footer className="bg-slate-950 py-40 px-6 text-center text-slate-500 font-bold border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-center items-center gap-16 text-slate-400 text-xl italic uppercase tracking-widest">
            <Link href="/company" className="hover:text-white transition-colors">Company</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">SCTL (特商法)</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
          </div>

          <div className="space-y-8">
            <p className="text-sm tracking-[0.8em] uppercase opacity-40 italic font-black">Empowering Local Economy with AI Agent Technology</p>
            <h2 className="text-4xl lg:text-6xl font-black text-white italic tracking-tighter">
              EVERYONE'S <span className="text-orange-600 underline decoration-white">NASU</span> APP
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-sm opacity-30 leading-loose italic font-medium">
              本プロジェクトは株式会社adtownの創業20周年記念事業として運営されています。那須エリアの持続可能な発展を目指し、AIと地域住民が共生する新しいマーケティングエコシステムを構築します。
            </p>
            <p className="text-sm tracking-[0.3em] opacity-40 pt-10">© 2026 ADTOWN CO., LTD. ALL RIGHTS RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
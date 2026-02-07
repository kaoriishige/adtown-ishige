import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { db, auth, storage } from '../../lib/firebase';
import {
    doc, getDoc, setDoc, serverTimestamp, arrayUnion
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

declare const __app_id: string;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const categoryData = {
    "飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋", "その他"],
    "買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店", "その他"],
    "美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院", "その他"],
    "住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋", "その他"],
    "教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室", "その他"],
    "車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ", "その他"],
    "観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘", "その他"],
    "ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン", "その他"],
    "専門サービス関連": ["弁護士・税理士・行政書士など士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング", "その他"],
    "その他": ["その他"],
};
const mainCategories = Object.keys(categoryData);

const descriptionPlaceholders: { [key: string]: string } = {
    '飲食関連': '【お店のこだわり】\n例：地元那須の新鮮な野菜をたっぷり使ったイタリアンです。\n\n【おすすめメニュー】\n例：とちぎ和牛のグリル、季節野菜のバーニャカウダ\n\n【席数】\n例：30席（カウンター10席、テーブル20席）\n\n【個室】\n例：あり（4名様用×2室）\n\n【禁煙・喫煙】\n例：全席禁煙\n\n【駐車場】\n例：あり（10台）\n\n【営業時間】\n例：\n[月～金]\n11:00～15:00 (L.O. 14:30)\n17:00～22:00 (L.O. 21:30)\n\n【定休日】\n例：毎週水曜日、第2火曜日',
    '美容室・理容室': '【得意なスタイル】\n例：ショートカット、透明感のあるカラーリングが得意です。\n\n【お店の雰囲気】\n例：白を基調とした落ち着いた空間で、リラックスした時間をお過ごしいただけます。\n\n【席数】\n例：4席\n\n【駐車場】\n例：あり（店舗前に2台）\n\n【営業時間】\n例：平日 10:00～20:00\n\n【定休日】\n例：毎週火曜日',
    '整体・整骨院・鍼灸院': '【こんな症状お任せください】\n例：長年の肩こりや腰痛、産後の骨盤矯正など、根本改善を目指します。\n\n【施術の特徴】\n例：一人ひとりの身体の状態に合わせたオーダーメイドの施術を行います。\n\n【設備】\n例：個室あり、着替え貸出あり\n\n【予約】\n例：完全予約制\n\n【営業時間】\n例：9:00～12:00 / 14:00～20:00\n\n【定休日】\n例：日曜日・祝日',
    'デフォルト': '【お店・会社の特徴】\n例：地域に根ざして50年。お客様一人ひとりに寄り添ったサービスを心がけています。\n\n【主なサービス内容】\n例：・〇〇の販売\n\n【駐車場】\n例：あり（10台）\n\n【営業時間】\n例：9:00～18:00\n\n【定休日】\n例：土日祝',
};

const EditStorePage = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [storeName, setStoreName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [mainCategory, setMainCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [otherMainCategory, setOtherMainCategory] = useState('');
    const [otherSubCategory, setOtherSubCategory] = useState('');
    const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');
    const [snsUrls, setSnsUrls] = useState(['', '', '']);
    const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
    const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const descriptionPlaceholder = useMemo(() => {
        if (mainCategory.includes('美容') || mainCategory.includes('健康')) return descriptionPlaceholders['美容室・理容室'];
        if (subCategory.includes('整体') || subCategory.includes('整骨院')) return descriptionPlaceholders['整体・整骨院・鍼灸院'];
        if (mainCategory === '飲食関連') return descriptionPlaceholders['飲食関連'];
        return descriptionPlaceholders['デフォルト'];
    }, [mainCategory, subCategory]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) setUser(currentUser);
            else router.push('/partner/login');
        });
        return () => unsubscribe();
    }, [router]);

    const fetchStoreProfile = useCallback(async (currentUser: User) => {
        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setStoreName(data.storeName || data.companyName || '');
                setAddress(data.address || '');
                setPhoneNumber(data.phoneNumber || '');
                setMainCategory(data.mainCategory || '');
                setSubCategory(data.subCategory || '');
                setOtherMainCategory(data.otherMainCategory || '');
                setOtherSubCategory(data.otherSubCategory || '');
                setDescription(data.description || data.companyDescription || '');
                setWebsiteUrl(data.websiteUrl || data.website || '');
                setSnsUrls(data.snsUrls && data.snsUrls.length > 0 ? [...data.snsUrls, '', ''].slice(0, 3) : ['', '', '']);
                setMainImageUrl(data.mainImageUrl || null);
                setGalleryImageUrls(data.galleryImageUrls || []);
            }
        } catch (err: any) {
            setError("プロフィールの読み込みに失敗しました。");
        }
        setLoading(false);
    }, []);

    useEffect(() => { if (user) fetchStoreProfile(user); }, [user, fetchStoreProfile]);

    useEffect(() => {
        if (mainCategory && categoryData[mainCategory as keyof typeof categoryData]) {
            setSubCategoryOptions(categoryData[mainCategory as keyof typeof categoryData]);
        } else {
            setSubCategoryOptions([]);
        }
    }, [mainCategory]);

    const handleDeleteImage = async (imageUrlToDelete: string, imageType: 'main' | 'gallery') => {
        if (!user) return;
        if (!window.confirm("この写真を削除しますか？")) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/partner/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId: user.uid, imageUrl: imageUrlToDelete, imageType, appId }),
            });
            if (!response.ok) throw new Error("削除に失敗しました。");
            if (imageType === 'main') setMainImageUrl(null);
            else setGalleryImageUrls(prev => prev.filter(url => url !== imageUrlToDelete));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        setError(null);

        try {
            const userDocRef = doc(db, 'users', user.uid);
            let currentMainImageUrl = mainImageUrl;

            // 画像アップロード (Storageバケットエラー対策として動的な構成)
            if (mainImageFile) {
                const fileRef = ref(storage, `users/${user.uid}/stores/main/${uuidv4()}`);
                await uploadBytes(fileRef, mainImageFile);
                currentMainImageUrl = await getDownloadURL(fileRef);
            }

            const galleryUploads = [];
            if (galleryImageFiles.length > 0) {
                for (const file of galleryImageFiles) {
                    const fileRef = ref(storage, `users/${user.uid}/stores/gallery/${uuidv4()}`);
                    await uploadBytes(fileRef, file);
                    const url = await getDownloadURL(fileRef);
                    galleryUploads.push(url);
                }
            }

            const updateData = {
                storeName,
                companyName: storeName,
                address,
                phoneNumber,
                mainCategory,
                subCategory,
                otherMainCategory: mainCategory === 'その他' ? otherMainCategory : '',
                otherSubCategory: subCategory === 'その他' ? otherSubCategory : '',
                description,
                companyDescription: description,
                websiteUrl,
                website: websiteUrl,
                snsUrls: snsUrls.filter(u => u.trim() !== ''),
                mainImageUrl: currentMainImageUrl,
                galleryImageUrls: galleryUploads.length > 0 ? arrayUnion(...galleryUploads) : galleryImageUrls,
                updatedAt: serverTimestamp(),
            };

            await setDoc(userDocRef, updateData, { merge: true });
            alert('店舗情報を更新しました。');
            router.reload();
        } catch (err: any) {
            setError(`保存に失敗しました: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">読み込み中...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">店舗プロフィールの編集</h1>
            {error && <div className="bg-red-100 p-4 text-red-700 rounded-lg mb-6">{error}</div>}

            <div className="space-y-8 bg-white p-6 shadow-xl rounded-2xl">
                {/* 店舗名 */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2">基本情報</h2>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">店舗名・会社名 *</label>
                        <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full p-3 border rounded-lg mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">住所 *</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-3 border rounded-lg mt-1" />
                        {address && (
                            <div className="mt-2 h-48 rounded-lg overflow-hidden">
                                <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" src={`https://maps.google.co.jp/maps?output=embed&q=${encodeURIComponent(address)}`}></iframe>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">電話番号 *</label>
                        <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full p-3 border rounded-lg mt-1" />
                    </div>
                </section>

                {/* カテゴリ */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2">カテゴリ設定</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">カテゴリ（大分類）*</label>
                            <select value={mainCategory} onChange={e => setMainCategory(e.target.value)} className="w-full p-3 border rounded-lg mt-1 bg-white">
                                <option value="">選択してください</option>
                                {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            {mainCategory === 'その他' && (
                                <input type="text" placeholder="カテゴリ名を入力" value={otherMainCategory} onChange={e => setOtherMainCategory(e.target.value)} className="w-full p-2 border rounded mt-2" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">カテゴリ（小分類）</label>
                            <select value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!mainCategory} className="w-full p-3 border rounded-lg mt-1 bg-white disabled:bg-gray-50">
                                <option value="">選択してください</option>
                                {subCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                            {subCategory === 'その他' && (
                                <input type="text" placeholder="詳細カテゴリ名を入力" value={otherSubCategory} onChange={e => setOtherSubCategory(e.target.value)} className="w-full p-2 border rounded mt-2" />
                            )}
                        </div>
                    </div>
                </section>

                {/* 紹介文 */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700">店舗紹介・営業時間</label>
                        <button type="button" onClick={() => setDescription(descriptionPlaceholder)} className="text-xs bg-blue-500 text-white py-1 px-3 rounded-full shadow-sm">テンプレート適用</button>
                    </div>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 border rounded-lg h-48 text-sm" />
                </section>

                {/* URL */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold border-b pb-2">ウェブサイト・SNS</h2>
                    <input type="url" placeholder="公式サイト URL" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full p-3 border rounded-lg" />
                    {snsUrls.map((url, i) => (
                        <input key={i} type="url" placeholder={`SNS URL ${i + 1}`} value={url} onChange={e => {
                            const newSns = [...snsUrls];
                            newSns[i] = e.target.value;
                            setSnsUrls(newSns);
                        }} className="w-full p-3 border rounded-lg" />
                    ))}
                </section>

                {/* 画像 */}
                <section className="space-y-6">
                    <h2 className="text-lg font-bold border-b pb-2">画像管理</h2>
                    <div>
                        <label className="block text-sm font-bold mb-2">トップ画像</label>
                        <div className="flex items-center gap-4">
                            {(mainImageUrl || mainImageFile) ? (
                                <div className="relative w-32 h-32">
                                    <img src={mainImageFile ? URL.createObjectURL(mainImageFile) : mainImageUrl!} className="w-full h-full object-cover rounded-xl shadow-md" />
                                    <button onClick={() => mainImageFile ? setMainImageFile(null) : handleDeleteImage(mainImageUrl!, 'main')} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 shadow">✕</button>
                                </div>
                            ) : (
                                <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed">No Image</div>
                            )}
                            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && setMainImageFile(e.target.files[0])} className="text-xs" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2">ギャラリー写真</label>
                        <div className="flex flex-wrap gap-3 mb-4">
                            {galleryImageUrls.map((url, i) => (
                                <div key={i} className="relative w-24 h-24">
                                    <img src={url} className="w-full h-full object-cover rounded-lg shadow-sm" />
                                    <button onClick={() => handleDeleteImage(url, 'gallery')} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs shadow">✕</button>
                                </div>
                            ))}
                        </div>
                        <input type="file" multiple accept="image/*" onChange={e => e.target.files && setGalleryImageFiles(prev => [...prev, ...Array.from(e.target.files!)])} className="text-xs" />
                    </div>
                </section>

                <div className="pt-8">
                    <button onClick={handleSaveProfile} disabled={isSaving} className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-green-700 transition-all disabled:bg-gray-400">
                        {isSaving ? '保存処理中...' : '店舗情報を保存して反映する'}
                    </button>
                </div>
            </div>

            <div className="mt-8 text-center pb-20">
                <Link href="/partner/dashboard" className="text-gray-500 hover:underline">← ダッシュボードへ戻る</Link>
            </div>
        </div>
    );
};

export default EditStorePage;
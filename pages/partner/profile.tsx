import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; 
import { db, auth, storage } from '../../lib/firebase'; 
import {
collection, query, getDocs, doc, updateDoc, addDoc, serverTimestamp, arrayUnion, DocumentData
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

// グローバル変数の型を宣言
declare const __app_id: string;

// グローバル変数からアプリIDを取得
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// カテゴリデータ
const categoryData = {
"飲食関連": ["レストラン・食堂", "カフェ・喫茶店", "居酒屋・バー", "パン屋（ベーカリー）", "和菓子・洋菓子店", "ラーメン店", "そば・うどん店", "寿司屋", "その他"],
"買い物関連": ["農産物直売所・青果店", "精肉店・鮮魚店", "個人経営の食料品店", "酒店", "ブティック・衣料品店", "雑貨店・民芸品店", "書店", "花屋", "お土産店", "その他"],
"美容・健康関連": ["美容室・理容室", "ネイルサロン", "エステサロン", "リラクゼーション・マッサージ", "整体・整骨院・鍼灸院", "個人経営の薬局", "クリニック・歯科医院", "その他"],
"住まい・暮らし関連": ["工務店・建築・リフォーム", "水道・電気工事", "不動産会社", "クリーニング店", "造園・植木屋", "便利屋", "その他"],
"教育・習い事関連": ["学習塾・家庭教師", "ピアノ・音楽教室", "英会話教室", "書道・そろばん教室", "スポーツクラブ・道場", "パソコン教室", "料理教室", "その他"],
"スポーツ関連": ["スポーツ施設・ジム", "ゴルフ練習場", "フィットネス・ヨガ", "スポーツ用品店", "武道・格闘技道場", "その他"], // ★追加済み
"車・バイク関連": ["自動車販売店・自動車整備・修理工場", "ガソリンスタンド", "バイクショップ", "その他"],
"観光・レジャー関連": ["ホテル・旅館・ペンション", "日帰り温泉施設", "観光施設・美術館・博物館", "体験工房（陶芸・ガラスなど）", "牧場・農園", "キャンプ場・グランピング施設", "ゴルフ場", "貸し別荘", "その他"],
"ペット関連": ["動物病院", "トリミングサロン", "ペットホテル・ドッグラン", "その他"],
"専門サービス関連": ["弁護士・税理士・行政書士などの士業", "デザイン・印刷会社", "写真館", "保険代理店", "カウンセリング", "コンサルティング", "その他"],
"その他": ["その他"],
};
const mainCategories = Object.keys(categoryData);

// *******************************************************
// 小分類ごとのAIターゲット候補リスト
// *******************************************************
const SUB_CATEGORY_TARGETS: Record<string, string[]> = {
// 飲食
"レストラン・食堂": ['家族連れ（ディナー）', 'カップル・デート層', 'ランチ利用のビジネス層', 'グルメ志向の層', '新しい店を試したい層', 'その他'], 
"カフェ・喫茶店": ['静かな作業場所を求める層', '読書好きの層', 'インスタ映えを重視する若年層', '午後の休憩需要', 'リピーター候補', 'その他'], 
"居酒屋・バー": ['夜の宴会需要', '仕事帰りのサラリーマン', '若年層のグループ利用', '常連客化しやすい層', 'その他'], 
"パン屋（ベーカリー）": ['朝食・ランチのテイクアウト層', 'パン好きの主婦層', '健康志向の層', '地域住民の日常利用', 'その他'], 
"和菓子・洋菓子店": ['ギフト需要のある層', '特別な日のお祝い需要', 'スイーツ好きの層', 'その他'], 
"ラーメン店": ['仕事終わりの男性客', '家族連れ', '新しい店を試したいグルメ層', 'クーポン反応が良い層', 'その他'], 
"そば・うどん店": ['シニア層（落ち着いた雰囲気を好む）', '昼食のビジネス層', '健康志向の層', 'その他'], 
"寿司屋": ['グルメ志向の層', '観光客', '特別な日のお祝い需要', 'その他'], 
// 買い物
"農産物直売所・青果店": ['地元産品を求める層', '健康・オーガニック志向の層', '料理好きの主婦層', '地域貢献に意欲的な層', 'その他'], 
"精肉店・鮮魚店": ['高品質を求める層', 'BBQなどイベント需要', '料理好きの層', 'その他'], 
"個人経営の食料品店": ['常連客化しやすいリピーター層', '特定の希少品を求める層', 'その他'], 
"酒店": ['ギフト需要のある層', 'お酒の趣味を楽しむ層', 'その他'], 
"ブティック・衣料品店": ['ファッション感度の高い若年層', '高品質を求める層', '流行を追う層', 'その他'], 
"雑貨店・民芸品店": ['ギフト需要のある中年層', 'ハンドメイド好きの層', '観光客', 'その他'], 
"書店": ['本好き（読書家）', '専門書を探す層', 'その他'], 
"花屋": ['ギフト需要のある層', 'イベント需要がある層', 'その他'], 
"お土産店": ['観光客', '出張のビジネス層', 'その他'], 
// 美容・健康
"美容室・理容室": ['ヘアカット・カラー重視の20〜40代', 'リラクゼーション・癒しを求める層', 'メンズカットを求める層', '定期利用の層', 'その他'], 
"ネイルサロン": ['若年の美容投資層', 'オフィス向けシンプルなネイルを求める層', '特別な日の準備をする層', 'その他'], 
"エステサロン": ['セルフケア関心のある層', '美容に投資する富裕志向の層', 'その他'], 
"リラクゼーション・マッサージ": ['疲労回復を求める層', 'ストレス解消を求める層', 'その他'], 
"整体・整骨院・鍼灸院": ['慢性的な腰痛・肩こりを持つ層', '産後ケアを求める主婦層', '健康志向の中高年', 'その他'], 
"個人経営の薬局": ['地域の住民（日常利用）', '健康相談を求める層', 'その他'], 
"クリニック・歯科医院": ['定期的な検診を重視する層', '専門的な治療を求める層', 'その他'], 
// 住まい・暮らし関連
"工務店・建築・リフォーム": ['新築・リフォーム検討中の世帯', '高品質を求める富裕層', '地域で長く暮らしたい層', 'その他'], 
"水道・電気工事": ['緊急対応を求める層', '定期メンテナンス需要の層', 'その他'], 
"不動産会社": ['長く住み続けたいファミリー層', '移住・定住を検討中の層', '賃貸・売買を検討する層', 'その他'], 
"クリーニング店": ['定期メンテナンス需要の層', '高品質を求める層', 'その他'], 
"造園・植木屋": ['庭の手入れに関心のある層', 'エクステリアの相談をしたい層', 'その他'], 
"便利屋": ['即時対応重視の層', '高齢者世帯', '単身者', 'その他'], 
// 教育・習い事関連
"学習塾・家庭教師": ['受験対策を求める保護者層', '成績向上に熱心な親', 'その他'], 
"ピアノ・音楽教室": ['子どもの情操教育に関心のある層', '大人の趣味・教養を求める層', 'その他'], 
"英会話教室": ['留学・国際交流に関心のある層', 'ビジネススキル向上を目指す層', 'その他'], 
"書道・そろばん教室": ['伝統文化を重視する親', '計算能力向上を目指す親', 'その他'], 
"スポーツクラブ・道場": ['健康維持を目的とする層', '専門的な指導を求める層', 'その他'], 
"パソコン教室": ['ビジネススキル向上を目指す層', 'シニア層のデジタル化サポート', 'その他'], 
"料理教室": ['体験重視で来店するファミリー層', '食への関心が高い層', 'その他'], 
// スポーツ関連のターゲット
"スポーツ施設・ジム": ['健康維持・ダイエット目的の層', '筋力向上を目指す若年層', 'スポーツコミュニティを求める層', 'その他'],
"ゴルフ練習場": ['ゴルフ初心者層', 'スキルアップを目指す層', '仕事帰りのリフレッシュ需要', 'その他'],
"フィットネス・ヨガ": ['健康志向の女性層', 'ストレス解消を求める層', 'シニア層の体力維持', 'その他'],
"スポーツ用品店": ['特定のスポーツ愛好家', '高品質なギアを求める層', 'その他'],
"武道・格闘技道場": ['護身術・精神修養に関心のある層', '子どもに習い事をさせたい親', 'その他'],
// 車・バイク関連
"自動車販売店・自動車整備・修理工場": ['車検・整備を定期的に行う層', '中古車購入を検討する層', '安全運転を重視する層', 'その他'], 
"ガソリンスタンド": ['通勤で車を使うビジネス層', '地域住民の給油需要', 'その他'], 
"バイクショップ": ['バイク趣味の若年層', 'ツーリング関心層', 'その他'], 
// 観光・レジャー関連
"ホテル・旅館・ペンション": ['宿泊を伴う旅行者（ファミリー/カップル）', '温泉・癒やし目的のシニア層', '特別な日の利用', 'その他'], 
"日帰り温泉施設": ['温泉・癒やし目的のシニア層', '地域のレジャー需要', 'その他'], 
"観光施設・美術館・博物館": ['文化・歴史に関心のある層', '家族・カップルの観光需要', 'その他'], 
"体験工房（陶芸・ガラスなど）": ['体験型アクティビティ志向の層', '手作りのギフトを求める層', 'その他'], 
"牧場・農園": ['家族・カップルのレジャー需要', '食育に関心のある層', 'その他'], 
"キャンプ場・グランピング施設": ['アウトドア・キャンプ好きの層', '非日常体験を求める若年層', 'その他'], 
"ゴルフ場": ['ゴルフ・スポーツ需要の富裕層', '接待需要', 'その他'], 
"貸し別荘": ['グループ旅行・長期滞在を好む層', 'プライベートな空間を求める層', 'その他'], 
// ペット関連
"動物病院": ['ペットの健康志向の家族', '専門的な治療を求める層', '予防接種需要', 'その他'], 
"トリミングサロン": ['トリミング定期利用の層', '犬種ごとのケアを求める層', 'その他'], 
"ペットホテル・ドッグラン": ['ペット同伴のアウトドア好き', '旅行中のペット預かり需要', 'その他'], 
// 専門サービス関連
"弁護士・税理士・行政書士などの士業": ['法人・事業主向けの意思決定者', '個人で専門相談を求める層', 'その他'], 
"デザイン・印刷会社": ['写真やデザインを外注したい個人/事業者', 'ブランド構築に関心のある層', 'その他'], 
"写真館": ['家族の記念撮影需要', '証明写真・ビジネスポートレート需要', 'その他'], 
"保険代理店": ['個人で専門相談を求める層', '法人向けの保険検討層', 'その他'], 
"カウンセリング": ['メンタルヘルスに関心のある層', 'キャリア相談を求める層', 'その他'], 
"コンサルティング": ['事業拡大を目指す事業主', '経営改善を求める層', 'その他'], 
// その他カテゴリの一般的な候補
"その他": ['地域貢献に意欲的な層', '購買意欲の高い層', 'リピーター候補', 'クーポン反応が良い層', 'SNSでの拡散が期待できる層', 'その他'], 
};


// 店舗紹介文のテンプレート
const descriptionPlaceholders: { [key: string]: string } = {
// 駐車場情報を追加
'飲食関連': '【お店のこだわり】\n例：地元那須の新鮮な野菜をたっぷり使ったイタリアンです。\n\n【おすすめメニュー】\n例：とちぎ和牛のグリル、季節野菜のバーニャカウダ\n\n【席数】\n例：30席（カウンター10席、テーブル20席）\n\n【個室】\n例：あり（4名様用×2室）\n\n【禁煙・喫煙】\n例：全席禁煙\n\n【駐車場】\n例：あり（10台）\n\n【営業時間】\n例：\n[月～金]\n11:00～15:00 (L.O. 14:30)\n17:00～22:00 (L.O. 21:30)\n[土・日・祝]\n11:00～22:00 (L.O. 21:30)\n\n【定休日】\n例：毎週水曜日、第2火曜日',
'美容室・理容室': '【得意なスタイル】\n例：ショートカット、透明感のあるカラーリングが得意です。\n\n【お店の雰囲気】\n例：白を基調とした落ち着いた空間で、リラックスした時間をお過ごしいただけます。\n\n【席数】\n例：4席\n\n【駐車場】\n例：あり（店舗前に2台）\n\n【営業時間】\n例：\n平日 10:00～20:00\n土日祝 9:00～19:00\n\n【定休日】\n例：毎週火曜日',
'整体・整骨院・鍼灸院': '【こんな症状はお任せください】\n例：長年の肩こりや腰痛、産後の骨盤矯正など、根本改善を目指します。\n\n【施術の特徴】\n例：一人ひとりの身体の状態に合わせたオーダーメイドの施術を行います。\n\n【設備】\n例：個室あり、着替え貸出あり\n\n【駐車場】\n例：あり（10台）\n\n【予約】\n例：完全予約制\n\n【営業時間】\n例：\n9:00～12:00 / 14:00～20:00\n\n【定休日】\n例：日曜日・祝日', 
'デフォルト': '【お店・会社の特徴】\n例：地域に根ざして50年。お客様一人ひとりに寄り添ったサービスを心がけています。\n\n【主なサービス内容】\n例：\n・〇〇の販売\n・〇〇の修理・メンテナンス\n\n【駐車場】\n例：あり（10台）\n\n【営業時間】\n例：\n9:00～18:00\n\n【定休日】\n例：土日祝',
};

// AIマッチング用の正規化キーを生成するヘルパー関数
const getNormalizedIndustryKey = (main: string, sub: string): string => {
const checkCategory = sub && sub !== 'その他' ? sub : main;
// 飲食
if (checkCategory.includes('カフェ') || checkCategory.includes('喫茶店') || checkCategory.includes('パン屋')) return 'cafe';
if (checkCategory.includes('レストラン') || checkCategory.includes('食堂') || checkCategory.includes('居酒屋') || checkCategory.includes('ラーメン') || checkCategory.includes('寿司')) return 'restaurant';
// 美容・健康
if (checkCategory.includes('美容室') || checkCategory.includes('理容室')) return 'beauty';
if (checkCategory.includes('整体') || checkCategory.includes('整骨院') || checkCategory.includes('鍼灸院')) return 'health';
// 観光・宿泊
if (checkCategory.includes('ホテル') || checkCategory.includes('旅館') || checkCategory.includes('貸し別荘')) return 'lodging'; 
// スポーツ
if (main === 'スポーツ関連' || checkCategory.includes('スポーツ') || checkCategory.includes('ジム') || checkCategory.includes('ゴルフ') || checkCategory.includes('フィットネス') || checkCategory.includes('道場')) return 'sports';
// その他
if (checkCategory.includes('動物病院') || checkCategory.includes('ペット')) return 'pet_related'; 
return 'general'; 
};

// 業種固有のデータ型定義 (簡略化)
interface IndustrySpecificData {
seats?: string; // 飲食
privateRooms?: string; // 飲食
smoking?: 'yes' | 'no' | 'partial' | ''; // 飲食
specialtyCut?: string; // 美容
}

const StoreProfilePage = () => {
const router = useRouter();
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false); // isSaving は JSX で使用されているため維持
const [storeId, setStoreId] = useState<string | null>(null);
const [storeName, setStoreName] = useState('');
const [address, setAddress] = useState('');
const [phoneNumber, setPhoneNumber] = useState('');
const [mainCategory, setMainCategory] = useState('');
const [subCategory, setSubCategory] = useState('');
const [otherMainCategory, setOtherMainCategory] = useState('');
const [otherSubCategory, setOtherSubCategory] = useState('');
const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>([]);
const [description, setDescription] = useState('');
const [targetUserInterests, setTargetUserInterests] = useState(''); 
const [specialtyPoints, setSpecialtyPoints] = useState<string[]>(['', '', '']);
// LINE情報ステート
const [lineOfficialId, setLineOfficialId] = useState(''); 
const [lineLiffUrl, setLineLiffUrl] = useState(''); 
const [websiteUrl, setWebsiteUrl] = useState('');
const [snsUrls, setSnsUrls] = useState(['', '', '']);
const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
const [mainImageFile, setMainImageFile] = useState<File | null>(null);
const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);
const [error, setError] = useState<string | null>(null);

// 業種固有のカスタムデータ
const [industryData, setIndustryData] = useState<IndustrySpecificData>({});

// 選択されたターゲット候補リストを保持
const [aiTargetOptions, setAiTargetOptions] = useState<string[]>([]);
// ユーザーが選択したAIターゲットを保持
const [selectedAiTargets, setSelectedAiTargets] = useState<string[]>([]);
// カスタム入力されたターゲット層
const [customAiTarget, setCustomAiTarget] = useState('');


const descriptionPlaceholder = useMemo(() => {
if (mainCategory.includes('美容') || mainCategory.includes('健康')) return descriptionPlaceholders['美容室・理容室'];
if (subCategory.includes('整体') || subCategory.includes('整骨院')) return descriptionPlaceholders['整体・整骨院・鍼灸院'];
if (mainCategory === '飲食関連') return descriptionPlaceholders['飲食関連'];
return descriptionPlaceholders['デフォルト'];
}, [mainCategory, subCategory]);


useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
if (currentUser) {
setUser(currentUser);
} else {
router.push('/partner/login');
}
});
return () => unsubscribe();
}, [router]);

const fetchStoreProfile = useCallback(async (currentUser: User) => {
if (!currentUser) return;
setLoading(true);
try {
const storesRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'stores');
const q = query(storesRef);
const querySnapshot = await getDocs(q);

if (!querySnapshot.empty) {
const storeDoc = querySnapshot.docs[0];
const storeData: DocumentData = storeDoc.data();
setStoreId(storeDoc.id);
setStoreName(storeData.storeName || '');
setAddress(storeData.address || '');
setPhoneNumber(storeData.phoneNumber || '');
setMainCategory(storeData.mainCategory || '');
setSubCategory(storeData.subCategory || '');
setOtherMainCategory(storeData.otherMainCategory || '');
setOtherSubCategory(storeData.otherSubCategory || '');
setDescription(storeData.description || '');
setTargetUserInterests(storeData.targetUserInterests || ''); 
setSpecialtyPoints(storeData.specialtyPoints || ['', '', '']);
// LINE情報ロード
setLineOfficialId(storeData.lineOfficialId || ''); 
setLineLiffUrl(storeData.lineLiffUrl || ''); 
setWebsiteUrl(storeData.websiteUrl || '');
setSnsUrls(storeData.snsUrls || ['', '', '']);
setMainImageUrl(storeData.mainImageUrl || null);
setGalleryImageUrls(storeData.galleryImageUrls || []);
// 業種固有データを読み込み
setIndustryData({
seats: storeData.seats || '',
privateRooms: storeData.privateRooms || '',
smoking: storeData.smoking || '',
specialtyCut: storeData.specialtyCut || '',
});
// AIターゲットオプションと選択されたターゲットをロード
setAiTargetOptions(storeData.aiTargetOptions || []);
setSelectedAiTargets(storeData.selectedAiTargets || []); 
setCustomAiTarget(storeData.customAiTarget || ''); // カスタムターゲットをロード

} else {
// 新規作成時、デフォルトのオプションをセット
setAiTargetOptions(SUB_CATEGORY_TARGETS['その他'] || []);
setSelectedAiTargets([]);
setCustomAiTarget('');
}
} catch (err: any) {
console.error("店舗情報の取得に失敗:", err);
let errorMessage = "店舗情報の読み込みに失敗しました。";
if (err.code === 'permission-denied') {
errorMessage += " Firebaseのセキュリティルールを確認してください。";
}
setError(errorMessage);
}
setLoading(false);
}, []);

useEffect(() => {
if (user) {
fetchStoreProfile(user);
}
}, [user, fetchStoreProfile]);

// メイン/サブカテゴリ変更時の処理
useEffect(() => {
if (mainCategory && categoryData[mainCategory as keyof typeof categoryData]) {
setSubCategoryOptions(categoryData[mainCategory as keyof typeof categoryData]);
} else {
setSubCategoryOptions([]);
}
// メインカテゴリ変更時にサブカテゴリをリセット
setSubCategory(''); 
}, [mainCategory]);

// サブカテゴリ変更時のターゲット層候補の自動更新
useEffect(() => {
const key = subCategory || 'その他';
// ターゲット候補データは SUB_CATEGORY_TARGETS から取得
const options = SUB_CATEGORY_TARGETS[key] || SUB_CATEGORY_TARGETS['その他'] || [];
setAiTargetOptions(options);
// ターゲット候補が変わったとき、選択肢をリセット
setSelectedAiTargets([]);
}, [subCategory]);

// AIターゲット選択ハンドラー
const handleAiTargetToggle = (target: string) => {
setSelectedAiTargets(prev => 
prev.includes(target)
? prev.filter(t => t !== target)
: [...prev, target]
);
};

// 業種固有データ変更ハンドラー
const handleIndustryDataChange = (key: keyof IndustrySpecificData, value: string) => {
setIndustryData(prev => ({ ...prev, [key]: value }));
};


const handleMainImageChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files && event.target.files[0]) { setMainImageFile(event.target.files[0]); } };
const handleGalleryImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => { if (event.target.files) { setGalleryImageFiles(prev => [...prev, ...Array.from(event.target.files!)]); } };
const handleSnsUrlChange = (index: number, value: string) => { const newSnsUrls = [...snsUrls]; newSnsUrls[index] = value; setSnsUrls(newSnsUrls); };
const handleSpecialtyChange = (index: number, value: string) => { 
const newSpecialtyPoints = [...specialtyPoints]; 
newSpecialtyPoints[index] = value; 
setSpecialtyPoints(newSpecialtyPoints); 
};

const handleDeleteImage = async (imageUrlToDelete: string, imageType: 'main' | 'gallery') => {
if (!user || !storeId) {
alert("エラーが発生しました。ページを再読み込みしてください。");
return;
}
// NOTE: alertの代わりにカスタムメッセージを使用
const customConfirm = (message: string): Promise<boolean> => {
return new Promise((resolve) => {
const messageBox = document.createElement('div');
messageBox.innerHTML = `
<div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; justify-content: center; align-items: center;">
<div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
<p style="margin-top: 0; color: #333;">${message}</p>
<button onclick="resolve(true)" style="margin-top: 15px; padding: 8px 15px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">削除する</button>
<button onclick="resolve(false)" style="margin-top: 15px; padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">キャンセル</button>
</div>
</div>
`;
document.body.appendChild(messageBox);
// イベントリスナーを設定して、ボタンクリックでメッセージボックスを削除し、Promiseを解決
const buttons = messageBox.querySelectorAll('button');
buttons.forEach(button => {
button.onclick = (e) => {
e.preventDefault();
const result = button.innerText === '削除する';
messageBox.remove();
resolve(result);
};
});
});
};

const shouldDelete = await customConfirm("この写真を本当に削除しますか？この操作は元に戻せません。");
if (!shouldDelete) {
return;
}

setError(null);
try {
const token = await user.getIdToken();
const response = await fetch('/api/partner/delete-image', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${token}`,
},
body: JSON.stringify({ storeId, imageUrl: imageUrlToDelete, imageType }),
});

const data = await response.json();
if (!response.ok) {
throw new Error(data.error || "削除に失敗しました。");
}

if (imageType === 'main') {
setMainImageUrl(null);
} else {
setGalleryImageUrls(prev => prev.filter(url => url !== imageUrlToDelete));
}
alert("写真を削除しました。");

} catch (err: any) {
console.error("画像削除エラー:", err);
setError(err.message);
}
};

const handleSaveProfile = async () => { // JSXで使用されているため維持
if (!user) {
console.error("Save failed: User is not logged in.");
return alert('ログインしていません。');
}

console.log("--- 1. SAVE PROCESS STARTED ---");

if (!mainCategory || (mainCategory !== 'その他' && !subCategory)) { return alert('カテゴリ（大分類・小分類）は必須項目です。'); }
if (mainCategory === 'その他' && !otherMainCategory) { return alert('カテゴリ（大分類）で「その他」を選んだ場合は、内容を入力してください。'); }
if (subCategory === 'その他' && !otherSubCategory) { return alert('カテゴリ（小分類）で「その他」を選んだ場合は、内容を入力してください。'); }

setIsSaving(true);
setError(null);

// カスタムターゲットを結合
let finalSelectedTargets = selectedAiTargets.slice();

// 既に選択肢に含まれる 'その他' を削除（カスタム入力値と重複するため）
finalSelectedTargets = finalSelectedTargets.filter(t => t !== 'その他');

if (customAiTarget.trim()) {
finalSelectedTargets.push(customAiTarget.trim());
}

try {
const userStoresCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'stores');
let currentStoreId = storeId;

// AIマッチング用の正規化キーを生成
const normalizedIndustryKey = getNormalizedIndustryKey(mainCategory, subCategory);

// 特化ポイントから空の項目をフィルタリング
const filteredSpecialtyPoints = specialtyPoints.filter(p => p.trim() !== '');

// AIターゲットの選択結果を結合して文字列にする
const selectedAiTargetsString = finalSelectedTargets.join(', ');

// 全てのデータを統合
const allStoreData = { 
storeName, 
address, 
phoneNumber, 
mainCategory, 
subCategory, 
otherMainCategory: mainCategory === 'その他' ? otherMainCategory : '', 
otherSubCategory: subCategory === 'その他' ? otherSubCategory : '', 
description, 
targetUserInterests: targetUserInterests, 
specialtyPoints: filteredSpecialtyPoints, 
// AIターゲット情報の保存
aiTargetOptions: aiTargetOptions, // 候補リスト
selectedAiTargets: finalSelectedTargets, // 選択されたターゲット配列 (カスタム含む)
selectedAiTargetsString: selectedAiTargetsString, // AI実行用文字列
customAiTarget: customAiTarget, // カスタム入力値
// 追加: LINE情報保存
lineOfficialId: lineOfficialId,
lineLiffUrl: lineLiffUrl,
websiteUrl, 
snsUrls: snsUrls.filter(url => url.trim() !== ''), 
ownerId: user.uid, 
updatedAt: serverTimestamp(), 
normalizedIndustryKey: normalizedIndustryKey,
// 業種固有のカスタムデータも統合
...industryData, 
};

console.log("--- 3. Firestore Data ---");
console.log("Data to save:", allStoreData);

if (!currentStoreId) {
console.log("Creating new document...");
const docRef = await addDoc(userStoresCollectionRef, { ...allStoreData, status: 'pending', createdAt: serverTimestamp(), mainImageUrl: '', galleryImageUrls: [] });
currentStoreId = docRef.id;
setStoreId(currentStoreId);
console.log("SUCCESS: New document created with ID:", currentStoreId);
} else {
console.log("Updating existing document:", currentStoreId);
const storeDocRefForUpdate = doc(userStoresCollectionRef, currentStoreId);
await updateDoc(storeDocRefForUpdate, allStoreData);
console.log("SUCCESS: Document updated.");
}

const storeDocRef = doc(userStoresCollectionRef, currentStoreId!);

if (mainImageFile) {
const uniqueFileName = `main_${uuidv4()}_${mainImageFile.name}`;
const storagePath = `users/${user.uid}/stores/${currentStoreId}/${uniqueFileName}`;
const fileRef = ref(storage, storagePath);
const uploadTask = await uploadBytesResumable(fileRef, mainImageFile);
const updatedMainImageUrl = await getDownloadURL(uploadTask.ref);
await updateDoc(storeDocRef, { mainImageUrl: updatedMainImageUrl });
setMainImageUrl(updatedMainImageUrl);
}

if (galleryImageFiles.length > 0) {
const newGalleryImageUrls: string[] = [];
for (const file of galleryImageFiles) {
const uniqueFileName = `gallery_${uuidv4()}_${file.name}`;
const storagePath = `users/${user.uid}/stores/${currentStoreId}/${uniqueFileName}`;
const fileRef = ref(storage, storagePath);
const uploadTask = await uploadBytesResumable(fileRef, file);
const downloadURL = await getDownloadURL(uploadTask.ref);
newGalleryImageUrls.push(downloadURL);
}
await updateDoc(storeDocRef, { galleryImageUrls: arrayUnion(...newGalleryImageUrls) });
setGalleryImageUrls(prev => [...prev, ...newGalleryImageUrls]);
}

setMainImageFile(null);
setGalleryImageFiles([]);

console.log("--- 6. SAVE PROCESS COMPLETED ON CLIENT ---");
alert('店舗情報を保存しました。');

} catch (err: any) {
console.error("!!! SAVE FAILED !!! An error occurred in handleSaveProfile:", err);
let errorMessage = `保存に失敗しました: ${err.message}`;
if (err.code === 'permission-denied' || (err.code && err.code.includes('storage/unauthorized'))) {
errorMessage += "\n\n【重要】これはFirebaseの権限エラーです。FirebaseコンソールでFirestoreとStorage両方のセキュリティルールが正しく設定されているか確認してください。";
}
setError(errorMessage);
} finally {
setIsSaving(false);
}
};

// ヘルパーコンポーネント: 飲食関連のカスタムフィールド
const RenderRestaurantFields = () => (
<div className="mt-6 p-4 border rounded-md bg-white">
<h3 className="font-bold text-lg mb-3 border-b pb-2">【飲食関連】詳細情報</h3>
<div className="space-y-4">
<div>
<label className="font-bold">総席数 (例: 30席)</label>
<input type="text" value={industryData.seats || ''} onChange={e => handleIndustryDataChange('seats', e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="例: 30席" />
</div>
<div>
<label className="font-bold">個室の有無・席数 (例: 4名個室 x 2室)</label>
<input type="text" value={industryData.privateRooms || ''} onChange={e => handleIndustryDataChange('privateRooms', e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="例: あり（4名用 x 2室）" />
</div>
<div>
<label className="font-bold">禁煙・喫煙</label>
<select value={industryData.smoking || ''} onChange={e => handleIndustryDataChange('smoking', e.target.value)} className="w-full p-2 border rounded mt-1">
<option value="">選択してください</option>
<option value="no">全席禁煙</option>
<option value="yes">全席喫煙可</option>
<option value="partial">分煙あり</option>
</select>
</div>
</div>
</div>
);

// ヘルパーコンポーネント: 美容・健康関連のカスタムフィールド
const RenderBeautyFields = () => (
<div className="mt-6 p-4 border rounded-md bg-white">
<h3 className="font-bold text-lg mb-3 border-b pb-2">【美容・健康関連】詳細情報</h3>
<div className="space-y-4">
<div>
<label className="font-bold">特に得意なスタイル・施術</label>
<input type="text" value={industryData.specialtyCut || ''} onChange={e => handleIndustryDataChange('specialtyCut', e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="例: ショートカット、産後の骨盤矯正" />
</div>
</div>
</div>
);

// 業種別カスタムフィールドのレンダリング
const renderIndustrySpecificFields = () => {
if (mainCategory === '飲食関連') return <RenderRestaurantFields />;
// 美容・健康は、メインカテゴリが "美容・健康関連" またはサブカテゴリに "整体" などが含まれる場合
if (mainCategory === '美容・健康関連' || subCategory.includes('整体') || subCategory.includes('整骨院') || subCategory.includes('鍼灸院')) return <RenderBeautyFields />;
return null;
};


if (loading) return <div>読み込み中...</div>;

return (
<div className="container mx-auto p-8 max-w-3xl">
<h1 className="text-2xl font-bold mb-6">店舗プロフィールの登録・編集</h1>
{error && <p className="text-red-500 my-4 bg-red-100 p-3 rounded whitespace-pre-wrap">エラー: {error}</p>}
<div className="space-y-6">
<div><label className="font-bold">店舗名 *</label><input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
<div><label className="font-bold">住所 *</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>
{address && ( <div className="mt-4"><iframe width="100%" height="300" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.co.jp/maps?output=embed&q=${encodeURIComponent(address)}`}></iframe></div> )}
<div><label className="font-bold">電話番号 *</label><input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full p-2 border rounded mt-1" /></div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-md">
<div>
<label className="font-bold">カテゴリ（大分類）*</label>
<select value={mainCategory} onChange={e => setMainCategory(e.target.value)} className="w-full p-2 border rounded mt-1">
<option value="">選択してください</option>
{mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
</select>
{mainCategory === 'その他' && ( <input type="text" value={otherMainCategory} onChange={e => setOtherMainCategory(e.target.value)} placeholder="カテゴリ名を入力" className="w-full p-2 border rounded mt-2"/> )}
</div>
<div>
<label className="font-bold">カテゴリ（小分類）*</label>
<select value={subCategory} onChange={e => setSubCategory(e.target.value)} disabled={!mainCategory} className="w-full p-2 border rounded mt-1 disabled:bg-gray-100">
<option value="">大分類を先に選択</option>
{subCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
</select>
{subCategory === 'その他' && ( <input type="text" value={otherSubCategory} onChange={e => setOtherSubCategory(e.target.value)} placeholder="カテゴリ名を入力" className="w-full p-2 border rounded mt-2"/> )}
</div>
</div>

{/* AIターゲット層の選択 UI */}
{subCategory && (
<div className="border p-4 rounded-md bg-indigo-50">
<label className="font-bold block mb-3 text-lg text-indigo-800">
AIターゲット層の選択（複数選択可）
</label>
<p className="text-sm text-gray-600 mb-3">
小分類「<span className="font-semibold text-indigo-700">{subCategory}</span>」に基づき、AIが最も効果的にマッチングさせるターゲット層を選択してください。
</p>
<div className="flex flex-wrap gap-2">
{aiTargetOptions.map((target, index) => {
const isSelected = selectedAiTargets.includes(target);
return (
<button
key={index}
type="button"
onClick={() => handleAiTargetToggle(target)}
className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
isSelected
? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
: 'bg-white text-gray-700 border border-indigo-300 hover:bg-indigo-100'
}`}
>
{target}
</button>
);
})}
{aiTargetOptions.length === 0 && (
<p className="text-sm text-gray-500">この小分類のターゲット候補は定義されていません。カスタム関心事を入力してください。</p>
)}
</div>

{/* 新規追加: 「その他」入力欄 */}
{aiTargetOptions.includes('その他') && (
<div className="mt-4 pt-4 border-t border-indigo-200">
<label className="font-bold block mb-2 text-indigo-700">カスタムターゲット（その他）</label>
<input
type="text"
value={customAiTarget}
onChange={(e) => setCustomAiTarget(e.target.value)}
className="w-full p-2 border rounded mt-1"
placeholder="例: 高齢者向けのサービスを求める層 (複数入力不可)"
/>
<p className="text-xs text-gray-500 mt-1">AIマッチングの対象に追加したい独自のターゲット層を自由に入力してください。</p>
</div>
)}

</div>
)}
{/* AIターゲット層の選択 UI 終了 */}

<div>
<div className="flex justify-between items-center mb-1">
<div>
<label className="font-bold">店舗紹介文・営業時間</label>
<p className="text-sm text-gray-500 mt-1">営業時間や定休日、**駐車場の有無**もこちらにご記入ください。</p>
</div>
<button type="button" onClick={() => setDescription(descriptionPlaceholder)} className="bg-blue-500 text-white text-sm font-bold py-2 px-4 rounded hover:bg-blue-600 transition-colors">テンプレートを貼り付け</button>
</div>
<textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded mt-1" rows={15} placeholder="カテゴリを選択後、「テンプレートを貼り付け」ボタンを押すと入力が簡単になります。"></textarea>
</div>

{/* 新規追加: 業種固有の詳細フォームのレンダリング */}
{renderIndustrySpecificFields()}

{/* 新規追加: 貴店の特化ポイント（3つの強み） */}
<div className="border p-4 rounded-md bg-yellow-50">
<label className="font-bold block mb-3 text-lg text-yellow-800">貴店の特化ポイント（3つの強み）</label>
<p className="text-sm text-gray-600 mb-3">
アプリの店舗一覧や AI マッチングの際、ユーザーが店舗を判断する最重要ポイントとして表示されます。
</p>
{specialtyPoints.map((point, index) => (
<div key={index} className="flex items-center mb-2">
<span className="text-gray-600 w-6 font-semibold">{index + 1}.</span>
<input
type="text"
value={point}
onChange={(e) => handleSpecialtyChange(index, e.target.value)}
className="w-full p-2 border rounded ml-2"
placeholder={index === 0 ? "例：オーガニックカラー専門" : index === 1 ? "例：駐車場完備（10台）" : "例：キッズスペースあり"}
maxLength={50}
/>
</div>
))}
<p className="text-xs text-gray-500 mt-2">※ 最大3つまで、簡潔に記入してください。</p>
</div>


{/* 希望するターゲット層の関心事の入力欄 (AIマッチング用) */}
<div>
<label className="font-bold">希望するターゲット層の関心事 (AIマッチング用)</label>
<p className="text-sm text-gray-500 mt-1">
AIに、貴店が獲得したい顧客の具体的な興味や関心（例: オーガニック、ペット愛好家、地域貢献、子育て世代など）を伝えます。
</p>
<textarea 
value={targetUserInterests} 
onChange={(e) => setTargetUserInterests(e.target.value)} 
className="w-full p-2 border rounded mt-1" 
rows={3} 
placeholder="例：週末に体験イベントに参加したいアクティブな層、価格よりも品質を重視する層など。"
/>
</div>

{/* 新規追加: LINE連携情報 */}
<div className="border p-4 rounded-md bg-green-50">
<h3 className="font-bold text-lg mb-3 border-b pb-2 text-green-700">LINE連携情報（AIマッチング成立後の誘導先）</h3>
<p className="text-sm text-gray-600 mb-3">
AIマッチング成立後、ユーザーが直接コミュニケーションを取るためのボタンに利用されます。
</p>
<div className="space-y-3">
<div>
<label className="font-bold">LINE 公式アカウントID</label>
<input type="text" value={lineOfficialId} onChange={e => setLineOfficialId(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="@を含めたIDを入力してください（例: @xxxxxxxxx）" />
</div>
<div>
<label className="font-bold">LINE 友だち追加/LIFF URL</label>
<input type="url" value={lineLiffUrl} onChange={e => setLineLiffUrl(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://lin.ee/xxxxxx または LIFF URL" />
</div>
</div>
</div>

<div className="space-y-2">
<label className="font-bold">トップ画像 (1枚)</label>
<p className="text-sm text-gray-500">推奨サイズ: 横1200px × 縦675px (16:9)</p>
<div className="p-2 border rounded min-h-[100px]">
{(mainImageUrl || mainImageFile) ? (
<div className="relative inline-block">
<img src={mainImageFile ? URL.createObjectURL(mainImageFile) : mainImageUrl!} alt="トップ画像プレビュー" className="w-48 h-auto rounded" />
<button type="button" onClick={() => { if (mainImageFile) { setMainImageFile(null); const input = document.getElementById('main-image-input') as HTMLInputElement; if (input) input.value = ''; } else if (mainImageUrl) { handleDeleteImage(mainImageUrl, 'main'); } }} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center -m-2">X</button>
</div>
) : ( <p className="text-gray-400">まだ画像はありません。</p> )}
</div>
<input id="main-image-input" type="file" accept="image/*" onChange={handleMainImageChange} className="text-sm" />
</div>
<div className="space-y-2">
<label className="font-bold">ギャラリー写真 (複数可)</label>
<p className="text-sm text-gray-500">推奨サイズ: 横800px × 縦800px (1:1)</p>
<div className="p-2 border rounded min-h-[112px] flex flex-wrap gap-2">
{galleryImageUrls && galleryImageUrls.filter(url => url).map((url, index) => (
<div key={index} className="relative">
<img src={url} alt={`ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
<button type="button" onClick={() => handleDeleteImage(url, 'gallery')} className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
</div>
))}
{galleryImageFiles.map((file, index) => (
<div key={index} className="relative">
<img src={URL.createObjectURL(file)} alt={`新規ギャラリー画像 ${index + 1}`} className="w-24 h-24 object-cover rounded"/>
<button type="button" onClick={() => setGalleryImageFiles(galleryImageFiles.filter((_, i) => i !== index))} className="absolute top-[-5px] right-[-5px] bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
</div>
))}
{galleryImageUrls.filter(url => url).length === 0 && galleryImageFiles.length === 0 && (<p className="text-gray-400">まだ写真はありません。</p>)}
</div>
<input type="file" multiple onChange={handleGalleryImagesChange} accept="image/*" className="text-sm" />
</div>

<div><label className="font-bold">公式ウェブサイトURL</label><input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
<div><label className="font-bold">SNS URL 1</label><input type="url" value={snsUrls[0]} onChange={(e) => handleSnsUrlChange(0, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
<div><label className="font-bold">SNS URL 2</label><input type="url" value={snsUrls[1]} onChange={(e) => handleSnsUrlChange(1, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https://..." /></div>
<div><label className="font-bold">SNS URL 3</label><input type="url" value={snsUrls[2]} onChange={(e) => handleSnsUrlChange(2, e.target.value)} className="w-full p-2 border rounded mt-1" placeholder="https-..." /></div>

<button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
{isSaving ? '保存中...' : '保存する'}
</button>
</div>

<div className="mt-8">
<Link href="/partner/dashboard" legacyBehavior><a className="text-blue-600 hover:underline">← ダッシュボードに戻る</a></Link>
</div>
</div>
);
};

export default StoreProfilePage;
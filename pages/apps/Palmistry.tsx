import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Sparkles, Loader2, RefreshCw, AlertTriangle, Heart, Briefcase, Coins, Star, CheckCircle2, HelpingHand } from 'lucide-react';

// ★プレビュー環境用にAPIキーを埋め込みます
const GEMINI_API_KEY = "AIzaSyDlbWiBKO3LFNnqGcX8rYYNDh-Nkl1rrFU";

type Topic = 'general' | 'love' | 'work' | 'money' | 'health';
type HandType = 'right' | 'left';

export default function PalmistryPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<Topic>('love');
  const [hand, setHand] = useState<HandType>('right'); // デフォルトは右手（現在）

  // タイトル設定
  useEffect(() => {
    document.title = "AI手相鑑定 - 那須の母";
  }, []);

  const handleGoBack = () => {
    window.location.href = '/apps/categories';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB制限
      setError("画像が大きすぎます（10MB以下にしてください）");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // 本物のAI鑑定実行 (クライアントサイド直接呼び出し)
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. 画像データの準備
      const match = selectedImage.match(/^data:(.+);base64,(.+)$/);
      if (!match) throw new Error("画像の読み込みに失敗しました。別の画像をお試しください。");
      
      const mimeType = match[1];
      const base64Data = match[2];

      // 2. プロンプトの作成 (テーマと手に応じて変化させる)
      let topicInstruction = "";
      let topicTitle = "";
      switch (topic) {
        case 'love':
          topicTitle = "恋愛・結婚運";
          topicInstruction = "「恋愛運・結婚運・愛情」についてのみ、深く詳細に鑑定してください。他の運勢（仕事や金運など）については触れなくて良いです。";
          break;
        case 'work':
          topicTitle = "仕事・才能";
          topicInstruction = "「仕事運・才能・適職」についてのみ、深く詳細に鑑定してください。他の運勢については触れなくて良いです。";
          break;
        case 'money':
          topicTitle = "金運・財運";
          topicInstruction = "「金運・財運・お金の使い方」についてのみ、深く詳細に鑑定してください。他の運勢については触れなくて良いです。";
          break;
        case 'health':
          topicTitle = "健康・バイタリティ";
          topicInstruction = "「健康運・体力・メンタル」についてのみ、深く詳細に鑑定してください。他の運勢については触れなくて良いです。";
          break;
        case 'general':
        default:
          topicTitle = "総合運";
          topicInstruction = "全体的な運勢をバランスよく見て、今の相談者に一番必要なメッセージを伝えてください。";
          break;
      }

      // 手に応じた指示
      const handTitle = hand === 'right' ? "右手（現在の運勢・後天性）" : "左手（生まれ持った運勢・先天性）";
      const handInstruction = hand === 'right' 
        ? "これは【右手】の画像です。右手は「現在の自分、努力して得た運勢（後天性）」を表します。これまでの努力の結果や、現状の運気、未来への可能性を中心に鑑定してください。"
        : "これは【左手】の画像です。左手は「生まれ持った運勢、才能、本質（先天性）」を表します。相談者が本来持っている潜在能力や性格、宿命的な傾向を中心に鑑定してください。";

      const prompt = `
        あなたは「那須の母」と呼ばれる伝説の手相占い師です。
        送られてきた手のひらの画像を詳細に分析し、相談者が「自分の手のどこを見ればいいか」が分かるように解説付きで占ってください。

        画像が手相でない場合や、不鮮明で見えない場合は正直に「よく見えません」と伝えてください。
        
        【鑑定対象の手: ${handTitle}】
        ${handInstruction}

        【今回の鑑定テーマ: ${topicTitle}】
        ${topicInstruction}
        
        【重要なお知らせ】
        鑑定の最後に必ず、「手相は脳のシワとも言われ、考え方や行動が変われば2〜3ヶ月で変わるものじゃよ」という旨を伝えて、変化を楽しむよう促してください。

        【出力構成】
        以下の構成で話してください。

        1. **${topicTitle}の鑑定結果 (${handTitle})**
           - テーマに関連する線（${topic === 'love' ? '感情線や結婚線' : topic === 'work' ? '運命線や知能線' : topic === 'money' ? '財運線や太陽線' : '生命線など'}）の状態とその意味
           - 具体的な現状の分析

        2. **那須の母からのアドバイス**
           - その運勢を良くするための具体的な行動や心構え
           - 温かい励ましのメッセージ

        口調は「〜じゃよ」「〜だねぇ」「安心おし」といった、包容力のある温かいおばあちゃん言葉で統一してください。
        マークダウン形式で見やすく出力してください。
      `;

      console.log("Analyzing palmistry with Nasu-no-Haha persona...", topic, hand);

      // 3. Gemini API (REST) を直接呼び出す
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Data:", errorData);
        
        let errorMsg = `APIエラー (${response.status})`;
        if (errorData.error && errorData.error.message) {
            errorMsg += `: ${errorData.error.message}`;
        }
        
        if (response.status === 400) errorMsg = "画像を解析できませんでした。別の画像を試してください。";
        if (response.status === 403) errorMsg = "APIキーが無効か、アクセス権限がありません。";
        if (response.status === 404) errorMsg = "AIモデルが見つかりません。";
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error('AIからの応答が空でした。もう一度お試しください。');
      }

      setResult(generatedText);

    } catch (err: any) {
      console.error("Palmistry Error:", err);
      setError(`鑑定できませんでした。\n詳細: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // テーマ選択ボタンコンポーネント
  const TopicButton = ({ id, icon: Icon, label, colorClass }: { id: Topic, icon: any, label: string, colorClass: string }) => (
    <button 
        onClick={() => setTopic(id)}
        className={`relative p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border-2 ${topic === id ? `bg-white border-${colorClass} ring-2 ring-${colorClass} ring-offset-2 shadow-md z-10` : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-500'}`}
    >
        {topic === id && (
            <div className={`absolute top-1.5 right-1.5 text-${colorClass}`}>
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
        )}
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${topic === id ? `text-${colorClass}` : 'text-gray-400'}`} />
        <span className={`font-bold text-xs sm:text-sm ${topic === id ? 'text-gray-800' : 'text-gray-500'}`}>{label}</span>
    </button>
  );

  // 手の選択ボタンコンポーネント
  const HandButton = ({ type, label, subLabel }: { type: HandType, label: string, subLabel: string }) => (
    <button 
        onClick={() => setHand(type)}
        className={`flex-1 p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-3 ${hand === type ? 'bg-purple-50 border-purple-500 ring-1 ring-purple-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
    >
        <div className={`p-2 rounded-full ${hand === type ? 'bg-purple-200 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
            <HelpingHand className="w-5 h-5" />
        </div>
        <div className="text-left">
            <div className={`font-bold text-sm ${hand === type ? 'text-purple-900' : 'text-gray-700'}`}>{label}</div>
            <div className="text-xs text-gray-500">{subLabel}</div>
        </div>
        {hand === type && <CheckCircle2 className="w-5 h-5 text-purple-500 ml-auto" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-purple-50 text-gray-800 font-sans">
      
      <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-purple-200">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={handleGoBack} className="p-2 hover:bg-purple-100 rounded-full"><ArrowLeft className="w-5 h-5 text-purple-700" /></button>
          <h1 className="text-xl font-bold text-purple-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />AI手相鑑定</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 pb-20">
        
        {/* Intro Section - Always visible unless analyzing/result */}
        {!isAnalyzing && !result && (
          <div className="space-y-6">
            {!selectedImage && (
              <div className="text-center bg-white p-6 rounded-2xl shadow-md border border-purple-100">
                <h2 className="text-2xl font-bold text-purple-800 mb-2">あなたの運命を<br/>本物のAIが視ます</h2>
                <p className="text-sm text-gray-600">
                  Googleの最新AIが、あなたの手のひらを解析。<br/>
                  今のあなたに必要な言葉を紡ぎます。
                </p>
              </div>
            )}

            {/* 手の選択エリア */}
            <div className="bg-white p-5 rounded-2xl shadow-md border border-purple-100 animate-fade-in-up">
                <h3 className="text-base font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <HelpingHand className="w-4 h-4 text-purple-500" />
                    どちらの手を視ますか？
                </h3>
                <div className="flex flex-col gap-3">
                    <HandButton type="right" label="右手" subLabel="現在の運勢 (後天性)" />
                    <HandButton type="left" label="左手" subLabel="生まれ持った運勢 (先天性)" />
                </div>
            </div>

            {/* テーマ選択エリア */}
            <div className="bg-white p-5 rounded-2xl shadow-md border border-purple-100 animate-fade-in-up">
                <h3 className="text-base font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    今日は何について占いますか？
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                    気になることに絞ると、より詳しく視えますよ。
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <TopicButton id="love" icon={Heart} label="恋愛・結婚" colorClass="pink-500" />
                    <TopicButton id="work" icon={Briefcase} label="仕事・才能" colorClass="blue-500" />
                    <TopicButton id="money" icon={Coins} label="金運・財運" colorClass="yellow-500" />
                    <TopicButton id="general" icon={Star} label="総合運" colorClass="purple-600" />
                </div>
            </div>

            {/* 画像選択エリア */}
            <div className="mb-6">
              <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
              
              {!selectedImage ? (
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-12 bg-white border-2 border-dashed border-purple-300 rounded-2xl flex flex-col items-center justify-center text-purple-500 hover:bg-purple-50 shadow-sm transition-colors group">
                  <div className="bg-purple-100 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-purple-600" />
                  </div>
                  <span className="font-bold text-lg">手相を撮影する</span>
                  <span className="text-xs text-purple-400 mt-1">または画像を選択</span>
                </button>
              ) : (
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} alt="手相" className="w-full rounded-2xl shadow-lg border-4 border-white" />
                  <button onClick={handleReset} className="absolute top-2 right-2 p-2 bg-gray-900/70 text-white rounded-full hover:bg-gray-900 transition-colors shadow-lg">
                      <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* 鑑定ボタン: 画像選択時のみ表示 */}
            {selectedImage && (
              <button onClick={handleAnalyze} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 animate-bounce-subtle">
                <Sparkles className="w-6 h-6" /> 
                {hand === 'right' ? '右手' : '左手'}で鑑定する
              </button>
            )}
            
            {error && (
                <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-left animate-shake">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-bold whitespace-pre-wrap">{error}</p>
                </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 bg-white rounded-2xl shadow-inner min-h-[400px]">
            <div className="relative">
                <div className="absolute inset-0 bg-purple-200 rounded-full animate-ping opacity-20 duration-1000"></div>
                <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse opacity-40 delay-75"></div>
                <Loader2 className="w-16 h-16 text-purple-600 animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-purple-800 font-bold text-xl animate-pulse">那須の母が手相を見ています...</p>
                <p className="text-sm text-gray-500">
                    {hand === 'right' ? '現在の運勢' : '生まれ持った運勢'}を読み解いています<br/>
                    テーマ: <span className="font-bold text-purple-600">{topic === 'love' ? '恋愛・結婚' : topic === 'work' ? '仕事・才能' : topic === 'money' ? '金運' : topic === 'health' ? '健康' : '総合運'}</span>
                </p>
                <p className="text-xs text-gray-400">少し時間がかかる場合があります</p>
            </div>
          </div>
        )}

        {/* Result View */}
        {result && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-200 animate-fade-in-up">
            <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
              <h3 className="text-xl font-bold text-white relative z-10">鑑定結果</h3>
              <div className="flex justify-center gap-2 mt-2 relative z-10">
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                      手: {hand === 'right' ? '右手 (現在)' : '左手 (先天)'}
                  </div>
                  <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs">
                      テーマ: {topic === 'love' ? '恋愛・結婚' : topic === 'work' ? '仕事・才能' : topic === 'money' ? '金運' : topic === 'health' ? '健康' : '総合運'}
                  </div>
              </div>
            </div>
            
            <div className="p-6 prose prose-purple max-w-none text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">
              {result}
            </div>
            
            <div className="p-6 bg-purple-50 text-center border-t border-purple-100">
              <div className="mb-6 text-left bg-white p-4 rounded-xl border border-purple-100 shadow-sm">
                  <p className="text-sm text-purple-800 font-bold mb-1 flex items-center gap-1">
                      <RefreshCw className="w-4 h-4" /> 那須の母より
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                      手相はあなたの心の映し鏡じゃよ。<br/>
                      今日の鑑定結果をヒントに、前向きに行動すれば、手相も運命もまた変わっていくからね。<br/>
                      また迷った時は、いつでも見せにおいで。
                  </p>
              </div>
              
              <button onClick={handleReset} className="w-full py-3 bg-white text-purple-700 font-bold border-2 border-purple-200 rounded-full hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                <Camera className="w-5 h-5" /> 別のテーマ・写真で占う
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
import React, { useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowLeft, Camera, Sparkles, Loader2, RefreshCw } from 'lucide-react';

export default function PalmistryPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 画像選択
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("画像が大きすぎます（5MB以下にしてください）");
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

  // 本物のAI鑑定実行
  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/palmistry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!response.ok) throw new Error('鑑定エラー');

      const data = await response.json();
      setResult(data.result); // AIの生の回答を表示
    } catch (err) {
      setError('鑑定できませんでした。通信環境の良い場所でお試しください。');
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

  return (
    <div className="min-h-screen bg-purple-50 text-gray-800 font-sans">
      <Head><title>AI手相鑑定 - 那須の母</title></Head>

      <header className="bg-white shadow-sm sticky top-0 z-10 p-4 border-b border-purple-200">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-purple-100 rounded-full"><ArrowLeft className="w-5 h-5 text-purple-700" /></button>
          <h1 className="text-xl font-bold text-purple-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-500" />AI手相鑑定</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 pb-20">
        {!selectedImage && (
          <div className="text-center mb-8 space-y-4">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-100">
              <h2 className="text-2xl font-bold text-purple-800 mb-2">あなたの運命を<br/>本物のAIが視ます</h2>
              <p className="text-sm text-gray-600">
                Googleの最新AIが、あなたの手のひらの画像を<br/>
                ピクセル単位で解析し、<br/>
                今のあなたに必要な言葉を紡ぎます。
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
          
          {!selectedImage ? (
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-12 bg-white border-2 border-dashed border-purple-300 rounded-2xl flex flex-col items-center justify-center text-purple-500 hover:bg-purple-50 shadow-sm">
              <Camera className="w-12 h-12 mb-3" />
              <span className="font-bold text-lg">手相を撮影する</span>
            </button>
          ) : (
            <div className="relative">
              <img src={selectedImage} alt="手相" className="w-full rounded-2xl shadow-lg" />
              {!isAnalyzing && !result && (
                <button onClick={handleReset} className="absolute top-2 right-2 p-2 bg-gray-800/70 text-white rounded-full"><RefreshCw className="w-4 h-4" /></button>
              )}
            </div>
          )}
        </div>

        {selectedImage && !result && (
          <div className="text-center">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                <p className="text-purple-800 font-bold animate-pulse">那須の母が手相を見ています...</p>
              </div>
            ) : (
              <button onClick={handleAnalyze} className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xl rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6" /> 鑑定する
              </button>
            )}
            {error && <p className="mt-4 text-red-600 bg-red-50 p-3 rounded-lg font-bold">{error}</p>}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-200 animate-fade-in-up">
            <div className="bg-purple-800 p-4 text-center">
              <h3 className="text-lg font-bold text-white">鑑定結果</h3>
            </div>
            <div className="p-6 prose prose-purple max-w-none text-gray-800 whitespace-pre-wrap font-medium">
              {result}
            </div>
            <div className="p-4 bg-purple-50 text-center border-t border-purple-100">
              <button onClick={handleReset} className="text-purple-700 font-bold hover:underline flex items-center justify-center gap-2 mx-auto">
                <RefreshCw className="w-4 h-4" /> もう一度占う
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
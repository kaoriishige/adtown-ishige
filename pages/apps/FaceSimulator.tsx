import { useState } from 'react';

export default function FaceSimulator() {
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (!image) return;
    setLoading(true);
    setResultImage(null); // 前回の画像をクリア

    try {
      const response = await fetch('/api/replicate-age', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      const data = await response.json();

      // ✅ IDなどは見ず、data.outputにある画像をそのまま表示する
      if (data.output && data.output[0]) {
        setResultImage(data.output[0]);
      } else {
        alert("AIが画像を生成できませんでした。時間を置いて試してください。");
      }
    } catch (e) {
      alert("通信エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#1a1a1a', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ marginBottom: '30px' }}>10年後の自分シミュレーター</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input type="file" onChange={handleFileChange} accept="image/*" style={{ marginBottom: '20px' }} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        <div style={{ border: '2px solid #333', padding: '10px', borderRadius: '10px' }}>
          <p>【 現在のあなた 】</p>
          {image ? <img src={image} style={{ width: '300px', height: '300px', objectFit: 'cover' }} /> : <div style={{ width: '300px', height: '300px', background: '#222' }} />}
        </div>

        <div style={{ border: '2px solid #555', padding: '10px', borderRadius: '10px' }}>
          <p>【 10年後のあなた 】</p>
          {resultImage ? (
            <img src={resultImage} style={{ width: '300px', height: '300px', objectFit: 'cover', border: '2px solid gold' }} />
          ) : (
            <div style={{ width: '300px', height: '300px', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? "AIが描いています..." : "準備完了"}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={handleSimulate} 
          disabled={loading || !image}
          style={{ 
            padding: '15px 40px', 
            fontSize: '20px', 
            cursor: 'pointer', 
            backgroundColor: loading ? '#555' : '#e50914', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px' 
          }}
        >
          {loading ? "シミュレーション中（約15秒）..." : "未来をシミュレーションする"}
        </button>
      </div>
    </div>
  );
}
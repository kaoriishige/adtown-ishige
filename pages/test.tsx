import Image from 'next/image';
import { NextPage } from 'next';

const ImageTestPage2: NextPage = () => {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
        画像表示テストページ 2
      </h1>
      <p style={{ fontSize: '18px' }}>
        <b>partner-akimoto.png</b> が public/images フォルダに正しく配置されていれば、以下に画像が表示されます。
      </p>
      <hr style={{ margin: '20px 0' }} />

      <Image
        src="/images/partner-akimoto.png"
        alt="テスト用のパン・アキモト様の画像"
        width={400}
        height={200}
        style={{ border: '4px solid #ccc', objectFit: 'contain' }}
      />
    </div>
  );
};

export default ImageTestPage2;
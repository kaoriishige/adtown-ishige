import Image from 'next/image';
import { NextPage } from 'next';

const ImageTestAllPage: NextPage = () => {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>総合画像表示テスト</h1>
      <p>このページは、public/imagesフォルダ内の主要な画像が正しく表示されるかを確認します。</p>

      <hr style={{ margin: '30px 0' }} />

      <h2 style={{ fontSize: '24px' }}>1. 家族の写真 (family-smile.jpg)</h2>
      <Image src="/images/family-smile.jpg" alt="family-smile.jpg" width={400} height={267} />

      <hr style={{ margin: '30px 0' }} />

      <h2 style={{ fontSize: '24px' }}>2. 成功画像 (map-chart.png)</h2>
      <Image src="/images/map-chart.png" alt="map-chart.png" width={400} height={250} style={{ objectFit: 'contain' }} />

      <hr style={{ margin: '30px 0' }} />

      <h2 style={{ fontSize: '24px' }}>3. パートナー画像 (partner-akimoto.png)</h2>
      <Image src="/images/partner-akimoto.png" alt="partner-akimoto.png" width={400} height={150} style={{ objectFit: 'contain' }} />

      <hr style={{ margin: '30px 0' }} />

      <h2 style={{ fontSize: '24px' }}>4. 仮の図解画像 (visual-diagram.png)</h2>
      <Image src="/images/visual-diagram.png" alt="visual-diagram.png" width={400} height={267} style={{ objectFit: 'contain' }} />

    </div>
  );
};

export default ImageTestAllPage;
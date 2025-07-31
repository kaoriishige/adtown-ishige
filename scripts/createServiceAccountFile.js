// scripts/createServiceAccountFile.js
const fs = require('fs');
const path = require('path');

// --- 【ここが、あなたの提供した private_key の値が埋め込まれる場所です！】 ---
// Netlifyの環境変数からではなく、ここに直接秘密鍵を埋め込みます
// この値は、JSONファイルからコピーした private_key の値（両端の "" は不要）を、
// バッククォート (`) で囲むことで、改行文字をそのまま扱えるようにしています。
// ※ 注意: このコードは一時的なテスト用であり、本番環境では絶対にコミットしないでください！
const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC2q+ZfGaFnNPVp\nBXcxGJXt0X6Yq971iGDLxC6tHLXy43IOOpXBNjKTDo0WFnnp5fJGOooJHriQm96F\nwlaBvFKFgPo8qSXIBNQ+yN56MUPNDjfV1ran0PxtMJZYWzJvpr+FkCO16j/NIjug\nGfK7Dq1V66bbc+JF5m//dFQIokqZqZa9J5F+ylanj7Wym302uQIqtWVG52mhKg/W\nkGsKeWvgvYWSwS8Rx+SWYRiPdjL43sZb+oOfyiGKDIRz7BCrNo4GNx5ibMZiXy8d\nPlI4BeS68IM1DryDR2LOF4WUsYJ5KyYW6yI3yU1MsLArJ0kTlRPtXEo7NGAj6xO4\nYw3N8psfAgMBAAECggEACqcvwjAOd6RhA4TsFJLoe3wSM/kiAZO4gWmphzL7cXTO\nPAIypZfxjx30IGujJH7iiDH1xt5hyR0t9wMEZICFF4AUF+GNcILHlfnE779bwuOn\nYfMpp9PKRNvmiLSY1mYVGUb0rjFBE0eBzq50t2/9r9sUWgwCEC2GLpGsLOy6CQf/\nfpOnJlWNC/hlhReTq1Vu9xepVI7J3tSB2vfVfiAYBhjXXYR2e664TlAlgIFxYcQE\n6YraWhLNOeAEbe54xlMREOij1o8SpnsVwW/OfuD42ZN9bz9/wpDw/YjD+ZVynBpt\n2AzrACb1GDlpOuUl3LsIQX06VpIp689aD9ooiXraMQKBgQDx+X5ecnMUBeUpJpQ7\n7wAGgxPMQkNi8gUDw4uq27FzGS3nS4ZLeH4RaRGUsFYhOlk9q0Y4tS7xUP5cTVbP\nlhrSKlRQoS2Jy+lDNbzWtFVpRTmdPC8tFZEvi8A74Q125Lwi44I5dBGBSyOBBQG\nzma6vnyVtBZ9nmpmqs63xYc4tFQKBgQDBQnIGkuzNcoyTact1D+u7/Owvk298D025\nuSa++tT0v0OyjKIsVHxUPxjfDjdi2AOuGEWl0GgP5JOP1xVoaeqcYTJ17hDCo7lP\nnzxfnzeGNQxOd7cu9Vd+WTORwAIETnzidM6grvHYUFLfSRN530+BM91wfSuEGG/2\nRFMGeh18YwKBgQCgxMqQR+xrtkr+n1JHy9Cxgu9pe/E30WNBj+/BEnyA447bKRPO\nGv1v5eY3az2ekBzw21YpoT/SN6T4gK4X+DxTvKoOdDhEXsD5kWFTiNii1a7gO3wj\ndJII1G94aKrn+b5UMfSptr89dnyW0uDXcNVSZ/Nwp5l11H0arIz6XqhUzQKBgGKo\n+i8y+KMVlIB5JP35B75rq2PKX8K0yVhEFmyu/uKHdhcDxpLc+q/Dmn3c8xeJ8a8C\nAyRYVZeveEmZYvtv/u6gjDM6OuIy1Rq5zwd978ma8VJpuWHGrEj7XuFMZXsvWn/9\nY7MSPLLSpswIsWGpSBxMjwKrU/jWxOmzDbOjycPDAoGBANi5ymyUiO92LADSUJ0O\nST0rxE6p9OQTgIe4cgcREGMxuYaE5ZV7Q+I3+Qod+ScC0a1vtH59b7LRJ81NaDyw\noTeC0x16MgOJslImScsB/ukFe2iApa/aWInX+B4U8ASSwMYt0aKUKaoaUSswZOty\nUIlm+vh+eAbUMutpx6sb9scI\n-----END PRIVATE KEY-----\n`;

// 環境変数は引き続き Netlify で設定する必要があります
// FIREBASE_CLIENT_EMAIL は adtown-ishige のものを使います
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL; 
// NEXT_PUBLIC_FIREBASE_PROJECT_ID も adtown-ishige のものを使います
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; 

const serviceAccount = {
  "type": "service_account",
  "project_id": projectId,
  "private_key": privateKey,
  "client_email": clientEmail,
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  "universe_domain": "googleapis.com"
};

// Netlify Functionsがアクセスできる場所に出力します
const outputPath = path.resolve(process.cwd(), '.netlify', 'functions', 'serviceAccountKey.json');
const outputDir = path.dirname(outputPath);

// 出力ディレクトリが存在しない場合は作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  // JSONファイルとして書き出す
  fs.writeFileSync(outputPath, JSON.stringify(serviceAccount, null, 2));
  console.log('--- Netlify Build Script: Creating Service Account Key File ---');
  console.log('Service Account Key file created at:', outputPath);
  console.log('--- End Service Account Key File Creation ---');
} catch (error) {
  console.error('--- Netlify Build Script Error: Failed to create Service Account Key File ---');
  console.error(error);
  process.exit(1); // ビルドを失敗させる
}
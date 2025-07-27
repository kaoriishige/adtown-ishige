// scripts/createServiceAccountFile.js のコード（すべてコピーして貼り付けてください）
const fs = require('fs');
const path = require('path');

// ★★★警告: これはセキュリティリスクが極めて高い方法です！本番運用しないでください。★★★
// サービスアカウントキーをBase64エンコードされた文字列リテラルとしてコード内に直接記述
// ↓↓↓ここに、ウェブツールで生成したBase64文字列（純粋な1行の文字列）が正確に埋め込まれています↓↓↓
const FIREBASE_SA_FULL_JSON_BASE64_HARDCODED = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAic3VwZXJzYXZlci1haSIsCiAgInByaXZhdGVfa2V5X2lkIjogIjNjYjQyNWRjZGQzN2Q2NjI3Mjc5Y2E4OWY4ODA3NTA3OGIwZWVlNTMiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRREx2UUxGVnJPc081dldcbjhLZldiY0srMkJldGluUGJ3NnhLV1ZkcE5KQ05nWUhlKzNhYnZJWUZXTXZsTFdRSUZuVVBuOXRWcStSTTRtYXhcbjdOODFycEMwY1FTZ3JrUmdENTNDajhQcnMySmZidWJrNUpWMTVhZGp5eFlpS2JPNUhTcUxFenhWbmdDSFp2S3VcbkNoZnE1ZkJDRkRCL0Nlcm5udExORGQ0NklWZ0VlWGluUGxreDNQVjBodDhSSUMrNnNvY2FPVDA3RHJMS0tvc2NcbnlGYWx6M09BQnVOQ2hNb2hOV0ExVU9lUmJTMEJxcTlrTEprN1NBd0M2dGVETUtsOGNOcmFXUGZDWk55Wkd0YlNcbkJXb3dIeVpEak5XY2t0TVpvQ2JCS1lNRC9GRVd2RGZFbm1oMzJPYkU2cnhTdmV4ZDJuaVBUaFl2WGZsQnRJMnpcblZob1UxeHF2QWdNQkFBRUNnZ0VBVDJDWkcwUi81UnNtU05Sak44WjB5UUVOSEpaa05GdWtuU1Q0eXVycFpOQnZcbnhtNEhsSDZiWXFycGFhVkpJMk9JZ1NsaGZadm1hMVFMK2NkVllhZGRCb2cvNnRCcW9GaUZPUC9sTDhnb2pCRDdcbjBYTURqamNIQS9qa2F6UC9LeUNqYWlMNDcweUxYVFd0V0VSamRDZlk5dzNCcFVVNmFicDEyK0ZLMHpBWmlFZ1BcblU4MDUxS1BpOEQxZ3d3a3JIdSs3eUFHNWt4VUtaZkZ5N01FcmhBWjltcVNmQjNRYWtFbUJXcjNlQ3ZKUHNFam5cbm1JVE1FVzRta1g4WVZkZzM1NXR6UUxadFVrMjlPdUdMVG5IM1FLZEJlN0thU2xkNGd3YlJPbDFGdTNoRnRLUmdcbjVTQ0dmdU04Q1lMejA5ZG5xcW5oYk54SWdNTU9IdUM3MjBIcHUrYmJXUUtCZ1FEbXczdzdRVjRMYS9BU1RnTmtcblBnVzF5R1RrNzBDa3lFeWV1TzZWemdoT1ZXbHVrY3ZoVGY2OW54ZkZEbkVqOGRId3IxNWQ1ZlZFemVaaUdySk5cbnZSZE1KRXBCZ2U2d2pHemJiN0sxeTNwV3FBWlo2UmZjc3NoaWtGUEsxVWxPdlBqTjNrejdxcGtTYm1IY0U5Y2FcbmwxU2lqaUhEdEpjZTlkV3lPY0ZlN3lyWHh3S0JnUURpQk9zN2dLaDNZbXljT05CZFlVUHNTWXhEQ0dZT0JIbW1cbk5LZzA5bXJkT204VUlQVWdMMWpZK2NKd1NtSktKN0FLVi9EQUpXR3lhVjh0QzdvaGsvNWdnN2hNRHdNMmpqMEpcblpVU2JKc0RBanhPK3lubzZJSy8wVFNOcm15ZnJ6dFRqZ1dsbjlIMHNyMkFrU2g1UzB6U01oWE1jeU4vQ013NjZcbnRid0xFbFkxMlFLQmdEREkvUmVOM3pMczg4ajY0eTZyQ2d2L1BJMUZvMVh5M25mand0UzZ4UGpDaDlLUFVobmtcbm9razJQQkUxMTJkdzlTQThBdWc0K0Z3K1owa3dPYWZEcFF3ODA5SDdoUm1mNWxlUnlxY3lTRC9QcitBTUxqWkRcbk9hZWVtb2hVQlBaM2J1WWU3QWw4YkhZQURnSTMwNDcVbFZqMFVXRU5hYkZxNlcyUFZqa2F1T1Q3QW9HQWFVMnRcbnkwMndMOTgxaHh1WlNNaDJZdkpwWFJuZW9vMUhPRDYwVitpdkpWK0NQVGlWdkdjUzJCU1ZtTWV2UDZsNkJYZXZcbmZYWnRMRGlYMVY3dlc1R2VKTTE1NGtYa1UxaTE2MWk1UENnMENnTWZTZmNBTjNEZlNjMWV3VlhLcGJ6NXh2MldcblpJNnVlMUZDVStZTWRyNWNiMVFGcTlXVEd1RzY3UmFiQS9XSklSRUNnWUJ3clRNcG5hM2tWMVNaWW0wVVBQYjRcbmNjcWJHeU5CVHIrVDdxWTU1OXR2NGJrREg2bmhQazdMckRNWmVjQVU2KzNNM2s4SW43bHh6Z2F4aWRLRHlkcHlcbmhVaVJmVFZVRDBoT2pWMm0weDAyeEF2ZTlxM3JMeVpKR2dxaHlQQ3NBQlJZMkxZcUxwRjFVWnh3a3Q1NEVzVS9cbml1eUxyZzNjR2ZBeXNXVFdjS2ZHL0E9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIgogIH0K";

async function createServiceAccountFile() {
  console.log('--- Netlify Build Script: Creating Service Account Key File ---');

  if (FIREBASE_SA_FULL_JSON_BASE64_HARDCODED === "YOUR_BASE64_ENCODED_SERVICE_ACCOUNT_JSON_HERE" || !FIREBASE_SA_FULL_JSON_BASE64_HARDCODED) {
    console.error('FIREBASE_SA_FULL_JSON_BASE64_HARDCODED にサービスアカウントキーが設定されていません。');
    process.exit(1); // ビルドを失敗させる
  }

  try {
    const serviceAccountJsonString = Buffer.from(FIREBASE_SA_FULL_JSON_BASE64_HARDCODED, 'base64').toString('utf8');
    
    // JSON文字列が有効であることを確認（念のため）
    JSON.parse(serviceAccountJsonString);

    // Netlify Functionsのルートディレクトリ（/var/task/）直下にserviceAccountKey.jsonを作成
    // このパスは、Netlify Functionsが実行時に参照するパスです。
    const functionsOutputDir = path.join(process.cwd(), '.netlify', 'functions');
    const serviceAccountKeyPath = path.join(functionsOutputDir, 'serviceAccountKey.json');
    
    // functionsディレクトリが存在しない場合は作成
    await fs.promises.mkdir(functionsOutputDir, { recursive: true });
    
    // ファイルに書き込む
    await fs.promises.writeFile(serviceAccountKeyPath, serviceAccountJsonString);

    console.log(`Service Account Key file created at: ${serviceAccountKeyPath}`);

  } catch (error) {
    console.error('Failed to create service account key file:', error);
    process.exit(1); // ビルドを失敗させる
  }
  console.log('--- End Service Account Key File Creation ---');
}

// スクリプトが直接実行された場合に実行
createServiceAccountFile();
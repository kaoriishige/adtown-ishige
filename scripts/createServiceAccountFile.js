// scripts/createServiceAccountFile.js のコード（すべてコピーして貼り付けてください）
const fs = require('fs');
const path = require('path');

// ★★★警告: これはセキュリティリスクが極めて高い方法です！本番運用しないでください。★★★
// サービスアカウントキーをBase64エンコードされた文字列リテラルとしてコード内に直接記述
// ↓↓↓ここに、ウェブツールで生成したBase64文字列（純粋な1行の文字列）が正確に埋め込まれています↓↓↓
const FIREBASE_SA_FULL_JSON_BASE64_HARDCODED = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAic3VwZXJzYXZlci1haSIsCiAgInByaXZhdGVfa2V5X2lkIjogIjk2MDdiODQzY2Y0ZmJmYTUxMjRlZThhZDcwM2QwMjQ1NzI3N2FmNzYiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRQy9raDFSN2x4a2piSmtcblpDNis5Vkg2T0M3OHdNNnFFcENqbmpMelhoMXkwVy9rSmxLbVdNTVpRNU9mTk44U0hESE1aNXdzdXVzRjV6UUNcbjF3blxuYkk2L1J3Ky9PVzlveGdlN1dRejVPYmV5N2JPOXlOS2JRcmlqamR2c0ZWd1dqUUlxUkVmWi9adlI1MBlcbnjd5L250K1NKZ0dBRXJCV25WSXJpMzVmNDg2c0g4cVR0eU8wb3hzanFEZ2JWYVF6Mi9aTXM1eWJWZVppb2hpOXJcbnZwWnEySFg1YnJ3T203anBIVms2T294azJnc2RMd0NzVm9yZXFFOWdzd1lMN1JJNkRWLy9vV016cDNhL0wrNkpcbktFaXhpbDNlMGpRUW5UVWQzYVhlWkRIODJuSHFNeTg2bmc4QmUzc2hXb3FKb1JWdlRKWlJGZnhWdUc0UTBSQTNcbk5CNTV6cUJBa01CQkFBRUNnZ0VBQW9SaXRwS3EvNWdZWHbiOGHISWFVaG5PZFRNR2Y1SFNFWjBQK3ZFVFI3NXdcblVobi9lVFNaT1pHWERTL1dCQ0xzOE42WjFzSjVRYjg1U0VaMFArV0JDTFM4TjZabTFTNkpweFJBcFg3QVJ6bEdIbUtvdlpmbnhLQlo1TW5kdDBQXG5NRVJHeFlFWDUva3JUMlFHR1hEbnRTY0E1YmRHVldlWWpYa2VjT0Y2WFBuSWc5N294emNXOGFscVZGT29XS0VZRHpcbjdrdmFxbnNocHJTTkNTNzFnb0s3QVBSSFFlTTduUUdmbktja3VHdHdkSGIyWll0aVJMYXViWGNzclFXUk53bzhcbjgwTlBpS3N0NUhmTnBJNG1XclpjRU5qdHVQZi8rcS9NQnBQMWQxMWZVQ0QzVHg2TXl0ZjdUK3NHYWxwb21iUVhcbjNpWlpqTXk5TFB2aWkyMW5FOE9WVkc5YzNaQzBpU21ZeXc2bGJ5ZGNEd0tCZ1FEcmJtcnpyVEVmalJ5U3ROeU5cbmxVK2VzMUhVY0NIL2k4UWJSbXRMbFp4OCtlRm55TmpkZW1TM1ZBTkFYUnNIN0hiVDJyakdQVnZ0Q0dvbkxBSXhcbmZHQ2tXazBldlU2WUl5U1pBV3htaGxWRUVvU0pQZFBxcjFsWE5YT3ZBSVMzRXVmL2Y4bGR3VUtwWnJKdFRWR0VcbkRYdjNBZUU1Z3JyZ2JRcUw1dVdmanVVSjR3S0JnUURxVHJteThLdUQ4Ry9VQ0NUNkcweXdLRG9HN1hCb1BJd0w\\nGjN6SHVXZlNkdzEyODc2WHRuQk84M3h3bUNuQWFDRWc2TWlsSHVkeTVWR2pjRzFVd0NteXc1V1YwTlJ5QUVQQVBcbnQ0NHN6SDVwak9rOEQ1dkhWUXVBcVRyQzQ0V2VjSFpZbHRyVFJxWWJydFE2clJrd1RkcE0vZlphWUMzZWxkMTRBTzI2XG5JajM5VmxGblN3S0JnQXM0OUQ0Z3hZVW9QdS9EeVZpRVpvUHg3cmtibUlYalVBL05RZ0F6VlRLR0o4c3RYenFRTEZcbnRzOVdYZUZQanQ1TjAwdzkvTmpXUysrSGVYZnNqUjQydzVTU0NXTVJ1eEZkZTMwZnFEOHE0QjJpbEZiZ2I3ZWNcbkxESVFCamV0V3FZdmJJZXRXN2Z3WWlFQUdlcENpSm92eVUwS3h3VTB6bVEwdWk4b2hpTWtqM0d2eEcwS0JnUUE4RGxCZEplQUdLQjRIUVdrRkNPS1RcbkNPcmNjWmZZYkpQd3dIZWtWWEtKZE1vYVVwR0lyZC9zemFqdThrUjdvdUhnSWF3WmZ1K2RLZWpCd1l2cjRXVXJcbnE0bnNyZW5zMCt4aEQ1YUZaSER6bE4xazMrR2xHK3BxSW4vZG84bWsyTlNnbHB4RHlHZUh5Rm1heXNVd1EyWGZcblNPdVRvM3Q4M3RIenJ2YUxmTE9EbEE9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIgogIH0K";

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
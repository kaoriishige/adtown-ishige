const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const appsData = require('./apps-data.json');

// 自身のFirebaseプロジェクトの情報を入力
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://minna-no-nasu-app.firebaseio.com" // 例: https://nasu-recover1-xxxxx.firebaseio.com
});

const db = admin.firestore();
const appsCollection = db.collection('apps');

const uploadApps = async () => {
  console.log('データのアップロードを開始します...');
  
  for (const app of appsData) {
    try {
      await appsCollection.add(app);
      console.log(`✅ 登録成功: ${app.name}`);
    } catch (error) {
      console.error(`❌ 登録失敗: ${app.name}`, error);
    }
  }
  
  console.log('すべてのデータのアップロードが完了しました。');
};

uploadApps();

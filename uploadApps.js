// uploadApps.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const apps = [
  {
    name: "匿名恋愛相談AI",
    description: "恋の悩みを24時間匿名で相談、既読スルーされても安心",
    imageUrl: "/images/apps/1.jpg",
    emotionCategories: ["relief", "self_discovery"],
    functionCategories: ["anonymous"]
  },
  {
    name: "人間関係ストレス診断AI",
    description: "職場・家族の人間関係を匿名で分析・対処法提案",
    imageUrl: "/images/apps/2.jpg",
    emotionCategories: ["relief", "clear_mind"],
    functionCategories: ["anonymous"]
  },
  {
    name: "お金の悩み匿名相談AI",
    description: "借金・ローン・投資など金銭問題を匿名で相談",
    imageUrl: "/images/apps/3.jpg",
    emotionCategories: ["relief", "saving"],
    functionCategories: ["anonymous"]
  },
  {
    name: "匿名副業収入診断AI",
    description: "スキルや時間に合った副業を提案",
    imageUrl: "/images/apps/4.jpg",
    emotionCategories: ["self_discovery", "skillup"],
    functionCategories: ["jobs", "anonymous"]
  },
  {
    name: "匿名メンタルヘルス自己診断AI",
    description: "うつ・不安などの心の状態をセルフチェック",
    imageUrl: "/images/apps/5.jpg",
    emotionCategories: ["relief", "healing"],
    functionCategories: ["anonymous"]
  },
  {
    name: "自己肯定感アップAI",
    description: "毎日あなたを褒めてくれる習慣化AI",
    imageUrl: "/images/apps/6.jpg",
    emotionCategories: ["healing", "self_discovery"],
    functionCategories: ["anonymous"]
  },
  {
    name: "匿名愚痴箱AI",
    description: "嫌な出来事を吐き出してスッキリ",
    imageUrl: "/images/apps/7.jpg",
    emotionCategories: ["clear_mind", "healing"],
    functionCategories: ["anonymous"]
  },
  {
    name: "恋愛体験の聞き役AI",
    description: "誰にも言えない話を匿名で打ち明けられるAI",
    imageUrl: "/images/apps/8.jpg",
    emotionCategories: ["relief", "connected"],
    functionCategories: ["anonymous"]
  },
  {
    name: "トラウマ整理サポートAI",
    description: "過去の記憶を丁寧に受け止めるAI",
    imageUrl: "/images/apps/9.jpg",
    emotionCategories: ["clear_mind", "healing"],
    functionCategories: ["anonymous"]
  },
  {
    name: "中年恋愛アドバイスAI",
    description: "40代以降の恋の悩みに寄り添うAI",
    imageUrl: "/images/apps/10.jpg",
    emotionCategories: ["relief", "connected"],
    functionCategories: ["anonymous"]
  },

  // ここに残り45件のデータを追加します（省略）

];

(async () => {
  for (const app of apps) {
    await db.collection("apps").add(app);
  }
  console.log("✅ Firestoreにアプリ55個を登録しました");
})();


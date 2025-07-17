import { useRouter } from 'next/router';

const apps = [
  // 🔧 ここに該当ジャンルのアプリを挿入してください
  "アプリA",
  "アプリB",
  "アプリC"
];

export default function GenrePage() {
  const router = useRouter();
  const genre = decodeURIComponent(router.query.genre as string || "");

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">{genre} のアプリ</h1>
      <ul className="space-y-2">
        {apps.map((app, index) => (
          <li key={index} className="bg-gray-100 p-4 rounded shadow">{app}</li>
        ))}
      </ul>
    </main>
  );
}

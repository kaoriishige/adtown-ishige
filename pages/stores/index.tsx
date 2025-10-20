import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

type Store = { id: string; name?: string; address?: string; description?: string };

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "stores"));
      setStores(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Store)));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <p>読み込み中です...</p>;
  if (!stores.length) return <p>店舗データがありません。</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">店舗一覧</h1>
      <ul className="space-y-3">
        {stores.map((s) => (
          <li key={s.id} className="border rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold">{s.name}</h2>
            {s.address && <p>{s.address}</p>}
            {s.description && <p className="text-sm text-gray-600">{s.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}




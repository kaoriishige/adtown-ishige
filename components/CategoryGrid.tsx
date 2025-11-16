import Link from "next/link";

export interface AppData {
    id: string;
    name: string;
    genre: string;
    url: string;
    isActive: boolean;
}

export interface CategoryGridProps {
    allApps: AppData[];
    selectedGenre: string;   // ← これが TS エラー修正の決定部分！！
}

export default function CategoryGrid({ allApps, selectedGenre }: CategoryGridProps) {

    const filteredApps =
        selectedGenre === "すべて"
            ? allApps
            : allApps.filter((app) => app.genre === selectedGenre);

    return (
        <div className="grid grid-cols-2 gap-3 mt-4">
            {filteredApps.map((app) => (
                <Link
                    key={app.id}
                    href={app.url}
                    className="p-4 bg-white border rounded-xl shadow hover:shadow-lg text-center"
                >
                    <p className="font-bold text-gray-800">{app.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{app.genre}</p>
                </Link>
            ))}

            {filteredApps.length === 0 && (
                <p className="col-span-2 text-center text-gray-500 py-4">
                    このジャンルのアプリはありません。
                </p>
            )}
        </div>
    );
}

// pages/jump.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function JumpPage() {
    const router = useRouter();
    const { url, name } = router.query;

    useEffect(() => {
        if (url) {
            // 1秒後に自動で飛ばす、あるいはボタンを押させる
            // これにより「履歴」にこのページが刻まれるため、戻るボタンが効くようになる
        }
    }, [url]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white">
            <h1 className="text-xl font-bold mb-4">{name}へ移動しています</h1>
            <p className="text-gray-500 mb-8 text-center text-sm">
                自動的に移動しない場合は、下のボタンを押してください。
            </p>
            <a href={url as string} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg">
                サイトを表示する
            </a>
            <button onClick={() => router.push('/home')} className="mt-8 text-gray-400 underline text-sm">
                ホームに戻る
            </button>
        </div>
    );
}
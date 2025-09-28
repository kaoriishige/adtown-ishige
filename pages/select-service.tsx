import { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/router';

// アイコン
const AdIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10v-4a3 3 0 00-3-3h-3m-1 11l6-3" /></svg>;
const RecruitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;

const SelectServicePage: NextPage = () => {
    const [userName, setUserName] = useState<string | null>(null);
    const auth = getAuth(app);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
            if (user) {
                setUserName(user.displayName);
            } else {
                router.push('/login'); // 未ログインならログインページへ
            }
        });
        return () => unsubscribe();
    }, [auth, router]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-gray-800">ようこそ、{userName || 'パートナー'}様</h1>
                <p className="mt-2 text-lg text-gray-600">利用するサービスを選択してください</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* 広告＆QRコード サービスへのリンク */}
                <Link href="/partner/dashboard" legacyBehavior>
                    <a className="group w-80 p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
                        <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center">
                            <AdIcon />
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-gray-900">みんなの那須アプリ</h2>
                        <p className="mt-1 text-gray-500">広告掲載・QRコード管理</p>
                    </a>
                </Link>

                {/* AIマッチング求人 サービスへのリンク */}
                <Link href="/recruit/dashboard" legacyBehavior>
                     <a className="group w-80 p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:-translate-y-1">
                        <div className="bg-orange-500 w-20 h-20 rounded-full flex items-center justify-center">
                            <RecruitIcon />
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-gray-900">AIマッチング求人</h2>
                        <p className="mt-1 text-gray-500">求人作成・応募者管理</p>
                    </a>
                </Link>
            </div>
        </div>
    );
};

export default SelectServicePage;
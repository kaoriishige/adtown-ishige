// components/ApplyButton.tsx (再掲)

import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../lib/firebase'; // 🚨 パスを確認
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; // 🚨 FirestoreクライアントSDK

interface ApplyButtonProps {
    jobId: string;
    companyUid: string; 
}

const ApplyButton: React.FC<ApplyButtonProps> = ({ jobId, companyUid }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [message, setMessage] = useState('');
    const [profile, setProfile] = useState<any>(null); 

    // 認証状態の取得
    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribeAuth();
    }, []);
    
    // ユーザープロフィールの取得（ユーザーUIDが確定した後）
    useEffect(() => {
        const loadProfile = async () => {
            if (user?.uid) {
                const profileSnap = await getDoc(doc(db, 'userProfiles', user.uid));
                if (profileSnap.exists()) {
                    setProfile({ uid: user.uid, ...profileSnap.data() });
                    
                    // プロフィール必須項目の簡易チェック
                    const requiredFields = ['desiredJobTypes', 'skills', 'desiredSalaryMax'];
                    const isMissing = requiredFields.some(field => 
                        !profileSnap.data()[field] || 
                        (Array.isArray(profileSnap.data()[field]) && profileSnap.data()[field].length === 0)
                    );
                    if (isMissing) {
                        setMessage("※ 応募前にプロフィールを完成させてください。");
                    }
                } else {
                    setMessage("※ 応募前にプロフィールを完成させてください。");
                }
            }
        };

        if (user) loadProfile();
        
    }, [user]);

    const handleApply = async () => {
        if (isApplying || !user) {
            setMessage('ログインが必要です。');
            return;
        }
        if (!profile || message.includes("プロフィール情報が見つかりません") || message.includes("プロフィールを完成させてください")) {
             setMessage('応募するにはプロフィール編集ページで必須情報を全て入力し、保存してください。');
             return;
        }

        setIsApplying(true);
        setMessage('');

        try {
            // AIマッチングAPI呼び出し
            const response = await fetch('/api/match', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userProfile: profile,
                    job: { id: jobId, companyUid: companyUid },
                    companyUid: companyUid,
                }),
            });
            
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || '応募処理が失敗しました。');
            }
            
            const score = data.matchScore || 'N/A';
            setMessage(`✅ 応募完了！AIマッチングスコアは ${score}点でした。`);

        } catch (error: any) {
            setMessage(`❌ 応募処理エラー: ${error.message}`);
            console.error('Apply error:', error);
        } finally {
            setIsApplying(false);
        }
    };

    const isDisabled = isApplying || !user || !profile || message.includes("プロフィールを完成させてください");

    return (
        <div>
            <button
                onClick={handleApply}
                disabled={isDisabled}
                className="w-full px-6 py-3 text-lg font-bold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 transition"
            >
                {isApplying ? <><Loader2 className="w-5 h-5 mr-2 animate-spin inline-block" /> 応募処理中...</> : 'この求人に応募する'}
            </button>
            {message && <p className={`mt-3 text-center ${message.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </div>
    );
};

export default ApplyButton;

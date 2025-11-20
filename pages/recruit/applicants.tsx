// pages/recruit/applicants.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";

// 型定義
interface ApplicantData {
  id: string;
  userId: string;
  recruitmentId: string;
  jobTitle: string;
  status: "pending" | "contact_exchanged" | "rejected";
}

interface LocalUserProfile {
  name: string;
  desiredJobTypes: string[];
  skills: string[];
}

// applicants.tsx コンポーネント
const ApplicantsPage: React.FC = () => {
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [profiles, setProfiles] = useState<Record<string, LocalUserProfile>>({});

  // Firestore から応募者データを取得
  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const q = query(collection(db, "applicants"));
        const snapshot = await getDocs(q);

        const data: ApplicantData[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ApplicantData, "id">),
        }));

        setApplicants(data);
      } catch (error) {
        console.error("Failed to fetch applicants:", error);
      }
    };

    fetchApplicants();
  }, []);

  // 応募者プロフィール取得
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, "userProfiles"));
        const snapshot = await getDocs(q);

        const data: Record<string, LocalUserProfile> = {};
        snapshot.docs.forEach((doc) => {
          data[doc.id] = doc.data() as LocalUserProfile;
        });

        setProfiles(data);
      } catch (error) {
        console.error("Failed to fetch profiles:", error);
      }
    };

    fetchProfiles();
  }, []);

  // 応募者と連絡先交換
  const handleContactExchange = async (applicant: ApplicantData) => {
    try {
      const applicantRef = doc(db, "applicants", applicant.id);
      await updateDoc(applicantRef, {
        status: "contact_exchanged",
        updatedAt: serverTimestamp(),
      });

      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicant.id
            ? { ...a, status: "contact_exchanged" }
            : a
        )
      );
    } catch (error) {
      console.error("Failed to exchange contact:", error);
    }
  };

  // 応募者拒否
  const handleRejectApplicant = async (applicant: ApplicantData) => {
    try {
      const applicantRef = doc(db, "applicants", applicant.id);
      await updateDoc(applicantRef, {
        status: "rejected",
        updatedAt: serverTimestamp(),
      });

      setApplicants((prev) => prev.filter((a) => a.id !== applicant.id));
    } catch (error) {
      console.error("Failed to reject applicant:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-100">
      <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl p-8 border border-gray-200">

        <h1 className="text-3xl font-bold mb-6 text-center">応募者一覧</h1>

        {applicants.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xl font-semibold mb-3">応募者はいません。</p>
            <p className="text-gray-500 mb-10">
              まだ応募が届いていません。しばらくお待ちください。
            </p>
            <div className="animate-bounce text-gray-400 text-5xl mb-10">📭</div>

            <Link
              href="/recruit/dashboard"
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              ダッシュボードへ戻る
            </Link>
          </div>
        ) : (
          <ul className="space-y-5">
            {applicants.map((applicant) => {
              const profile = profiles[applicant.userId];
              return (
                <li
                  key={applicant.id}
                  className="border p-5 rounded-lg shadow bg-gray-50"
                >
                  <p>
                    <strong>名前:</strong> {profile?.name || "不明"}
                  </p>
                  <p>
                    <strong>希望職種:</strong>{" "}
                    {profile?.desiredJobTypes.join(", ") || "不明"}
                  </p>
                  <p>
                    <strong>スキル:</strong>{" "}
                    {profile?.skills.join(", ") || "不明"}
                  </p>
                  <p>
                    <strong>応募職種:</strong> {applicant.jobTitle}
                  </p>
                  <p>
                    <strong>ステータス:</strong> {applicant.status}
                  </p>

                  {applicant.status === "pending" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition"
                        onClick={() => handleContactExchange(applicant)}
                      >
                        連絡先交換
                      </button>

                      <button
                        className="bg-red-600 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 transition"
                        onClick={() => handleRejectApplicant(applicant)}
                      >
                        拒否
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ApplicantsPage;






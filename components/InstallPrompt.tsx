import React from 'react';

// このコンポーネントが受け取るPropsの型を定義
interface InstallPromptProps {
  onInstall: () => void; // インストールボタンが押されたときの処理
  onDismiss: () => void; // 閉じるボタンが押されたときの処理
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200">
        <div className="flex items-center">
          <img src="/icons/icon-192x192.png" alt="アプリのアイコン" className="w-12 h-12 mr-4" />
          <div>
            <h3 className="font-bold text-gray-800">アプリをホーム画面に追加</h3>
            <p className="text-sm text-gray-600">ワンタップで簡単アクセス！</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={onDismiss}
            className="w-full px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            あとで
          </button>
          <button
            onClick={onInstall}
            className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            追加する
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
import React from 'react';
import Head from 'next/head';
// 必要に応じて、アプリ共通のナビゲーションやフッターをインポートします

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, title = 'みんなの那須アプリ' }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      
      {/* アプリ全体のコンテナ */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        
        {/* メインコンテンツエリア */}
        <main className="flex-grow">
          {children}
        </main>

        {/* 必要に応じて、
          <AppFooter /> 
          や、モバイル用の<BottomNavigation />
          などをここに追加します 
        */}
      </div>
    </>
  );
};

export default AppLayout;
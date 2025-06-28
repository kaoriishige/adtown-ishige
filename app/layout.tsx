// app/layout.tsx
export const metadata = {
  title: 'みんなの那須アプリ',
  description: 'ランディングページ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}



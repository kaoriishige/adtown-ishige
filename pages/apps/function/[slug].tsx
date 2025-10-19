// pages/apps/function/[slug].tsx
import { GetStaticPaths, GetStaticProps } from 'next'

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = ['share', 'coupon', 'fortune'] // ← Firestoreから取得でもOK
  const paths = slugs.map((slug) => ({
    params: { slug },
  }))
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string
  // Firestoreからデータを取得して渡してOK
  return {
    props: {
      slug,
    },
  }
}

export default function FunctionPage({ slug }: { slug: string }) {
  return (
    <div>
      <h1>アプリページ: {slug}</h1>
      <p>ここに詳細情報やリンクを表示します。</p>
    </div>
  )
}






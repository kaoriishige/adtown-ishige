'use client'

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../../lib/firebase';
import Link from 'next/link'

interface AppData {
  id: string
  name: string
  description?: string
  categories?: string[]
}

export default function EmotionFilteredAppsPage() {
  const router = useRouter()
  const { emotion } = router.query as { emotion: string }
  const [apps, setApps] = useState<AppData[]>([])

  useEffect(() => {
    if (!emotion) return
    const fetchApps = async () => {
      const snapshot = await getDocs(collection(db, 'apps'))
      const filtered = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as AppData))
        .filter(app => app.categories?.includes(emotion))
      setApps(filtered)
    }
    fetchApps()
  }, [emotion])

  return (
    <div style={{ padding: '2rem', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
        「{emotion}」に合うアプリ一覧
      </h1>
      {apps.length === 0 ? (
        <p>該当するアプリが見つかりませんでした。</p>
      ) : (
        <ul style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {apps.map((app) => (
            <li key={app.id} style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '1rem' }}>
              <Link href={`/apps/${app.id}`} legacyBehavior>
                <a style={{ color: '#0070f3', fontWeight: 'bold' }}>{app.name}</a>
              </Link>
              <p style={{ fontSize: '14px', color: '#666' }}>{app.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Next.js API Route: /api/run-export

export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://<YOUR_REGION>-<YOUR_PROJECT>.cloudfunctions.net/exportReferralSummariesToCSV'
    );

    if (!response.ok) {
      throw new Error('Function call failed');
    }

    const data = await response.json();
    res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'CSV出力に失敗しました' });
  }
}

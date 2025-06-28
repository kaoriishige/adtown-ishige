// Next.js API Route: /api/run-summary

export default async function handler(req, res) {
  try {
    const response = await fetch(
      'https://<YOUR_REGION>-<YOUR_PROJECT>.cloudfunctions.net/summarizeReferralRewards'
    );
    if (!response.ok) throw new Error('集計失敗');
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: '集計エラー' });
  }
}

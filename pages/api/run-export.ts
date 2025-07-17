import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch(
      'https://<YOUR_REGION>-<YOUR_PROJECT>.cloudfunctions.net/exportReferralSummariesToCSV'
    );
    const result = await response.text();
    res.status(200).send(result);
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: 'Export failed' });
  }
}



// pages/api/weather/get-forecast.ts

import { NextApiRequest, NextApiResponse } from 'next';

// 気象庁の栃木県全体（090000）の予報JSONエンドポイント
const JMA_FORECAST_URL = 'https://www.jma.go.jp/bosai/forecast/data/forecast/090000.json';
// キャッシュの有効期限（ミリ秒）：1時間
const CACHE_DURATION_MS = 60 * 60 * 1000; 
// 栃木県北部の地域名
const TARGET_AREA_NAME = '北部'; 

// 簡易的なインメモリキャッシュストア
let forecastCache: { 
  data: any; 
  timestamp: number 
} | null = null;

// エラーレスポンスの型
type ErrorResponse = {
  error: string;
  message: string;
};

// 予報データの型定義
type NasuForecast = {
  publishingOffice: string;
  reportDatetime: string;
  targetArea: string; 
  timeSeries: any[];
  tempMin: string;
  tempMax: string;
  tempUnit: string;
};


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NasuForecast | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed', message: 'このAPIはGETリクエストのみをサポートしています。' });
  }

  // 1. キャッシュの確認
  const now = Date.now();
  if (forecastCache && (now - forecastCache.timestamp < CACHE_DURATION_MS)) {
    console.log('Cache hit. Returning cached data.');
    return res.status(200).json(forecastCache.data);
  }

  // 2. 気象庁データ取得
  try {
    console.log('Cache miss or expired. Fetching new data from JMA.');
    
    const jmaRes = await fetch(JMA_FORECAST_URL, {
      // 403回避のため、適切なUser-Agentを設定
      headers: {
        'User-Agent': 'Minna-no-Nasu-App/1.0 (Contact: example@example.com)' // 必ず連絡先を記載
      }
    });

    if (!jmaRes.ok) {
      throw new Error(`JMA API returned status ${jmaRes.status}`);
    }

    const jmaData = await jmaRes.json();
    
    // 3. 栃木県北部（那須地域）のデータを安全に抽出
    
    // 配列の中から 'timeSeries' を持つオブジェクトを予報データとして探す
    const forecastData = jmaData.find((d: any) => d.timeSeries);
    // 配列の中から 'tempSeries' を持つオブジェクトを気温データとして探す
    const temperatureData = jmaData.find((d: any) => d.tempSeries);
    
    if (!forecastData || !temperatureData) {
        throw new Error('JMA data structure is invalid or missing the required timeSeries/tempSeries.');
    }

    // timeSeriesから那須地域の予報を抽出
    const targetForecast = forecastData.timeSeries.find((ts: any) => {
      // エラーログ 'reading areas' を避けるため、Optional Chainingを使用し、安全にアクセスする
      return ts.areas?.some((area: any) => area.area.name === TARGET_AREA_NAME);
    });
    
    // temperatureDataから那須地域の気温を抽出
    const targetTemp = temperatureData.tempSeries?.areas.find((area: any) => {
        return area.area.name === TARGET_AREA_NAME;
    });

    if (!targetForecast || !targetTemp) {
        // データ取得は成功したが、地域データが見つからなかった場合
        throw new Error(`Could not find forecast data for area: ${TARGET_AREA_NAME}`);
    }

    // 4. 必要なデータ構造に整形
    const processedData: NasuForecast = {
      publishingOffice: forecastData.publishingOffice,
      reportDatetime: forecastData.reportDatetime,
      targetArea: TARGET_AREA_NAME,
      timeSeries: targetForecast.areas, // 予報詳細情報
      // 最高/最低気温は tempSeries の配列から取り出す
      tempMin: targetTemp.temps?.[0] || 'N/A', 
      tempMax: targetTemp.temps?.[1] || 'N/A', 
      tempUnit: '℃',
    };

    // 5. キャッシュの更新
    forecastCache = {
      data: processedData,
      timestamp: now,
    };

    // 6. 成功レスポンス
    res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION_MS / 1000}, must-revalidate`);
    return res.status(200).json(processedData);

  } catch (error) {
    console.error('Failed to fetch or process JMA forecast:', error);
    
    // エラー時でもキャッシュがあればそれを返す（フォールバック）
    if (forecastCache) {
        console.log('Error occurred, returning stale cache as fallback.');
        return res.status(200).json(forecastCache.data);
    }

    // キャッシュがない場合はエラーを返す
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: '気象データの取得および処理中にエラーが発生しました。' 
    });
  }
}
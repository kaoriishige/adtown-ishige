// pages/api/weather/get-warnings.ts

import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { parseStringPromise } from 'xml2js'; 

// --- 定数 ---
// 気象庁の通常AtomフィードURL 
const JMA_ATOM_FEED_URL = 'https://xml.kishou.go.jp/feed/list.xml';

// 栃木県の予報区コード
const TOCHIGI_PREF_CODE = '090000'; 
// 栃木県北部の細分区域コード（那須塩原市、大田原市、那須町が含まれる）
const TOCHIGI_NORTH_AREA_CODE = '090020'; 

// 警報・注意報の電文識別子
const ALERT_TITLE_IDENTIFIER = '気象警報・注意報'; 

// キャッシュの有効期限（ミリ秒）：10分
const CACHE_DURATION_MS = 10 * 60 * 1000; 

// ★ 403回避のための推奨ヘッダー
const AXIOS_CONFIG = {
    // 適切なUser-Agentを設定することが気象庁により推奨されています
    headers: {
        'User-Agent': 'Minna-no-Nasu-App/1.0 (Contact: example@example.com)' // 適切な連絡先を記載
    }
};

// --- 型定義 ---
type WarningsCache = { 
  data: WarningsResponse; 
  timestamp: number 
};

// 簡易的なインメモリキャッシュストア
let warningsCache: WarningsCache | null = null;

type WarningItem = {
  type: string; 
  level: '警報' | '注意報' | '特別警報'; 
  dateTime: string; 
  targetArea: string; 
};

type WarningsResponse = {
  reportDatetime: string;
  items: WarningItem[];
};

type ErrorResponse = {
  error: string;
  message: string;
};

/**
 * 気象庁のAtomフィードから最新の気象警報・注意報XMLのURLを取得する
 */
async function getLatestWarningXmlUrl(): Promise<string | null> {
  // ★ 403エラー回避のため、AXIOS_CONFIGを適用
  const atomRes = await axios.get(JMA_ATOM_FEED_URL, AXIOS_CONFIG);
  const atomXml = atomRes.data;
  
  // AtomフィードXMLを解析
  const atomJson = await parseStringPromise(atomXml, { explicitArray: false });
  
  // Atomフィードのデータ構造に基づき entries を取得
  const entries = atomJson?.feed?.entry;

  if (!entries) return null;
  
  // 配列化（単一のエントリーの場合に対応）
  const entryArray = Array.isArray(entries) ? entries : [entries];

  // 最新の「気象警報・注意報」に関するエントリーを探す
  const latestWarningEntry = entryArray.find((entry: any) => {
    const title = entry.title;
    // リンクが存在し、hrefプロパティを持つか確認
    const linkHref = entry.link?.$?.href;
    
    // 発表種別が「気象警報・注意報」であり、栃木県のデータであることを確認
    return title.includes(ALERT_TITLE_IDENTIFIER) && linkHref?.includes(TOCHIGI_PREF_CODE);
  });
  
  if (latestWarningEntry && latestWarningEntry.link?.$?.href) {
    return latestWarningEntry.link.$.href;
  }

  return null;
}

/**
 * 取得した気象情報XMLを解析し、那須地域に特化した警報・注意報を抽出する
 */
async function parseWarningXml(xmlUrl: string): Promise<WarningsResponse> {
  // ★ 403エラー回避のため、AXIOS_CONFIGを適用
  const xmlRes = await axios.get(xmlUrl, AXIOS_CONFIG);
  const warningXml = xmlRes.data;
  
  // 警告XMLを解析 (explicitArray: false でオブジェクトに変換)
  const warningJson = await parseStringPromise(warningXml, { explicitArray: false });
  
  const report = warningJson.Report;
  const reportDatetime = report?.Head?.ReportDateTime || new Date().toISOString();
  const body = report?.Body?.Warning; 
  const warningItems: WarningItem[] = [];

  if (!body || !body.Item) {
      return { reportDatetime, items: [] };
  }

  // Item が単一の場合と複数の場合を考慮して配列に変換
  const items = Array.isArray(body.Item) ? body.Item : [body.Item];
    
  for (const item of items) {
    // 那須地域（北部）に関連するアイテムのみをフィルタリング
    if (item.Area?.Code === TOCHIGI_NORTH_AREA_CODE || item.Area?.Name === '栃木県北部') {
        
      const kinds = Array.isArray(item.Kind) ? item.Kind : [item.Kind];
        
      for (const kind of kinds) {
        // 発表中または継続中の警報・注意報のみを対象とする
        if (kind.KindCode && kind.KindName && (kind.Status === '発表' || kind.Status === '継続')) {
          
          let level: WarningItem['level'] = '注意報';
          if (kind.KindCode.startsWith('10')) {
              level = '警報';
          } else if (kind.KindCode.startsWith('00')) {
              level = '特別警報';
          }

          warningItems.push({
            type: kind.KindName,
            level: level,
            dateTime: reportDatetime,
            targetArea: item.Area.Name,
          });
        }
      }
    }
  }

  return { reportDatetime, items: warningItems };
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WarningsResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method Not Allowed', message: 'このAPIはGETリクエストのみをサポートしています。' });
  }

  // 1. キャッシュの確認
  const now = Date.now();
  if (warningsCache && (now - warningsCache.timestamp < CACHE_DURATION_MS)) {
    console.log('Cache hit. Returning cached warning data.');
    return res.status(200).json(warningsCache.data);
  }

  // 2. 気象庁データ取得・解析
  try {
    console.log('Cache miss or expired. Checking JMA Atom Feed.');
    
    // 最新のXML電文URLを取得
    const xmlUrl = await getLatestWarningXmlUrl();
    
    if (!xmlUrl) {
      console.log('No recent warning XML found for Tochigi.');
      // 警報がない場合は、空のリストを返す
      const noWarningData: WarningsResponse = { reportDatetime: new Date().toISOString(), items: [] };
      warningsCache = { data: noWarningData, timestamp: now };
      return res.status(200).json(noWarningData);
    }
    
    // XMLを解析し、那須地域の警報・注意報を抽出
    const processedData = await parseWarningXml(xmlUrl);

    // 3. キャッシュの更新
    warningsCache = {
      data: processedData,
      timestamp: now,
    };

    // 4. 成功レスポンス
    res.setHeader('Cache-Control', `public, max-age=${CACHE_DURATION_MS / 1000}, must-revalidate`);
    return res.status(200).json(processedData);

  } catch (error) {
    console.error('Failed to fetch or process JMA warnings:', error);
    
    // エラー時でもキャッシュがあればそれを返す（フォールバック）
    // ★ 修正済み: warningsCache を参照
    if (warningsCache) { 
        console.log('Error occurred, returning stale cache as fallback.');
        // warningsCache が null でないことを保証
        return res.status(200).json(warningsCache.data); 
    }

    // キャッシュがない場合はエラーを返す
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: '警報・注意報データの取得および処理中にエラーが発生しました。' 
    });
  }
}
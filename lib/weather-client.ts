// lib/weather-client.ts

import axios from 'axios';
import useSWR from 'swr'; // ★ useSWRフックを使用

// --- 1. APIレスポンスの型定義 ---

// pages/api/weather/get-forecast.ts のレスポンスと一致させる
export type NasuForecastItem = {
    publishingOffice: string; 
    reportDatetime: string; 
    targetArea: string; 
    timeSeries: any[]; 
    tempMin: string; 
    tempMax: string; 
    tempUnit: string;
};

// pages/api/weather/get-warnings.ts のレスポンスと一致させる
export type WarningItem = {
    type: string; 
    level: '警報' | '注意報' | '特別警報'; 
    dateTime: string; 
    targetArea: string;
};

export type WarningsResponse = {
    reportDatetime: string;
    items: WarningItem[];
};


// --- 2. SWRフェッチャー関数 ---
// SWRがAPIを呼び出すための汎用関数
const fetcher = (url: string) => axios.get(url).then(res => res.data);


// --- 3. カスタムフック ---

/**
 * 栃木県北部（那須地域）の日常天気予報データを取得し、キャッシュ管理するフック
 */
export function useNasuForecast() {
    // APIルートをSWRのキーとして使用
    const { data, error, isLoading } = useSWR<NasuForecastItem>('/api/weather/get-forecast', fetcher);
    
    return {
        forecast: data,
        isLoading,
        isError: error
    };
}

/**
 * 栃木県北部（那須地域）の最新の気象警報・注意報を取得し、キャッシュ管理するフック
 */
export function useNasuWarnings() {
    const { data, error, isLoading } = useSWR<WarningsResponse>('/api/weather/get-warnings', fetcher, {
        // 警報・注意報は少し頻繁にチェックするため、5分ごとに自動更新
        refreshInterval: 5 * 60 * 1000, 
    });
    
    return {
        warnings: data,
        isLoading,
        isError: error
    };
}
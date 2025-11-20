// pages/weather.tsx

import React from 'react'; // ★ Reactを明示的にインポート (エラー 2686 解消)
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
    RiArrowLeftLine,
    RiSunLine, 
    RiCloudLine, 
    RiCloudyLine, 
    RiRainyLine, 
    RiThermometerLine,
    RiAlarmWarningLine,
} from 'react-icons/ri';

// ★ 天気クライアントからフックと型をインポート (エラー 2307 が解消されている前提)
import { useNasuForecast, useNasuWarnings, WarningItem } from '@/lib/weather-client'; 

// 天気概況のテキストに応じて適切なアイコンを返す関数
const getWeatherIcon = (weatherText: string) => {
    if (weatherText.includes('晴')) return RiSunLine;
    if (weatherText.includes('曇')) return RiCloudyLine;
    if (weatherText.includes('雨')) return RiRainyLine;
    if (weatherText.includes('雪') || weatherText.includes('雷')) return RiCloudLine; 
    return RiCloudLine;
};

// メインコンポーネント
const WeatherPage: NextPage = () => {
    const router = useRouter();
    
    // カスタムフックで天気予報と警報を取得
    const { forecast, isLoading: isForecastLoading, isError: isForecastError } = useNasuForecast();
    const { warnings, isLoading: isWarningLoading, isError: isWarningError } = useNasuWarnings();

    const isLoading = isForecastLoading || isWarningLoading;
    const isError = isForecastError || isWarningError;

    // --- ローディング/エラー表示 ---
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">天気情報を読み込み中...</p>
            </div>
        );
    }

    if (isError || !forecast) {
        return (
            <div className="min-h-screen p-4 bg-gray-100">
                <div className="p-6 bg-red-100 rounded-xl shadow-md text-red-700">
                    <p className="font-bold flex items-center">
                        <RiAlarmWarningLine className="mr-2" />
                        天気情報の取得に失敗しました。
                    </p>
                    <p className="text-sm mt-2">気象庁のデータ更新中か、サーバーに問題が発生しています。</p>
                </div>
            </div>
        );
    }

    // --- データ抽出 ---
    const todayForecastArea = forecast.timeSeries?.[0]?.areas?.[0];
    const tomorrowForecastArea = forecast.timeSeries?.[0]?.areas?.[1];

    const weatherToday = todayForecastArea?.weathers?.[0] || '---';
    const weatherTomorrow = tomorrowForecastArea?.weathers?.[0] || '---';

    const tempMax = forecast.tempMax !== 'N/A' ? `${forecast.tempMax}℃` : '--';
    const tempMin = forecast.tempMin !== 'N/A' ? `${forecast.tempMin}℃` : '--';
    
    // 警報・注意報のフィルタリング
    const allWarnings = warnings?.items || [];
    // ★ 'item' に WarningItem 型を適用 (エラー 7006 解消)
    const activeWarnings = allWarnings.filter((item: WarningItem) => item.level === '警報' || item.level === '特別警報');
    // ★ 'item' に WarningItem 型を適用 (エラー 7006 解消)
    const activeAdvisories = allWarnings.filter((item: WarningItem) => item.level === '注意報');

    return (
        <>
            <Head>
                <title>那須地域の天気 - みんなの那須アプリ</title>
            </Head>

            <div className="bg-gray-100 min-h-screen">
                <header className="p-4 bg-white shadow-sm sticky top-0 z-10">
                    <button onClick={() => router.back()} className="flex items-center text-blue-600 font-semibold">
                        <RiArrowLeftLine className="mr-2" />
                        ホームへ戻る
                    </button>
                    <h1 className="text-2xl font-bold text-center mt-2">那須地域の天気と防災情報</h1>
                </header>

                <main className="p-4 space-y-6">
                    {/* 1. 🚨 警報・特別警報セクション */}
                    {activeWarnings.length > 0 && (
                        <section className="bg-red-700 text-white p-4 rounded-xl shadow-lg animate-pulse">
                            <div className="flex items-center mb-2">
                                <RiAlarmWarningLine className="text-3xl mr-3 flex-shrink-0" />
                                <h2 className="text-xl font-bold">【特別警報/警報】発表中！</h2>
                            </div>
                            {/* ★ 'w' に WarningItem 型を適用 (エラー 7006 解消) */}
                            <p className="text-lg font-semibold">{activeWarnings.map((w: WarningItem) => w.type).join('、')}</p>
                            <p className="text-sm mt-1 opacity-90">厳重な警戒が必要です。</p>
                        </section>
                    )}

                    {/* 2. 🌤️ 今日の予報サマリー */}
                    <section className="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">那須地域（{forecast.targetArea}）の予報</h2>
                        
                        <div className="flex justify-around items-center text-center">
                            {/* 今日 */}
                            <div className="flex flex-col items-center">
                                <p className="text-sm font-semibold text-gray-600">今日</p>
                                {/* ★ React.createElement のエラーは 'import React from "react"' で解消済み */}
                                {React.createElement(getWeatherIcon(weatherToday), { className: "text-5xl text-yellow-500 my-1" })}
                                <p className="font-bold text-lg">{weatherToday}</p>
                            </div>

                            {/* 明日 */}
                            <div className="flex flex-col items-center">
                                <p className="text-sm font-semibold text-gray-600">明日</p>
                                {React.createElement(getWeatherIcon(weatherTomorrow), { className: "text-5xl text-sky-500 my-1" })}
                                <p className="font-bold text-lg">{weatherTomorrow}</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t text-center">
                             <p className="text-base text-gray-600">
                                発表: {forecast.reportDatetime.substring(0, 16).replace('T', ' ')}
                            </p>
                            <div className="flex justify-center space-x-6 mt-2">
                                <p className="text-xl font-bold text-red-600 flex items-center">
                                    <RiThermometerLine className="mr-1" /> 最高: {tempMax}
                                </p>
                                <p className="text-xl font-bold text-blue-600 flex items-center">
                                    <RiThermometerLine className="mr-1" /> 最低: {tempMin}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 3. ⚠️ 注意報セクション */}
                    {activeAdvisories.length > 0 && (
                        <section className="bg-yellow-50 p-4 rounded-xl shadow-md border border-yellow-400">
                            <h2 className="text-lg font-bold text-yellow-800 flex items-center mb-2">
                                <RiAlarmWarningLine className="mr-2" /> 注意報
                            </h2>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                                {/* ★ 'adv' に WarningItem 型を適用 (エラー 7006 解消) */}
                                {activeAdvisories.map((adv: WarningItem, index) => (
                                    <li key={index}>**{adv.type}**</li>
                                ))}
                            </ul>
                            <p className="text-xs mt-3 text-gray-600">
                                今後の気象状況にご注意ください。
                            </p>
                        </section>
                    )}

                    {/* 4. 詳細な時間帯予報 (オプション) */}
                    <section className="p-4 text-center text-gray-500 border-t">
                        <p>詳細な週間予報や降水確率のデータは順次追加予定です。</p>
                    </section>
                </main>
            </div>
        </>
    );
};

export default WeatherPage;
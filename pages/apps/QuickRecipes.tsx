import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { ArrowLeft, Utensils, Clock, Zap, Soup } from 'lucide-react';
import Link from 'next/link';

// --- レシピデータの定義（実際のデータベースやAPIからのデータに相当） ---
const QUICK_RECIPES_DATA = [
    { 
        id: 1, 
        title: "レンジで簡単！鶏むね肉のねぎ塩だれ", 
        time: 8, 
        category: 'レンジ', 
        description: '疲れていてもすぐできる！鶏むね肉がしっとり柔らかい超速メインディッシュ。', 
        ingredients: ['鶏むね肉', 'ねぎ', 'ごま油'] 
    },
    { 
        id: 2, 
        title: "ワンパンで完成！ケチャップパスタ", 
        time: 10, 
        category: 'ワンパン', 
        description: '鍋もフライパンも一つでOK。洗い物激減の定番パスタ。', 
        ingredients: ['パスタ', 'ケチャップ', 'ソーセージ', '玉ねぎ'] 
    },
    { 
        id: 3, 
        title: "5分でできる！キャベツとツナの無限和え", 
        time: 5, 
        category: '和え物', 
        description: '火を使わずレンジ加熱のみ。あと一品に困らない最強副菜。', 
        ingredients: ['キャベツ', 'ツナ缶', 'ポン酢'] 
    },
    { 
        id: 4, 
        title: "牛肉とピーマンのオイスター炒め (5分)", 
        time: 5, 
        category: '炒め物', 
        description: 'フライパン一つで強火で一気に仕上げる、ご飯が進む味。', 
        ingredients: ['牛肉薄切り', 'ピーマン', 'オイスターソース'] 
    },
    { 
        id: 5, 
        title: "電子レンジで作る本格キーマカレー", 
        time: 10, 
        category: 'レンジ', 
        description: '煮込み不要！耐熱ボウルで全て完結する驚きのキーマカレー。', 
        ingredients: ['合いびき肉', '玉ねぎ', 'カレールウ', '水'] 
    },
];

const CATEGORY_TABS = [
    { name: 'すべて', icon: Utensils },
    { name: 'レンジ', icon: Zap },
    { name: 'ワンパン', icon: Soup },
    { name: '炒め物', icon: Clock },
    { name: '和え物', icon: Clock },
];

// --- コンポーネント本体 ---
export default function QuickRecipesPage() {
    const [selectedCategory, setSelectedCategory] = useState('すべて');
    const [searchTerm, setSearchTerm] = useState('');

    // レシピの絞り込みと検索ロジック
    const filteredRecipes = useMemo(() => {
        return QUICK_RECIPES_DATA.filter(recipe => {
            // カテゴリによるフィルタリング
            const categoryMatch = selectedCategory === 'すべて' || recipe.category === selectedCategory;
            
            // 検索語句によるフィルタリング
            const searchMatch = searchTerm === '' || 
                              recipe.title.includes(searchTerm) || 
                              recipe.description.includes(searchTerm) ||
                              recipe.ingredients.some(ing => ing.includes(searchTerm));
            
            return categoryMatch && searchMatch;
        });
    }, [selectedCategory, searchTerm]); // selectedCategoryまたはsearchTermが変わるたびに再計算

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Head>
                <title>10分で完成！時短レシピ</title>
            </Head>

            <header className="bg-white shadow-md sticky top-0 z-10 p-4 border-b border-gray-200">
                <div className="max-w-xl mx-auto flex items-center gap-3">
                    <Link href="/categories" legacyBehavior>
                        <a className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </a>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-orange-500" />
                        10分で完成！時短レシピ
                    </h1>
                </div>
            </header>

            <main className="max-w-xl mx-auto p-4 sm:p-6">
                
                {/* 検索とカテゴリ選択エリア */}
                <section className="mb-6">
                    <input 
                        type="text"
                        placeholder="食材名やレシピ名を検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />

                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
                        {CATEGORY_TABS.map(tab => (
                            <button
                                key={tab.name}
                                onClick={() => setSelectedCategory(tab.name)}
                                className={`p-2 px-4 rounded-full text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                                    selectedCategory === tab.name 
                                        ? 'bg-orange-500 text-white shadow-lg'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* レシピ一覧エリア */}
                <section>
                    <h2 className="text-lg font-bold text-gray-700 mb-3">
                        {selectedCategory === 'すべて' ? '全' : selectedCategory}レシピ ({filteredRecipes.length}件)
                    </h2>

                    <div className="space-y-4">
                        {filteredRecipes.length > 0 ? (
                            filteredRecipes.map(recipe => (
                                <div 
                                    key={recipe.id} 
                                    className="bg-white p-4 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-xl text-gray-900">{recipe.title}</h3>
                                        <span className="flex items-center text-sm font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {recipe.time}分
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>
                                    
                                    <div className="flex flex-wrap gap-1">
                                        {recipe.ingredients.map(ing => (
                                            <span 
                                                key={ing}
                                                className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"
                                            >
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={() => alert(`「${recipe.title}」の調理手順を表示（実装は省略）`)}
                                        className="mt-3 w-full bg-blue-500 text-white p-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                                    >
                                        手順を見る
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                                <p className="text-gray-500">お探しのレシピは見つかりませんでした。</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

// VS Codeでのファイル名は QuickRecipesPage.tsx (または QuickRecipes.tsx) を推奨します。
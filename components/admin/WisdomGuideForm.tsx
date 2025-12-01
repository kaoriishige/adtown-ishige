import React, { useState } from 'react';

interface GuideData {
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
}

interface WisdomGuideFormProps {
  initialData: GuideData | null;
  onSubmit: (data: GuideData) => void;
}

const WisdomGuideForm: React.FC<WisdomGuideFormProps> = ({ initialData, onSubmit }) => {
  const [data, setData] = useState<GuideData>(
    initialData || {
      title: '',
      content: '',
      category: '未分類',
      isPublished: false,
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // e.target を ElementType にアサーション
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name, value, type } = target;
    
    // ⭐ 修正箇所: typeが'checkbox'の場合、targetをHTMLInputElementに断定し、checkedを参照
    if (type === 'checkbox') {
        const checkboxTarget = target as HTMLInputElement; // HTMLInputElementに断定
        setData(prev => ({ ...prev, [name]: checkboxTarget.checked }));
    } else {
        setData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-xl space-y-6">
      
      {/* タイトル */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
        <input
          type="text"
          id="title"
          name="title"
          value={data.title}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* カテゴリ */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
        <select
          id="category"
          name="category"
          value={data.category}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="未分類">未分類</option>
          <option value="節約">節約</option>
          <option value="地域情報">地域情報</option>
          {/* 必要に応じてカテゴリを追加 */}
        </select>
      </div>

      {/* コンテンツ (マークダウンエディタなどを導入するとより良い) */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">コンテンツ (HTML/Markdown可)</label>
        <textarea
          id="content"
          name="content"
          value={data.content}
          onChange={handleChange}
          rows={10}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      </div>

      {/* 公開ステータス */}
      <div className="flex items-center">
        <input
          id="isPublished"
          name="isPublished"
          type="checkbox"
          checked={data.isPublished}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-900">
          この記事を公開する
        </label>
      </div>

      {/* 送信ボタン */}
      <div className="pt-4">
        <button
          type="submit"
          className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
        >
          記事を保存
        </button>
      </div>
    </form>
  );
};

export default WisdomGuideForm;
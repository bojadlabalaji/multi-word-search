import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';

interface SearchItem {
  term: string;
  color: string;
}

function App() {
  const [searches, setSearches] = useState<SearchItem[]>([{ term: '', color: '#ffeb3b' }]);
  const [sampleText, setSampleText] = useState(`
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
  `);

  const addSearchRow = () => {
    setSearches([...searches, { term: '', color: '#ffeb3b' }]);
  };

  const removeSearchRow = (index: number) => {
    if (searches.length > 1) {
      setSearches(searches.filter((_, i) => i !== index));
    }
  };

  const updateSearch = (index: number, field: keyof SearchItem, value: string) => {
    const newSearches = [...searches];
    newSearches[index] = { ...newSearches[index], [field]: value };
    setSearches(newSearches);
  };

  const highlightText = (text: string, searches: SearchItem[]) => {
    let result = text;
    searches.forEach(({ term, color }) => {
      if (!term.trim()) return;
      
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, `<mark style="background-color: ${color}">$1</mark>`);
    });
    return result;
  };

  const processedText = highlightText(sampleText, searches);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Extension UI */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="w-6 h-6" />
              Multi-Search Highlighter Tester
            </h1>
            <button
              onClick={() => setSearches([{ term: '', color: '#ffeb3b' }])}
              className="text-gray-600 hover:text-gray-800"
              title="Clear all searches"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {searches.map((search, index) => (
              <div key={index} className="flex gap-4 items-center">
                <input
                  type="text"
                  value={search.term}
                  onChange={(e) => updateSearch(index, 'term', e.target.value)}
                  placeholder="Enter search term"
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="color"
                  value={search.color}
                  onChange={(e) => updateSearch(index, 'color', e.target.value)}
                  className="w-12 h-10 rounded-md cursor-pointer"
                />
                <button
                  onClick={() => removeSearchRow(index)}
                  className="text-red-500 hover:text-red-700 p-2"
                  disabled={searches.length === 1}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addSearchRow}
            className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-5 h-5" />
            Add Search Term
          </button>
        </div>

        {/* Test Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Content</h2>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="w-full h-32 p-4 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter text to search through..."
          />
          <div 
            className="prose max-w-none p-4 border rounded-md bg-gray-50"
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
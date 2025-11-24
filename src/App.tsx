import { useState } from 'react';
import { Sparkles, Copy, Download, RefreshCw, Share2 } from 'lucide-react';

interface CampaignVariant {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  imageUrl: string | null;
  status: 'generating' | 'completed' | 'error';
  error?: string;
}

interface ChefData {
  brandName: string;
  cuisineType: string;
  starDish: string;
  city: string;
  menuHighlights: string;
}

function App() {
  const [chefData, setChefData] = useState<ChefData>({
    brandName: '',
    cuisineType: '',
    starDish: '',
    city: '',
    menuHighlights: ''
  });
  const [variants, setVariants] = useState<CampaignVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleGenerate = async () => {
    if (!chefData.brandName || !chefData.cuisineType) {
      setError('Please fill in at least brand name and cuisine type');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setVariants([]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/super-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          chefData,
          imageModel: 'recraft'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate campaign');
      }

      const data = await response.json();
      setVariants(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'New Spirit, serif' }}>
            Marketing Campaign Generator
          </h1>
          <p className="text-lg text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Generate stunning social media campaigns for your home restaurant
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'New Spirit, serif' }}>
            Tell us about your brand
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name *
              </label>
              <input
                type="text"
                value={chefData.brandName}
                onChange={(e) => setChefData({ ...chefData, brandName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Mama's Kitchen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Type *
              </label>
              <input
                type="text"
                value={chefData.cuisineType}
                onChange={(e) => setChefData({ ...chefData, cuisineType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Italian, Mexican, Thai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Star Dish
              </label>
              <input
                type="text"
                value={chefData.starDish}
                onChange={(e) => setChefData({ ...chefData, starDish: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Truffle Pasta"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Region
              </label>
              <input
                type="text"
                value={chefData.city}
                onChange={(e) => setChefData({ ...chefData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Amsterdam"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Menu Highlights
            </label>
            <textarea
              value={chefData.menuHighlights}
              onChange={(e) => setChefData({ ...chefData, menuHighlights: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Fresh pasta, organic vegetables, family recipes..."
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-[#F47A42] hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating campaigns...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Campaign Ideas</span>
              </>
            )}
          </button>
        </div>

        {/* Campaign Variants */}
        {variants.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'New Spirit, serif' }}>
              Your Campaign Ideas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {variants.map((variant) => (
                <div key={variant.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {variant.status === 'generating' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-[#F47A42] animate-spin" />
                      </div>
                    )}
                    {variant.status === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <p className="text-red-600 text-center text-sm">{variant.error}</p>
                      </div>
                    )}
                    {variant.status === 'completed' && variant.imageUrl && (
                      <>
                        <img
                          src={variant.imageUrl}
                          alt={variant.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => downloadImage(variant.imageUrl!, `${variant.title}.png`)}
                          className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-colors"
                        >
                          <Download className="w-5 h-5 text-gray-700" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'New Spirit, serif' }}>
                      {variant.title}
                    </h3>

                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Caption</label>
                        <button
                          onClick={() => copyToClipboard(variant.caption)}
                          className="text-[#F47A42] hover:text-orange-600 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {variant.caption}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <label className="text-sm font-medium text-gray-700">Hashtags</label>
                        <button
                          onClick={() => copyToClipboard(variant.hashtags.join(' '))}
                          className="text-[#F47A42] hover:text-orange-600 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-[#F47A42] flex flex-wrap gap-1">
                        {variant.hashtags.map((tag, i) => (
                          <span key={i}>{tag}</span>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Post to Social Media Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#F47A42] hover:bg-orange-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Share2 className="w-5 h-5" />
                <span>Post to Social Media</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="mb-4">
                <Share2 className="w-16 h-16 text-[#F47A42] mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'New Spirit, serif' }}>
                Coming Soon!
              </h3>
              <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                We're working hard on direct social media posting. Stay tuned for this exciting feature!
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="bg-[#F47A42] hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

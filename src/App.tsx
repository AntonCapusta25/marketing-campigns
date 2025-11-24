import { useState } from 'react';
import { Sparkles, Copy, Download, RefreshCw, Share2, Edit2, X, Type } from 'lucide-react';

interface CampaignVariant {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  imageUrl: string | null;
  status: 'generating' | 'completed' | 'error';
  error?: string;
}

interface ImagePreferences {
  textPosition: string;
  primaryColor: string;
  atmosphere: string;
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

  // New state for preferences and editing
  const [imagePreferences, setImagePreferences] = useState<ImagePreferences>({
    textPosition: 'center',
    primaryColor: '',
    atmosphere: ''
  });
  const [editingVariant, setEditingVariant] = useState<CampaignVariant | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Text Editor State
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textBlocks, setTextBlocks] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [editorImage, setEditorImage] = useState<string | null>(null);
  const [editingTextIndex, setEditingTextIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');

  const handleScanImage = async (imageUrl: string) => {
    setEditorImage(imageUrl);
    setIsScanning(true);
    setShowTextEditor(true);
    setTextBlocks([]);

    try {
      // Call Python backend
      const response = await fetch('http://localhost:8000/scan-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl })
      });

      if (!response.ok) throw new Error('Failed to scan image');

      const data = await response.json();
      setTextBlocks(data.text_blocks);
    } catch (err) {
      console.error(err);
      setError("Failed to scan image. Make sure the Python backend is running on port 8000.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleEditClick = (variant: CampaignVariant) => {
    setEditingVariant(variant);
    setEditPrompt('');
  };

  const handleSubmitEdit = async () => {
    if (!editingVariant || !editPrompt) return;

    setIsEditing(true);
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
          action: 'edit',
          image: editingVariant.imageUrl,
          editPrompt
        })
      });

      if (!response.ok) throw new Error('Failed to edit image');

      const data = await response.json();

      // Update the variant with the new image
      setVariants(variants.map(v =>
        v.id === editingVariant.id ? { ...v, imageUrl: data.imageUrl } : v
      ));
      setEditingVariant(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image');
    } finally {
      setIsEditing(false);
    }
  };

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
          imagePreferences,
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

          {/* Image Preferences */}
          <div className="mb-8 border-t border-gray-100 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'New Spirit, serif' }}>
              Image Style Preferences (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Position
                </label>
                <select
                  value={imagePreferences.textPosition}
                  onChange={(e) => setImagePreferences({ ...imagePreferences, textPosition: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="no text">No Text</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <input
                  type="text"
                  value={imagePreferences.primaryColor}
                  onChange={(e) => setImagePreferences({ ...imagePreferences, primaryColor: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Pastel Pink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atmosphere
                </label>
                <input
                  type="text"
                  value={imagePreferences.atmosphere}
                  onChange={(e) => setImagePreferences({ ...imagePreferences, atmosphere: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Minimalist, Cozy"
                />
              </div>
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
                        <button
                          onClick={() => handleEditClick(variant)}
                          className="absolute top-4 left-4 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-colors"
                          title="Edit Image with AI"
                        >
                          <Edit2 className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleScanImage(variant.imageUrl!)}
                          className="absolute top-4 left-16 bg-white/90 hover:bg-white p-2 rounded-lg shadow-lg transition-colors"
                          title="Text Editor (Python Backend)"
                        >
                          <Type className="w-5 h-5 text-gray-700" />
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

      {/* Edit Modal */}
      {editingVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setEditingVariant(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'New Spirit, serif' }}>
              Edit Image
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                <img
                  src={editingVariant.imageUrl!}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How should we change this image?
                </label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
                  placeholder="e.g., Make the background darker, add more garnish..."
                />
                <button
                  onClick={handleSubmitEdit}
                  disabled={isEditing || !editPrompt}
                  className="w-full bg-[#F47A42] hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isEditing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate New Version</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Modal */}
      {showTextEditor && editorImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 relative h-[90vh] flex flex-col">
            <button
              onClick={() => setShowTextEditor(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'New Spirit, serif' }}>
              Text Editor
            </h3>

            <div className="flex-1 relative bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <div className="relative inline-block">
                <img
                  src={editorImage}
                  alt="Editor"
                  className="max-h-[70vh] object-contain"
                  id="editor-image"
                />

                {/* Text Overlays */}
                {!isScanning && textBlocks.map((block, i) => {
                  const xs = block.box.map((p: any) => p[0]);
                  const ys = block.box.map((p: any) => p[1]);
                  const minX = Math.min(...xs);
                  const minY = Math.min(...ys);
                  const width = Math.max(...xs) - minX;
                  const height = Math.max(...ys) - minY;

                  const isEditing = editingTextIndex === i;

                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${minX}px`,
                        top: `${minY}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        border: isEditing ? '3px solid #F47A42' : '2px solid #F47A42',
                        backgroundColor: isEditing ? 'rgba(244, 122, 66, 0.4)' : 'rgba(244, 122, 66, 0.2)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                      onClick={() => {
                        setEditingTextIndex(i);
                        setEditedText(block.text);
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const newBlocks = [...textBlocks];
                              newBlocks[i] = { ...newBlocks[i], text: editedText };
                              setTextBlocks(newBlocks);
                              setEditingTextIndex(null);
                            } else if (e.key === 'Escape') {
                              setEditingTextIndex(null);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full px-2 py-1 text-sm border-0 bg-white rounded shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          style={{ fontSize: `${Math.min(height / 2, 16)}px` }}
                        />
                      ) : (
                        <span
                          className="text-xs font-semibold text-orange-700 text-center"
                          style={{ fontSize: `${Math.min(height / 3, 12)}px` }}
                        >
                          {block.text}
                        </span>
                      )}
                    </div>
                  );
                })}

                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4" />
                      <p className="text-lg font-semibold">Scanning for text...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500 text-center">
                Click on any text box to edit. Press <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> to save or <kbd className="px-2 py-1 bg-gray-100 rounded">Esc</kbd> to cancel.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => {
                    // Generate edit prompt from changed text
                    const changes = textBlocks
                      .map((block, i) => `Change "${textBlocks[i].text}" to "${block.text}"`)
                      .join(', ');

                    if (changes) {
                      alert('Text editing complete! Use the AI Edit feature to regenerate the image with your changes.');
                    }
                  }}
                  className="px-4 py-2 bg-[#F47A42] hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Apply Changes
                </button>
                <button
                  onClick={() => setShowTextEditor(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

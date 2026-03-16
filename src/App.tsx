/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Loader2, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thickness, setThickness] = useState(5); // 1-10 scale
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getThicknessDescription = (val: number) => {
    if (val <= 3) return "very thin and delicate lines";
    if (val <= 7) return "medium thickness lines";
    return "bold and thick outlines";
  };

  const convertToColoringPage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const thicknessDesc = getThicknessDescription(thickness);
      
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          thicknessDesc,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert image');
      }

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to convert image. Please try a different photo or check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    link.download = 'coloring-page.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-[#141414]/10 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-serif italic font-medium tracking-tight">Coloring Page Creator</h1>
          </div>
          {image && (
            <button 
              onClick={reset}
              className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"
              title="Start Over"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full max-w-xl aspect-video border-2 border-dashed border-[#141414]/20 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#5A5A40] hover:bg-white transition-all duration-300 overflow-hidden"
              >
                <div className="p-6 bg-[#F5F5F0] rounded-full group-hover:scale-110 transition-transform duration-300">
                  <Upload size={32} className="text-[#5A5A40]" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium">Drop your photo here</p>
                  <p className="text-sm text-[#141414]/50">or click to browse from your device</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="mt-8 text-sm text-[#141414]/40 italic">
                Best results with clear subjects and simple backgrounds
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {/* Original Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-widest text-[#141414]/50 font-semibold">Original Photo</h2>
                </div>
                <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-sm border border-[#141414]/5">
                  <img 
                    src={image} 
                    alt="Original" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Thickness Control */}
                <div className="p-6 bg-white rounded-3xl border border-[#141414]/5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/50">Outline Thickness</label>
                    <span className="text-xs font-mono bg-[#F5F5F0] px-2 py-1 rounded text-[#5A5A40]">
                      {thickness <= 3 ? 'Thin' : thickness <= 7 ? 'Medium' : 'Thick'}
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={thickness}
                    onChange={(e) => setThickness(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#F5F5F0] rounded-lg appearance-none cursor-pointer accent-[#5A5A40]"
                  />
                  
                  <div className="flex justify-between gap-2">
                    {[2, 5, 9].map((val) => (
                      <button
                        key={val}
                        onClick={() => setThickness(val)}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
                          (val === 2 && thickness <= 3) || 
                          (val === 5 && thickness > 3 && thickness <= 7) || 
                          (val === 9 && thickness > 7)
                            ? 'bg-[#5A5A40] text-white shadow-md'
                            : 'bg-[#F5F5F0] text-[#141414]/60 hover:bg-[#EBEBE5]'
                        }`}
                      >
                        {val === 2 ? 'Thin' : val === 5 ? 'Medium' : 'Thick'}
                      </button>
                    ))}
                  </div>
                </div>

                {!loading && (
                  <button
                    onClick={convertToColoringPage}
                    className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-[#4A4A35] transition-colors shadow-lg active:scale-[0.98]"
                  >
                    <RefreshCw size={20} className={result ? "rotate-180" : ""} />
                    {result ? 'Update Thickness' : 'Convert to Coloring Page'}
                  </button>
                )}
              </div>

              {/* Result Image */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase tracking-widest text-[#141414]/50 font-semibold">Coloring Page</h2>
                  {result && (
                    <button 
                      onClick={downloadResult}
                      className="flex items-center gap-2 text-xs font-bold text-[#5A5A40] hover:underline"
                    >
                      <Download size={14} />
                      DOWNLOAD
                    </button>
                  )}
                </div>
                <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-sm border border-[#141414]/5 flex items-center justify-center relative">
                  {loading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={40} className="animate-spin text-[#5A5A40]" />
                      <p className="text-sm font-medium animate-pulse">AI is tracing your photo...</p>
                    </div>
                  ) : result ? (
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={result} 
                      alt="Coloring Page" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <ImageIcon size={48} className="mx-auto text-[#141414]/10 mb-4" />
                      <p className="text-sm text-[#141414]/30 italic">Click convert to see the magic</p>
                    </div>
                  )}
                </div>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-[#141414]/5">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs text-[#141414]/30 uppercase tracking-[0.2em]">
            Powered by Gemini AI • Created for creativity by sachin adi
          </p>
        </div>
      </footer>
    </div>
  );
}

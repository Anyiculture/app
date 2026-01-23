import React, { useState } from 'react';
import { aiService } from '../../../services/aiService';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useToast } from '../../ui/Toast';
import { supabase } from '../../../lib/supabase';
import { Sparkles, Link as LinkIcon, CheckCircle, Loader2, Braces, FolderUp } from 'lucide-react';
import { AdminPageHeader } from '../ui/AdminPageHeader';

type ContentType = 'job' | 'event' | 'marketplace' | 'education' | 'post' | 'au-pair';

export function AIContentImporter() {
  const { showToast } = useToast();
  
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [imageStr, setImageStr] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [contentType, setContentType] = useState<ContentType>('job');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showJson, setShowJson] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url && !text && !imageStr) {
      showToast('error', 'Please provide a URL, text, or image');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await aiService.analyzeContent({
        url,
        text,
        image: imageStr,
        type: contentType,
        instructions
      });
      setResult(data);
      showToast('success', 'Content analyzed successfully!');
    } catch (error: any) {
      console.error(error);
      showToast('error', error.message || 'Failed to analyze content. Please check the URL or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!result) return;
    setPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let table = '';
      let payload = { ...result };
      
      // Default common fields
      payload.status = 'active'; 
      payload.created_at = new Date().toISOString();

      switch (contentType) {
        case 'job':
          table = 'jobs';
          payload.poster_id = user.id;
          payload.status = 'active'; 
          break;
        case 'event':
          table = 'events';
          payload.organizer_id = user.id;
          payload.status = 'published';
          break;
        case 'marketplace':
          table = 'marketplace_items';
          payload.seller_id = user.id;
          payload.status = 'active';
          break;
        case 'education':
          table = 'education_resources';
          payload.creator_id = user.id;
          payload.status = 'active';
          break;
        case 'post':
          table = 'community_posts';
          payload.author_id = user.id;
          break;
        case 'au-pair':
             table = 'au_pair_profiles';
             payload.user_id = user.id; 
             payload.status = 'active';
             break;
      }
      
      const { error } = await supabase.from(table).insert([payload]);

      if (error) {
          console.error('Supabase Insert Error:', error);
          if (error.message.includes('column') || error.message.includes('violates foreign key constraint')) {
               throw new Error(`Database Schema Mismatch: ${error.message}. Please edit the JSON.`);
          }
          throw error;
      }

      showToast('success', `${contentType.toUpperCase()} created successfully!`);
      setResult(null);
      setUrl('');
      setText('');
      setInstructions('');
      setImageStr('');
    } catch (error: any) {
      console.error('Publish Error:', error);
      showToast('error', error.message || 'Failed to publish content');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="AI Content Ingestion" 
        description="Automatically generate listings from URLs or text descriptions."
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleAnalyze} className="space-y-6">
            
            {/* Content Type Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                <div className="flex flex-wrap gap-2">
                {(['job', 'event', 'marketplace', 'education', 'post', 'au-pair'] as ContentType[]).map((type) => (
                    <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        contentType === type 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    >
                    {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </button>
                ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Source</label>
                   
                   <div className="space-y-4">
                     {/* URL Input */}
                     <div className="relative">
                       <LinkIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                       <Input 
                         value={url}
                         onChange={(e) => setUrl(e.target.value)}
                         placeholder="https://example.com/listing..."
                         className="pl-10"
                       />
                       <p className="text-xs text-gray-500 mt-1">Paste a link to scrape content.</p>
                     </div>

                     <div className="text-center text-xs text-gray-400 font-medium">- OR -</div>

                     {/* Image Input */}
                     <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setImageStr(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                        />
                        {imageStr && (
                          <div className="mt-2 relative group w-fit">
                            <img src={imageStr} alt="Preview" className="h-20 w-auto rounded border border-gray-200 object-cover" />
                            <button 
                              type="button"
                              onClick={() => setImageStr('')}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity pb-1 w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">Upload a screenshot (e.g. of a LinkedIn post).</p>
                     </div>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Custom Instructions (Optional)</label>
                   <Input 
                       value={instructions}
                       onChange={(e) => setInstructions(e.target.value)}
                       placeholder="e.g. 'Set salary to 50k', 'Make it strict requirements'..."
                   />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Raw Text or Notes</label>
                 <textarea 
                     className="w-full h-32 p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y text-sm"
                     placeholder="Paste job description, event details, or rough notes here..."
                     value={text} 
                     onChange={(e) => setText(e.target.value)}
                   />
            </div>

            <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  disabled={loading || (!url && !text && !imageStr)}
                  className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> 
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Preview
                    </>
                  )}
                </Button>
            </div>
          </form>
      </div>

      {result && (
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="text-green-500 h-5 w-5" />
                    Generated Result
                </h3>
                <div className="flex gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowJson(!showJson)}
                        className="text-gray-600"
                    >
                        <Braces className="h-4 w-4 mr-1" />
                        {showJson ? 'View Fields' : 'View JSON'}
                    </Button>
                </div>
             </div>
             
             <div className="p-6">
                {showJson ? (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-xs font-mono">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                        {Object.entries(result).map(([key, value]) => {
                             if (typeof value === 'object' && value !== null && !Array.isArray(value)) return null; // Simple rendering
                             return (
                               <div key={key} className="border-b border-gray-100 pb-2">
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    {key.replace(/_/g, ' ')}
                                  </label>
                                  <div className="text-sm text-gray-900 break-words">
                                    {Array.isArray(value) ? (
                                        <div className="flex flex-wrap gap-1">
                                            {value.map((v: any, i: number) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {String(v)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        String(value)
                                    )}
                                  </div>
                               </div>
                             );
                        })}
                    </div>
                )}

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                     <Button 
                         variant="outline" 
                         onClick={() => setResult(null)}
                       >
                         Discard & Try Again
                       </Button>
                       <Button 
                         className="bg-green-600 hover:bg-green-700 text-white"
                         onClick={handlePublish}
                         disabled={publishing}
                       >
                         {publishing ? (
                           <Loader2 className="animate-spin mr-2 h-4 w-4" />
                         ) : (
                           <FolderUp className="mr-2 h-4 w-4" />
                         )}
                         Publish to Database
                       </Button>
                </div>
             </div>
         </div>
      )}
    </div>
  );
}

import { supabase } from '../lib/supabase';

const PUTER_SCRIPT_SRC = 'https://js.puter.com/v2/';
let puterScriptPromise: Promise<void> | null = null;

const waitForPuter = () =>
  new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();

    const checkReady = () => {
      if (window.puter?.ai?.txt2img) {
        resolve();
        return;
      }

      if (Date.now() - startedAt > 10000) {
        reject(new Error('Puter.js failed to initialize'));
        return;
      }

      window.setTimeout(checkReady, 100);
    };

    checkReady();
  });

const ensurePuterLoaded = async () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Puter.js is only available in the browser');
  }

  if (window.puter?.ai?.txt2img) {
    return;
  }

  if (!puterScriptPromise) {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${PUTER_SCRIPT_SRC}"]`);

    if (existingScript) {
      puterScriptPromise = waitForPuter().catch((error) => {
        puterScriptPromise = null;
        throw error;
      });
    } else {
      puterScriptPromise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PUTER_SCRIPT_SRC;
        script.async = true;
        script.dataset.puterSdk = 'true';

        script.addEventListener('load', () => {
          void waitForPuter().then(resolve).catch(reject);
        }, { once: true });

        script.addEventListener('error', () => {
          reject(new Error('Failed to load Puter.js'));
        }, { once: true });

        document.head.appendChild(script);
      }).catch((error) => {
        puterScriptPromise = null;
        throw error;
      });
    }
  }

  await puterScriptPromise;
};

export interface AIAnalysisRequest {
  url?: string;
  text?: string;
  image?: string;
  type: 'job' | 'event' | 'marketplace' | 'education' | 'post' | 'au-pair' | 'jobs' | 'events';
  instructions?: string;
}

export interface GenerateContentParams {
  contentType: 'marketplace' | 'education' | 'jobs' | 'events';
  category?: string;
  programType?: string;
  jobType?: string;
  eventType?: string;
  sourceText?: string; // Added for parsing user input
  preferences?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    language?: 'en' | 'zh';
  };
}

export interface GenerateImagesParams {
  prompt: string;
  count?: number;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  style?: 'realistic' | 'professional' | 'premium';
}

export interface GeneratedContent {
  title: string;
  description: string;
  suggested_price?: number;
  eligibility_requirements?: string;
  academic_requirements?: string;
  tags?: string[];
}

export interface GeneratedImage {
  url: string;
  description: string;
  prompt: string;
}

export const aiService = {
  async analyzeContent(request: AIAnalysisRequest) {
    const { data, error } = await supabase.functions.invoke('analyze-content', {
      body: request,
    });

    if (error) {
      console.error('AI Analysis Error:', error);
      throw error;
    }

    return data;
  },

  async generateContent(params: GenerateContentParams): Promise<GeneratedContent> {
    const { data, error } = await supabase.functions.invoke('generate-content', {
      body: params,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to generate content');

    return data.content;
  },

  async generateImages(params: GenerateImagesParams): Promise<GeneratedImage[]> {
    try {
      await ensurePuterLoaded();
      const puter = window.puter;

      if (!puter?.ai?.txt2img) {
        throw new Error('Puter.js not loaded');
      }

      // Default to DALL-E 3 HD for best quality as requested
      const model = 'dall-e-3';
      const quality = 'hd';
      
      const images: GeneratedImage[] = [];
      const count = params.count || 1;

      // Generate images sequentially
      for (let i = 0; i < count; i++) {
        const imageElement = await puter.ai.txt2img(params.prompt, { model, quality });
        
        // The imageElement returned is an HTMLImageElement with a src blob/url
        if (imageElement && imageElement.src) {
          images.push({
            url: imageElement.src,
            description: params.prompt, // Puter doesn't return a description, use prompt
            prompt: params.prompt
          });
        }
      }

      return images;
    } catch (error: any) {
      console.error('Puter.js Generation Error:', error);
      throw new Error(error.message || 'Failed to generate images with Puter.js');
    }
  },

  async generateListingWithImages(params: GenerateContentParams): Promise<{
    content: GeneratedContent;
    images: GeneratedImage[];
  }> {
    // Step 1: Generate text content first
    const content = await this.generateContent(params);

    // Step 2: Generate matching images based on the content
    const imagePrompt = `${content.title}. ${content.description.substring(0, 200)}`;
    const images = await this.generateImages({
      prompt: imagePrompt,
      count: 3,
      aspectRatio: '4:3',
      style: 'professional',
    });

    return { content, images };
  },

  async scrapeUrl(url: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('scrape-url', {
      body: { url },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Failed to scrape URL');

    return data.data;
  },
};

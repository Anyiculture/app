// @ts-nocheck - Deno runtime types (Edge Function)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ScrapeRequest {
  url: string;
  contentType?: 'marketplace' | 'education' | 'jobs' | 'events';
}

Deno.serve(async (req: Request) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: supabaseKey },
    });

    if (!userResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const user = await userResponse.json();
    
    if (user.user_metadata?.role !== 'admin' && user.app_metadata?.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const { url, contentType }: ScrapeRequest = await req.json();

    // Validate URL
    if (!url || !url.startsWith('http')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Block localhost and private IPs
    const urlObj = new URL(url);
    if (urlObj.hostname === 'localhost' || urlObj.hostname.startsWith('127.') || urlObj.hostname.startsWith('192.168.')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot scrape local URLs' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    console.log('Scraping URL:', url);

    // Fetch the page
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AnYiculture/1.0; +https://anyiculture.com)',
      },
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch URL: ${pageResponse.status}`);
    }

    const html = await pageResponse.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Extract text content
    const title = doc.querySelector('title')?.textContent || 
                  doc.querySelector('h1')?.textContent || 
                  'Untitled';
    
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                        doc.querySelector('p')?.textContent ||
                        '';

    // Extract all images
    const imgElements = doc.querySelectorAll('img');
    const imageUrls: string[] = [];
    
    for (const img of imgElements) {
      const src = img.getAttribute('src');
      if (src) {
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(src, url).href;
        // Skip tiny images, tracking pixels, etc.
        const width = img.getAttribute('width');
        const height = img.getAttribute('height');
        if (width && height && (parseInt(width) < 100 || parseInt(height) < 100)) {
          continue;
        }
        imageUrls.push(absoluteUrl);
      }
    }

    console.log(`Found ${imageUrls.length} images`);

    // Download and re-host images to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const rehostedImages: string[] = [];
    const maxImages = 5;

    for (let i = 0; i < Math.min(imageUrls.length, maxImages); i++) {
      try {
        const imageUrl = imageUrls[i];
        console.log(`Downloading image ${i + 1}: ${imageUrl}`);
        
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) continue;

        const blob = await imageResponse.blob();
        
        // Check size (max 10MB)
        if (blob.size > 10 * 1024 * 1024) {
          console.log(`Skipping large image: ${blob.size} bytes`);
          continue;
        }

        // Determine file extension
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.split('/')[1] || 'jpg';
        
        // Generate unique filename
        const fileName = `scraped/${Date.now()}-${i}.${ext}`;
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('ai-generated-images')
          .upload(fileName, blob, { contentType });

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('ai-generated-images')
          .getPublicUrl(fileName);

        rehostedImages.push(publicUrl);
        console.log(`Uploaded image ${i + 1}: ${publicUrl}`);
      } catch (err) {
        console.error(`Failed to process image ${i + 1}:`, err);
      }
    }

    // Extract additional metadata
    const metadata: any = {
      title: title.trim(),
      description: description.trim(),
      images: rehostedImages,
      originalUrl: url,
      scrapedAt: new Date().toISOString(),
    };

    // Try to extract structured data
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      try {
        const data = JSON.parse(script.textContent || '{}');
        if (data['@type']) {
          metadata.structuredData = data;
        }
      } catch (e) {
        // Ignore invalid JSON-LD
      }
    }

    console.log('Scraping complete:', metadata);

    return new Response(
      JSON.stringify({
        success: true,
        data: metadata,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to scrape URL'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

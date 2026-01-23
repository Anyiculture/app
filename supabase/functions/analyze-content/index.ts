// @ts-nocheck - Deno runtime types (Edge Function)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, type, instructions, text, image } = await req.json();

    // 1. Get Content from URL or Text
    let contentToAnalyze = text || "";
    let scrapedImages: string[] = [];

    if (url && !contentToAnalyze) {
      console.log(`Fetching URL: ${url}`);
      try {
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Scrape Images
        $('img').each((_: number, el: any) => {
           const src = $(el).attr('src');
           if (src && (src.startsWith('http') || src.startsWith('//'))) {
               const fullSrc = src.startsWith('//') ? 'https:' + src : src;
               scrapedImages.push(fullSrc);
           }
        });
        scrapedImages = scrapedImages.slice(0, 8);
        
        $('script').remove(); $('style').remove(); $('nav').remove(); $('footer').remove(); $('[hidden]').remove();
        contentToAnalyze = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 15000);
      } catch (scrapeError: any) {
        console.error('Scraping error:', scrapeError);
        return new Response(JSON.stringify({ error: `Failed to scrape URL: ${scrapeError.message}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (!contentToAnalyze && !image) {
       return new Response(JSON.stringify({ error: 'No content to analyze provided.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Prepare Detailed Schemas
    // ... [schemas skipped for brevity, keeping file intact] ...
    // Note: I will only replace the surrounding logic to avoid massive file write if possible, 
    // but the schemas block is huge.
    // I will use replace_file_content on the TARGETED areas only.
    
    // Changing strategy: I'll do two replaces. One for Cheerio loop, one for Messages definition.


    // 2. Prepare Detailed Schemas
    const schemas: Record<string, string> = {
      'job': `
        fill all this:
        title: string;
        company_name?: string;
        description: string;
        job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
        location_city?: string;
        location_province?: string;
        location_country?: string;
        salary_min?: number;
        salary_max?: number;
        salary_currency: string;
        salary_period?: string;
        category_id?: string;
        remote_type?: 'on_site' | 'remote' | 'hybrid';
        experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
        education_required?: string;
        skills_required: string[];
        benefits: string[];
        application_email?: string;
        application_url?: string;
        application_deadline?: string;
        image_urls?: string[];
      `,
      'event': `
        fill all this:
        title: string;
        title_zh?: string;
        description: string;
        description_zh?: string;
        category: string;
        event_type: 'in_person' | 'online' | 'hybrid';
        start_date: string (ISO);
        end_date?: string (ISO);
        timezone?: string;
        location_city?: string;
        location_address?: string;
        location_venue?: string;
        online_link?: string;
        price?: number;
        currency?: string;
        organizer_name?: string;
        tags?: string[];
        requirements?: string;
        contact_email?: string;
        contact_phone?: string;
        external_link?: string;
        capacity?: number;
        registration_deadline?: string;
        image_urls: string[]; 
      `,
      'marketplace': `
        fill all this:
        title: string;
        title_zh?: string;
        description: string;
        description_zh?: string;
        price: number;
        currency: string;
        negotiable?: boolean;
        category: string;
        subcategory?: string;
        condition: string;
        brand?: string;
        model?: string;
        color?: string;
        size?: string;
        dimensions?: string;
        weight?: string;
        material?: string;
        quantity_available?: number;
        location_city: string;
        location_province?: string;
        location_area?: string;
        meetup_location?: string;
        contact_options?: string[];
        contact_wechat?: string;
        contact_email?: string;
        contact_phone?: string;
        images: string[];
      `,
      'education': `
        fill all this:
        title: string;
        title_zh?: string;
        description: string;
        description_zh?: string;
        program_type: string;
        education_level?: string;
        type: string;
        level: string;
        language: string;
        duration_value?: number;
        duration_unit?: string;
        schedule_type?: string;
        delivery_mode?: string;
        tuition_fee?: number;
        currency?: string;
        scholarship_amount?: number;
        financial_aid_available?: boolean;
        institution_name?: string;
        institution_country?: string;
        institution_city?: string;
        institution_website?: string;
        start_date?: string;
        application_deadline?: string;
        eligibility_requirements?: string;
        academic_requirements?: string;
        documents_required?: string[];
        tags?: string[];
        contact_email?: string;
        external_url?: string;
        images?: string[];
      `,
      'au-pair': `
        fill all this:
        first_name: string;
        last_name: string;
        display_name: string;
        age?: number;
        nationality?: string;
        current_country?: string;
        current_city?: string;
        languages: any;
        education_level?: string;
        field_of_study?: string;
        childcare_experience_years: number;
        age_groups_worked: string[];
        skills: string[];
        interests?: string[];
        preferred_countries: string[];
        preferred_cities: string[];
        available_from?: string;
        duration_months?: number;
        bio?: string;
        dietary_restrictions?: string;
        smoker: boolean;
        has_tattoos: boolean;
        gender?: string;
        profile_photos?: string[];
      `
    };

    const targetSchema = schemas[type as string] || "Extract all possible fields as JSON.";

    const systemPrompt = `You are an AI content extractor. 
    You must extract structured JSON data from the provided content (text and/or image) to populate a database record.
    
    TARGET JSON STRUCTURE (Typescript Interface):
    ${targetSchema}
    
    INSTRUCTIONS:
    1. EXTRACT strict JSON matching the fields above.
    2. INFER missing fields if reasonable (e.g. currency from symbol, city from context, or detail from the image).
    3. Auto-translate: If content is Chinese, fill *_zh fields. If English, fill normal fields. If mix, fill both.
    4. For arrays (skills, tags), extract list items.
    5. IMAGES: If an image is provided, extract ALL details visible in the screenshot (including text, prices, dates, etc.).
    6. Return ONLY valid JSON.
    
    User Instructions: ${instructions || "Be thorough."}
    
    ${scrapedImages.length > 0 ? `FOUND IMAGE URLS from URL scan: ${JSON.stringify(scrapedImages)}` : ''}`;

    // 3. Prepare prompt for Gemini
    let prompt = systemPrompt + "\n\n" + (contentToAnalyze || "Please analyze this image and extract the details.");

    // 4. Call Gemini API
    const geminiPayload: any = {
      contents: [{
        parts: image 
          ? [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: image.split(',')[1] || image } }
            ]
          : [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload)
      }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API failed: ${response.status} ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawContent) throw new Error("No content returned from AI.");

    // Parse JSON
    const jsonStr = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

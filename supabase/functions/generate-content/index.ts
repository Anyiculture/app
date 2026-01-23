import { createClient } from 'jsr:@supabase/supabase-js@2';

const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

interface GenerateContentRequest {
  contentType: 'marketplace' | 'education' | 'jobs' | 'events';
  category?: string;
  programType?: string;
  jobType?: string;
  eventType?: string;
  scrapedData?: {
    title?: string;
    description?: string;
    images?: string[];
    structuredData?: any;
  };
  preferences?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    language?: 'en' | 'zh';
  };
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
    // Check for missing keys
    const missingKeys = [];
    if (!SUPABASE_URL) missingKeys.push('SUPABASE_URL');
    if (!SUPABASE_ANON_KEY) missingKeys.push('SUPABASE_ANON_KEY');
    
    if (missingKeys.length > 0) {
      console.error(`Missing Supabase configuration keys: ${missingKeys.join(', ')}`);
      throw new Error(`Server configuration error: Missing database keys (${missingKeys.join(', ')})`);
    }

    if (!GOOGLE_AI_API_KEY) {
      console.error('Missing Google AI API Key');
      throw new Error('Server configuration error: AI service not configured (GOOGLE_AI_API_KEY)');
    }

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    // Initialize Supabase clients
    // client for auth check (scoped to user token)
    const supabaseClient = createClient(
      SUPABASE_URL, 
      SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Validate token by getting user
    // Explicitly passing the token is safer in edge runtime environment
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - Invalid token', details: userError }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }
    
    // Check admin table for role
    
    // Verify admin role via simple email check (Radically Simple)
    // This bypasses the need for admin_roles table and extra permissions
    const email = user.email || '';
    const isAdmin = email.endsWith('@anyiculture.com') || 
                   email === 'admin@anyiculture.com' ||
                   user.user_metadata?.role === 'admin' ||
                   user.app_metadata?.role === 'admin';

    if (!isAdmin) {
         return new Response(
          JSON.stringify({ success: false, error: 'Forbidden - Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
    }

    if (!GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key not configured');
    }

    const { contentType, category, programType, jobType, eventType, scrapedData, preferences = {} }: GenerateContentRequest = await req.json();

    // Build comprehensive prompt based on content type
    let prompt = '';
    let responseFormat = '';
    
    if (contentType === 'marketplace') {
      responseFormat = `{
  "title": "string (catchy, clear, SEO-friendly, max 60 chars)",
  "title_zh": "string (Chinese translation)",
  "description": "string (detailed, professional, 200-300 words)",  
  "description_zh": "string (Chinese translation)",
  "suggested_price": number,
  "condition": "string (new|like_new|excellent|good|fair)",
  "brand": "string (if applicable)",
  "model": "string (if applicable)",
  "color": "string (if applicable)",
  "size": "string (if applicable)",
  "material": "string (if applicable)",
  "tags": ["string", "string", "string"] (3-5 relevant tags)
}`;

      prompt = `You are an expert marketplace listing creator. Generate a professional, compelling listing for a ${category || 'product'} item.

REQUIREMENTS:
- Title: Catchy, clear, includes key details (brand, model, condition). Max 60 characters.
- Title_zh: Accurate Chinese translation of the English title
- Description: Detailed, professional, highlight:
  * Key features and benefits
  * Condition details
  * Specifications
  * What's included
  * Why it's a great deal
  Length: 200-300 words
- Description_zh: Accurate Chinese translation of the English description
- Suggested_price: Realistic market value in CNY (¥)
- Condition: Be honest and accurate (new, like_new, excellent, good, fair)
- Brand/Model: Include if this is a branded item
- Physical attributes: color, size, material if relevant
- Tags: 3-5 relevant keywords for discoverability

Tone: ${preferences.tone || 'Professional and trustworthy'}
Language quality: ${preferences.language === 'zh' ? 'Native Chinese with English translation' : 'Native English with Chinese translation'}

IMPORTANT: Return ONLY valid JSON in this exact format:
${responseFormat}`;

    } else if (contentType === 'education') {
      responseFormat = `{
  "title": "string (clear, academic, descriptive, max 80 chars)",
  "title_zh": "string (Chinese translation)",
  "description": "string (comprehensive, 300-400 words)",
  "description_zh": "string (Chinese translation)",
  "program_type": "string (language_course|degree_program|certificate|workshop)",
  "level": "string (beginner|intermediate|advanced|professional)",
  "language": "string (en|zh|bilingual)",
  "duration_value": number,
  "duration_unit": "string (weeks|months|years)",
  "tuition_fee": number,
  "institution_name": "string (professional institution name)",
  "institution_city": "string (city in China)",
  "eligibility_requirements": "string (who can apply)",
  "academic_requirements": "string (education level needed)",
  "tags": ["string", "string", "string"] (3-5 relevant tags)
}`;

      prompt = `You are an expert education program designer. Create a comprehensive, professional program listing for a ${programType || 'educational program'}.

REQUIREMENTS:
- Title: Clear, academic, descriptive. Max 80 characters. Include program type and level.
- Title_zh: Accurate Chinese translation
- Description: Comprehensive overview (300-400 words) covering:
  * Program overview and objectives
  * Curriculum highlights
  * Learning outcomes
  * Teaching methodology
  * Career/academic benefits
  * What makes this program unique
- Description_zh: Accurate Chinese translation
- Program_type: Select from: language_course, degree_program, certificate_program, workshop, training_program
- Level: Specify difficulty: beginner, intermediate, advanced, professional
- Language: Instruction language: en, zh, or bilingual
- Duration: Realistic timeframe (e.g., 12 weeks, 6 months, 2 years)
- Tuition_fee: Realistic cost in CNY (¥)
- Institution_name: Create a believable professional institution name
- Institution_city: Major city in China (Beijing, Shanghai, Shenzhen, Guangzhou, etc.)
- Eligibility_requirements: Who can apply (age, background, etc.)
- Academic_requirements: Education level needed (high school diploma, bachelor's degree, etc.)
- Tags: 3-5 relevant keywords

Tone: ${preferences.tone || 'Professional and academic'}
Language quality: ${preferences.language === 'zh' ? 'Native Chinese with English translation' : 'Native English with Chinese translation'}

IMPORTANT: Return ONLY valid JSON in this exact format:
${responseFormat}`;
    } else if (contentType === 'jobs') {
      responseFormat = `{
  "title": "string (clear job title, max 80 chars)",
  "company_name": "string (company name)",
  "description": "string (detailed job description, 300-500 words)",
  "job_type": "string (full_time|part_time|contract|internship|freelance)",
  "location": "string (full location)",
  "location_city": "string (major city in China)",
  "salary_min": number,
  "salary_max": number,
  "remote_type": "string (on_site|remote|hybrid)",
  "experience_level": "string (entry|mid|senior|executive)",
  "education_required": "string (education requirements)",
  "skills_required": ["string", "string", "string"],
  "benefits": ["string", "string", "string"],
  "application_deadline": "string (ISO date, 30 days from now)",
  "tags": ["string", "string", "string"]
}`;

      prompt = `You are an expert job recruiter. Create a comprehensive, professional job listing for a ${category || 'position'}.

REQUIREMENTS:
- Title: Clear role title. Max 80 characters.
- Company_name: Professional company name
- Description: Detailed job description (300-500 words) including:
  * Role overview and responsibilities
  * Day-to-day tasks
  * Team structure
  * Growth opportunities
  * Company culture
- Job_type: full_time, part_time, contract, internship, or freelance
- Location: Full location string (e.g., "Beijing, China")
- Location_city: Major city in China
- Salary_min and Salary_max: Realistic range in CNY (¥) per year
- Remote_type: on_site, remote, or hybrid
- Experience_level: entry, mid, senior, or executive
- Education_required: Minimum education needed
- Skills_required: 5-8 key technical/professional skills
- Benefits: 3-5 attractive benefits (health insurance, flexible hours, etc.)
- Application_deadline: ISO date string, 30 days from today
- Tags: 3-5 relevant keywords

Tone: ${preferences.tone || 'Professional and engaging'}
Language: ${preferences.language === 'zh' ? 'Chinese' : 'English'}

IMPORTANT: Return ONLY valid JSON in this exact format:
${responseFormat}`;

    } else if (contentType === 'events') {
      responseFormat = `{
  "title": "string (engaging event title, max 80 chars)",
  "title_zh": "string (Chinese translation)",
  "description": "string (comprehensive event description, 250-400 words)",
  "description_zh": "string (Chinese translation)",
  "category": "string (networking|workshop|conference|cultural|social)",
  "event_type": "string (in_person|online|hybrid)",
  "start_date": "string (ISO datetime)",
  "location_city": "string (city in China)",
  "location_venue": "string (venue name)",
  "online_link": "string (if online/hybrid)",
  "capacity": number,
  "price": number,
  "registration_deadline": "string (ISO date)",
  "tags": ["string", "string", "string"],
  "requirements": "string (attendance requirements)"
}`;

      prompt = `You are an expert event organizer. Create a compelling, professional event listing for ${category || 'an event'}.

REQUIREMENTS:
- Title: Engaging, clear. Max 80 characters.
- Title_zh: Accurate Chinese translation
- Description: Comprehensive overview (250-400 words) covering:
  * Event purpose and goals
  * What attendees will learn/experience
  * Agenda highlights
  * Who should attend
  * Networking opportunities
  * Special features/speakers
- Description_zh: Accurate Chinese translation
- Category: networking, workshop, conference, cultural, or social
- Event_type: in_person, online, or hybrid
- Start_date: Realistic future date (ISO datetime format)
- Location_city: Major city in China (Beijing, Shanghai, etc.)
- Location_venue: Professional venue name
- Online_link: If online or hybrid (e.g., Zoom link placeholder)
- Capacity: Realistic number (50-500)
- Price: 0 for free events, or reasonable CNY amount
- Registration_deadline: ISO date string, before start date
- Tags: 3-5 relevant keywords
- Requirements: Who can attend, prerequisites if any

Tone: ${preferences.tone || 'Engaging and professional'}
Language quality: ${preferences.language === 'zh' ? 'Native Chinese with English translation' : 'Native English with Chinese translation'}

IMPORTANT: Return ONLY valid JSON in this exact format:
${responseFormat}`;
    }

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Google AI API Error:', errorData);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from generated text
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse generated content');
    }

    const generatedContent = JSON.parse(jsonMatch[0]);


  } catch (error: any) {
    console.error('Error generating content:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate content',
        details: error.stack || JSON.stringify(error)
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

// @ts-nocheck
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
  sourceText?: string; // User manual input
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

    const reqBody: GenerateContentRequest = await req.json();
    const { contentType, category, programType, jobType, eventType, scrapedData, preferences = {} } = reqBody;

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

      // KNOWLEDGE BASE: Chinese University Scholarship Program
      const SCHOLARSHIP_CONTEXT = `
{
  "program_details": {
    "name": "Chinese University Scholarship Program",
    "currency": "RMB",
    "special_notes": [
      "Registration fee (300 RMB) is non-refundable and paid upon reporting to school.",
      "Accommodation is paid by semester or academic year.",
      "Dorm rooms include bathroom, furniture, bedding, AC, fridge, network ports.",
      "Shared kitchen and laundry on each floor."
    ]
  },
  "eligibility": {
    "age_range": { "min": 18, "max": 35 },
    "restricted_countries": [
      "Islamic Republic of Afghanistan", "Islamic Republic of Pakistan", "State of Palestine",
      "Syrian Arab Republic", "People's Republic of Bangladesh", "Republic of Yemen",
      "Republic of Iraq", "Islamic Republic of Iran", "The Democratic Republic of the Congo"
    ],
    "policy_checks": {
      "accepts_minors": false,
      "accepts_former_china_students": true,
      "current_location_restriction": "None (Unlimited)"
    }
  },
  "academic_requirements": {
    "minimum_score_percentage": 60,
    "english_proficiency": {
      "accepted_tests": { "TOEFL": "80 or TOEFL iBT B2 level or above", "IELTS": "5.5" },
      "exemptions": ["Native English speaker", "Official language of country is English", "High school or university education was in English"]
    },
    "required_documents": [
      "Passport-sized Photo", "Passport ID Page", "Academic Transcripts", "Highest Degree Diploma",
      "Foreigner Physical Examination Form", "Non-criminal Record", "English Language Proficiency Certificate",
      "Application Form", "Study Plan", "Two Letters of Recommendation", "Self-introduction Video"
    ]
  },
  "financial_structure": {
    "scholarship_coverage": {
      "tuition": { "original_fee_per_year": 25000.00, "fee_after_scholarship": 0.00, "status": "Fully Covered" },
      "accommodation": { "type": "Double room", "original_fee_per_year": 5400.00, "fee_after_scholarship": 0.00, "status": "Fully Covered", "excludes": "Electricity" }
    },
    "student_liability_fees_rmb": {
      "insurance_fee_per_year": 800.00,
      "university_registration_fee": 300.00,
      "application_fee_non_refundable": 1000.00,
      "agent_service_fee_0_star": 5100.00
    }
  }
}
      `;
      // Intelligent prompt: Use sourceText + Knowledge Base
      let sourceContext = '';
      if (scrapedData?.structuredData) {
        sourceContext = `SOURCE DATA: ${JSON.stringify(scrapedData.structuredData)}`;
      } else if (reqBody.sourceText) {
        sourceContext = `USER INPUT TEXT: "${reqBody.sourceText}"`;
      }

      prompt = `You are an expert education program data parser and content creator.
      
      CONTEXT:
      You have access to the "Chinese University Scholarship Program" details below. 
      If the user input seems relevant to this scholarship (mentions scholarship, China, free tuition, etc.), USE THE FACTS from this context to fill in the fields (fees, requirements, etc.) accurately.
      
      KNOWLEDGE BASE:
      ${SCHOLARSHIP_CONTEXT}

      ${sourceContext ? `
      TASK:
      1. Analyze the USER INPUT TEXT or Source Data above.
      2. Extract relevant details (program name, duration, field of study).
      3. Map them to the JSON fields.
      4. If a piece of info is missing in the input but present in the KNOWLEDGE BASE (like fees, eligibility), FILL IT IN automatically from the Knowledge Base.
      5. Specifically:
         - "tuition_fee": If scholarship applies, set to 0 or the fee structure in KB.
         - "eligibility_requirements": Merge input requirements with KB requirements.
      ` : `
      TASK:
      Create a comprehensive, professional program listing for a ${programType || 'educational program'}. Use the KNOWLEDGE BASE to ensure fees and policies are realistic for a Chinese context.
      `}

      REQUIREMENTS:
      - Title: Clear, academic, descriptive. Max 80 characters.
      - Description: Professional, convincing, structured. 
        * IMPORTANT: If the user input contains details that do not fit into specific fields (e.g., specific amenities, unique rules), ADD them to this description. Do not ignore them.
      - Return ONLY valid JSON.

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

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (err) {
    console.error('Error generating content:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: (err as any).message || 'Failed to generate content',
        details: (err as any).stack || JSON.stringify(err)
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

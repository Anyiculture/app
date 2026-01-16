export interface JobSubcategory {
  id: string;
  name_en: string;
  name_zh: string;
  skills: string[];
}

export interface JobCategory {
  id: string;
  name_en: string;
  name_zh: string;
  subcategories: JobSubcategory[];
}

export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: 'technology',
    name_en: 'Technology & IT',
    name_zh: '互联网/IT/电子/通信',
    subcategories: [
      {
        id: 'backend_dev',
        name_en: 'Backend Developer',
        name_zh: '后端开发',
        skills: ['Java', 'Python', 'Node.js', 'Go', 'C++', 'PHP', 'Ruby', 'C#', '.NET', 'Spring Boot', 'Django', 'Flask', 'Express.js', 'NestJS', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'Microservices', 'RESTful API', 'GraphQL', 'Kafka', 'RabbitMQ']
      },
      {
        id: 'frontend_dev',
        name_en: 'Frontend Developer',
        name_zh: '前端开发',
        skills: ['HTML5', 'CSS3', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Tailwind CSS', 'Sass/Less', 'Webhook', 'Redux', 'Zustand', 'MobX', 'Three.js', 'D3.js', 'Mobile Responsive', 'Web Performance', 'SEO']
      },
      {
        id: 'mobile_dev',
        name_en: 'Mobile Developer',
        name_zh: '移动开发',
        skills: ['iOS', 'Android', 'Swift', 'Kotlin', 'Objective-C', 'Java', 'React Native', 'Flutter', 'Dart', 'Ionic', 'Cordova', 'Mobile UI/UX', 'App Store Optimization']
      },
      {
        id: 'fullstack_dev',
        name_en: 'Full Stack Developer',
        name_zh: '全栈开发',
        skills: ['JavaScript', 'TypeScript', 'Node.js', 'React', 'Vue', 'Python', 'Java', 'Database Design', 'API Development', 'DevOps', 'AWS', 'System Architecture']
      },
      {
        id: 'test_qa',
        name_en: 'Software Testing / QA',
        name_zh: '测试/QA',
        skills: ['Manual Testing', 'Automated Testing', 'Selenium', 'Cypress', 'Playwright', 'Jest', 'Mocha', 'Load Testing', 'JMeter', 'Performance Testing', 'Unit Testing', 'Integration Testing', 'Bug Tracking', 'Jira']
      },
      {
        id: 'devops_sre',
        name_en: 'DevOps & SRE',
        name_zh: '运维/技术支持',
        skills: ['Linux', 'Shell Scripting', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'Prometheus', 'Grafana', 'ELK Stack', 'Nginx', 'Network Security']
      },
      {
        id: 'data_ai',
        name_en: 'Data & AI',
        name_zh: '人工智能/数据',
        skills: ['Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision', 'Data Analysis', 'Pandas', 'NumPy', 'SQL', 'Data Visualization', 'Tableau', 'Power BI', 'Big Data', 'Hadoop', 'Spark', 'ETL', 'Data Warehousing']
      },
      {
        id: 'product_manager',
        name_en: 'Product Manager',
        name_zh: '产品经理',
        skills: ['Product Lifecycle', 'User Research', 'Agile/Scrum', 'Requirement Analysis', 'Roadmap Planning', 'Data Analysis', 'A/B Testing', 'UX/UI Principles', 'Stakeholder Management', 'Jira', 'Figma']
      },
      {
        id: 'ui_ux_design',
        name_en: 'UI/UX Designer',
        name_zh: 'UI/UX设计',
        skills: ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'User Research', 'Wireframing', 'Prototyping', 'Interaction Design', 'Visual Design', 'Design Systems', 'Usability Testing']
      }
    ]
  },
  {
    id: 'finance',
    name_en: 'Finance & Accounting',
    name_zh: '金融/会计',
    subcategories: [
      {
        id: 'accounting',
        name_en: 'Accounting',
        name_zh: '财务/会计',
        skills: ['General Ledger', 'Accounts Payable', 'Accounts Receivable', 'Financial Reporting', 'GAAP', 'IFRS', 'Tax Preparation', 'Auditing', 'QuickBooks', 'Xero', 'SAP', 'Oracle Netsuite', 'Cost Accounting']
      },
      {
        id: 'finance_analysis',
        name_en: 'Financial Analysis',
        name_zh: '金融分析',
        skills: ['Financial Modeling', 'Data Analysis', 'Forecasting', 'Valuation', 'Excel', 'VBA', 'SQL', 'Bloomberg Terminal', 'Risk Management', 'DCF Analysis', 'Market Research']
      },
      {
        id: 'investment',
        name_en: 'Investment / Securities',
        name_zh: '投资/证券',
        skills: ['Portfolio Management', 'Asset Allocation', 'Equity Research', 'Derivatives', 'Private Equity', 'Venture Capital', 'Due Diligence', 'Trading', 'Financial Markets', 'CFA']
      },
      {
        id: 'banking',
        name_en: 'Banking',
        name_zh: '银行',
        skills: ['Credit Analysis', 'Loan Processing', 'Underwriting', 'Risk Assessment', 'Compliance', 'KYC/AML', 'Relationship Management', 'Trade Finance', 'Wealth Management']
      },
      {
        id: 'insurance',
        name_en: 'Insurance',
        name_zh: '保险',
        skills: ['Underwriting', 'Claims Processing', 'Actuarial Science', 'Risk Analysis', 'Policy Administration', 'Sales', 'Customer Service']
      }
    ]
  },
  {
    id: 'sales_marketing',
    name_en: 'Sales & Marketing',
    name_zh: '销售/市场',
    subcategories: [
      {
        id: 'sales',
        name_en: 'Sales',
        name_zh: '销售',
        skills: ['B2B Sales', 'B2C Sales', 'Cold Calling', 'Lead Generation', 'Account Management', 'Negotiation', 'CRM', 'Salesforce', 'HubSpot', 'Closing', 'Business Development']
      },
      {
        id: 'digital_marketing',
        name_en: 'Digital Marketing',
        name_zh: '数字营销',
        skills: ['SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'Google Analytics', 'Growth Hacking', 'Copywriting', 'Brand Management']
      },
      {
        id: 'brand_pr',
        name_en: 'Brand & PR',
        name_zh: '品牌/公关',
        skills: ['Public Relations', 'Media Relations', 'Crisis Management', 'Brand Strategy', 'Event Planning', 'Corporate Communications', 'Press Releases', 'Social Media Management']
      },
      {
        id: 'market_research',
        name_en: 'Market Research',
        name_zh: '市场调研',
        skills: ['Qualitative Research', 'Quantitative Research', 'Survey Design', 'Data Analysis', 'Focus Groups', 'Competitor Analysis', 'Consumer Behavior', 'SPSS', 'Excel']
      }
    ]
  },
  {
    id: 'operations',
    name_en: 'Operations & Admin',
    name_zh: '运营/行政',
    subcategories: [
      {
        id: 'admin',
        name_en: 'Admin / Secretary',
        name_zh: '行政/秘书',
        skills: ['Office Management', 'Scheduling', 'Travel Arrangements', 'Data Entry', 'Event Coordination', 'Microsoft Office', 'Communication', 'Organization']
      },
      {
        id: 'hr',
        name_en: 'Human Resources',
        name_zh: '人力资源',
        skills: ['Recruitment', 'Talent Acquisition', 'Employee Relations', 'Onboarding', 'Payroll', 'Benefits Administration', 'HRIS', 'Performance Management', 'Labor Law', 'Training & Development']
      },
      {
        id: 'customer_service',
        name_en: 'Customer Service',
        name_zh: '客服',
        skills: ['Customer Support', 'Call Center', 'Ticket Management', 'Zendesk', 'Intercom', 'Problem Solving', 'Conflict Resolution', 'Communication', 'Technical Support']
      },
      {
        id: 'supply_chain',
        name_en: 'Supply Chain / Logistics',
        name_zh: '供应链/物流',
        skills: ['Inventory Management', 'Logistics Planning', 'Procurement', 'Vendor Management', 'Shipping & Receiving', 'ERP Systems', 'SAP', 'Supply Chain Optimization', 'Import/Export']
      }
    ]
  },
  {
    id: 'education',
    name_en: 'Education & Training',
    name_zh: '教育/培训',
    subcategories: [
      {
        id: 'teaching_k12',
        name_en: 'Teaching (K-12)',
        name_zh: '中小学教师',
        skills: ['Curriculum Design', 'Classroom Management', 'Lesson Planning', 'Special Education', 'Student Assessment', 'Subject Expertise (Math, Science, etc.)', 'Child Development']
      },
      {
        id: 'teaching_uni',
        name_en: 'University / Lecturer',
        name_zh: '大学教师/讲师',
        skills: ['Research', 'Grant Writing', 'Lecturing', 'Academic Writing', 'Curriculum Development', 'Student Mentoring', 'Public Speaking']
      },
      {
        id: 'teaching_esl',
        name_en: 'ESL / Language Teaching',
        name_zh: '外语/ESL教学',
        skills: ['TEFL', 'TESOL', 'CELTA', 'TPR', 'Online Teaching', 'Phonics', 'Grammar Instruction', 'Conversation Practice']
      },
      {
        id: 'tutoring',
        name_en: 'Tutoring / Training',
        name_zh: '辅导/培训',
        skills: ['One-on-one Tutoring', 'Test Prep (SAT, GRE, etc.)', 'Corporate Training', 'Workshop Facilitation', 'Coaching']
      }
    ]
  },
  {
    id: 'healthcare',
    name_en: 'Healthcare & Medical',
    name_zh: '医疗/护理',
    subcategories: [
      {
        id: 'doctor',
        name_en: 'Doctor / Physician',
        name_zh: '医生',
        skills: ['Diagnosis', 'Patient Care', 'Surgery', 'Medical Research', 'EMR/EHR', 'Clinical Procedures', 'Specialization (Cardiology, Pediatrics, etc.)']
      },
      {
        id: 'nurse',
        name_en: 'Nurse',
        name_zh: '护士',
        skills: ['Patient Vitals', 'Medication Administration', 'Wound Care', 'Emergency Care', 'ICU', 'Pediatrics', 'Nursing License']
      },
      {
        id: 'pharmacist',
        name_en: 'Pharmacist',
        name_zh: '药剂师',
        skills: ['Prescription Dispensing', 'Drug Interactions', 'Patient Counseling', 'Inventory Control', 'Compliance']
      },
      {
        id: 'medical_tech',
        name_en: 'Medical Technician',
        name_zh: '医学技师',
        skills: ['Lab Testing', 'X-Ray/MRI', 'Phlebotomy', 'Equipment Sterilization', 'Data Analysis']
      }
    ]
  },
  {
    id: 'construction',
    name_en: 'Construction & Real Estate',
    name_zh: '建筑/房地产',
    subcategories: [
      {
        id: 'architect',
        name_en: 'Architect',
        name_zh: '建筑师',
        skills: ['AutoCAD', 'Revit', 'SketchUp', 'Blueprint Reading', 'Building Codes', 'Project Management', 'Sustainable Design']
      },
      {
        id: 'civil_engineer',
        name_en: 'Civil Engineer',
        name_zh: '土木工程师',
        skills: ['Structural Analysis', 'AutoCAD', 'Civil 3D', 'Project Estimation', 'Site Inspection', 'Construction Management']
      },
      {
        id: 'construction_worker',
        name_en: 'Construction Worker',
        name_zh: '建筑工人',
        skills: ['Carpentry', 'Plumbing', 'Electrical', 'Masonry', 'Heavy Machinery', 'Safety Regulations']
      },
      {
        id: 'real_estate_agent',
        name_en: 'Real Estate Agent',
        name_zh: '房地产中介',
        skills: ['Property Sales', 'Leasing', 'Negotiation', 'Market Analysis', 'Client Relations', 'Contract Law']
      }
    ]
  },
  {
    id: 'hospitality',
    name_en: 'Hospitality & Travel',
    name_zh: '酒店/旅游',
    subcategories: [
      {
        id: 'hotel_mgmt',
        name_en: 'Hotel Management',
        name_zh: '酒店管理',
        skills: ['Staff Management', 'Guest Services', 'Revenue Management', 'Operations', 'Event Planning', 'Housekeeping Oversight']
      },
      {
        id: 'chef',
        name_en: 'Chef / Cook',
        name_zh: '厨师',
        skills: ['Culinary Arts', 'Menu Planning', 'Food Safety', 'Inventory Management', 'Kitchen Management', 'Baking', 'Pastry']
      },
      {
        id: 'travel_agent',
        name_en: 'Travel Agent / Guide',
        name_zh: '旅游顾问/导游',
        skills: ['Itinerary Planning', 'Booking Systems', 'Customer Service', 'Destination Knowledge', 'Tour Guiding', 'Language Skills']
      },
      {
        id: 'waiter',
        name_en: 'Waiter / Bartender',
        name_zh: '服务员/调酒师',
        skills: ['Customer Service', 'POS Systems', 'Mixology', 'Food & Beverage Knowledge', 'Upselling']
      }
    ]
  },
  {
    id: 'creative',
    name_en: 'Creative & Media',
    name_zh: '文化/传媒/娱乐',
    subcategories: [
      {
        id: 'writer',
        name_en: 'Writer / Editor',
        name_zh: '编辑/作家',
        skills: ['Copywriting', 'Content Writing', 'Editing', 'Proofreading', 'SEO', 'Creative Writing', 'Journalism', 'Storytelling']
      },
      {
        id: 'videographer',
        name_en: 'Videographer / Photographer',
        name_zh: '摄影/摄像',
        skills: ['Photography', 'Video Editing', 'Premiere Pro', 'Final Cut', 'After Effects', 'Lighting', 'Composition', 'Color Grading']
      },
      {
        id: 'graphic_design',
        name_en: 'Graphic Designer',
        name_zh: '平面设计',
        skills: ['Photoshop', 'Illustrator', 'InDesign', 'Typography', 'Layout Design', 'Branding', 'Print Design']
      },
      {
        id: 'producer',
        name_en: 'Producer / Director',
        name_zh: '导演/制片',
        skills: ['Project Management', 'Scriptwriting', 'Casting', 'Budgeting', 'Directing', 'Production Logistics']
      }
    ]
  },
    {
    id: 'legal',
    name_en: 'Legal',
    name_zh: '法律',
    subcategories: [
      {
        id: 'lawyer',
        name_en: 'Lawyer / Attorney',
        name_zh: '律师',
        skills: ['Litigation', 'Contract Law', 'Corporate Law', 'Legal Research', 'Negotiation', 'Court Representation', 'Legal Writing']
      },
      {
        id: 'paralegal',
        name_en: 'Paralegal',
        name_zh: '律师助理',
        skills: ['Legal Research', 'Document Drafting', 'Case Management', 'Administrative Support', 'Notary Public']
      },
      {
        id: 'compliance',
        name_en: 'Compliance Officer',
        name_zh: '合规专员',
        skills: ['Regulatory Compliance', 'Risk Assessment', 'Audit', 'Policy Development', 'Anti-Money Laundering (AML)']
      }
    ]
  }
];

// Helper to flatten skills for legacy support if needed
export const ALL_SKILLS = JOB_CATEGORIES.flatMap(cat => 
  cat.subcategories.flatMap(sub => sub.skills)
);

// Helper to get skills by subcategory ID
export const getSkillsBySubcategory = (subcategoryId: string): string[] => {
  for (const cat of JOB_CATEGORIES) {
    const sub = cat.subcategories.find(s => s.id === subcategoryId);
    if (sub) return sub.skills;
  }
  return [];
};

// Language proficiency levels for job seeker onboarding
export const LANGUAGE_PROFICIENCY = [
  'Native',
  'Fluent',
  'Advanced',
  'Intermediate',
  'Basic'
];

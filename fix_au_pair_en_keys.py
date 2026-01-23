
import json
import os

def fix_en_json():
    path = 'src/i18n/locales/en.json'
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {path}: {e}")
        return

    if 'auPair' not in data:
        data['auPair'] = {}
    if 'onboarding' not in data['auPair']:
        data['auPair']['onboarding'] = {}
    
    # Structure to merge - based on AuPairOnboarding.tsx fallbacks
    new_translations = {
        "basic": {
            "title": "Basic Info",
            "firstName": "First Name",
            "lastName": "Last Name",
            "middleName": "Middle Name",
            "optional": "Optional",
            "displayNameLabel": "Display Name",
            "age": "Age",
            "gender": "Gender",
            "female": "Female",
            "male": "Male",
            "nonBinary": "Non-binary",
            "nationalityLocation": "Nationality & Location",
            "nationality": "Nationality",
            "currentLocation": "Current Location",
            "hobbies": {
                "reading": "Reading",
                "cooking": "Cooking",
                "travel": "Travel",
                "music": "Music",
                "sports": "Sports",
                "photography": "Photography",
                "arts_crafts": "Arts & Crafts",
                "hiking": "Hiking",
                "swimming": "Swimming",
                "gardening": "Gardening",
                "dancing": "Dancing",
                "writing": "Writing",
                "volunteering": "Volunteering",
                "yoga": "Yoga",
                "gaming": "Gaming"
            }
        },
        "step1": {
            "hobbies": "Hobbies",
            "hobbiesPlaceholder": "Select your hobbies..."
        },
        "strengths": {
            "title": "Strengths & Personality",
            "traitsLabel": "Personality Traits",
            "traitsDesc": "Select traits that best describe you",
            "traitsPlaceholder": "Select traits...",
            "workStyleLabel": "Work Style",
            "workStyleDesc": "How do you work?",
            "workStylePlaceholder": "Select work style...",
            "traits": {
                "energetic": "Energetic",
                "playful": "Playful",
                "calm": "Calm",
                "patient": "Patient",
                "organized": "Organized",
                "tidy": "Tidy",
                "creative": "Creative",
                "artistic": "Artistic",
                "nurturing": "Nurturing",
                "warm": "Warm",
                "independent": "Independent",
                "flexible": "Flexible",
                "adaptable": "Adaptable",
                "responsible": "Responsible",
                "serious": "Serious",
                "outgoing": "Outgoing",
                "introverted": "Introverted",
                "outdoorsy": "Outdoorsy",
                "empathetic": "Empathetic",
                "reliable": "Reliable",
                "honest": "Honest",
                "enthusiastic": "Enthusiastic",
                "proactive": "Proactive"
            },
            "workStyle": {
                "initiative": "Take Initiative",
                "direction": "Follow Direction",
                "collaborative": "Collaborative",
                "autonomous": "Autonomous",
                "structured": "Structured",
                "flexible": "Flexible",
                "communicative": "Communicative",
                "observer": "Observer"
            }
        },
        "skills": {
            "title": "Childcare Skills",
            "ageComfortLabel": "Age Groups Worked With",
            "skillsLabel": "Special Skills",
            "experienceLabel": "Detailed Experience",
            "experiencePlaceholder": "Describe your childcare experience...",
            "ageComfort": {
                "infants": "Infants (0-1 yr)",
                "toddlers": "Toddlers (1-3 yrs)",
                "preschool": "Preschool (3-5 yrs)",
                "school_age": "School Age (6-12 yrs)",
                "teenagers": "Teenagers (13+ yrs)"
            },
            "options": {
                "cooking": "Cooking",
                "driving": "Driving",
                "swimming": "Swimming",
                "tutoring": "Tutoring",
                "first_aid": "First Aid",
                "sports": "Sports",
                "arts": "Arts",
                "music": "Music",
                "pets": "Pet Care",
                "special_needs": "Special Needs",
                "infant_care": "Infant Care",
                "language_teaching": "Language Teaching",
                "housekeeping": "Housekeeping",
                "gardening": "Gardening",
                "elderly_care": "Elderly Care"
            }
        },
        "education": {
            "title": "Education",
            "level": "Education Level",
            "highSchool": "High School",
            "associate": "Associate Degree",
            "bachelor": "Bachelor's Degree",
            "master": "Master's Degree",
            "phd": "PhD",
            "fieldOfStudy": "Field of Study",
            "fieldPlaceholder": "e.g. Psychology, Education"
        },
        "rules": {
            "title": "House Rules",
            "label": "Acceptable House Rules",
            "desc": "Which rules are you comfortable with?",
            "options": {
                "curfew": "Curfew",
                "no_guests": "No Guests",
                "screen_limit": "Screen Time Limit",
                "cleaning": "Light Cleaning",
                "pet_care": "Pet Care",
                "vegan": "Vegan Household"
            }
        },
        "preferences": {
            "title": "Preferences",
            "familyTypeLabel": "Preferred Family Type",
            "accommodationLabel": "Accommodation Preference",
            "liveIn": "Live-in",
            "liveOut": "Live-out",
            "either": "Either",
            "familyType": {
                "active": "Active",
                "intellectual": "Intellectual",
                "travel": "Travel-loving",
                "homebody": "Homebody",
                "large": "Large Family",
                "single_parent": "Single Parent"
            }
        },
        "availability": {
            "title": "Availability",
            "availableFrom": "Available From",
            "duration": "Duration (months)"
        },
        "languages": {
            "title": "Languages",
            "languageLabel": "Language",
            "addLanguage": "Add Language",
            "english": "English",
            "mandarin": "Chinese (Mandarin)",
            "cantonese": "Chinese (Cantonese)",
            "spanish": "Spanish",
            "french": "French",
            "german": "German",
            "japanese": "Japanese",
            "korean": "Korean",
            "russian": "Russian",
            "italian": "Italian",
            "portuguese": "Portuguese"
        },
        "step7": {
             "proficiencyLabel": "Proficiency",
             "native": "Native",
             "fluent": "Fluent",
             "intermediate": "Intermediate",
             "beginner": "Beginner"
        },
        "media": {
            "title": "Photos & Video",
            "photosLabel": "Profile Photos",
            "photosDesc": "Upload photos to showcase your personality",
            "photosHelp": "First photo will be your main profile picture",
            "videoLabel": "Intro Video",
            "uploadVideo": "Upload Video",
            "videoDesc": "Upload a short video introducing yourself"
        },
        "review": {
            "title": "Review Profile",
            "desc": "Please review your information before submitting.",
            "submit": "Submit Application"
        },
        "exit": "Exit",
        "pleaseWait": "Please wait...",
        "steps": {
            "basic": "Basic Info",
            "skills": "Skills & Experience",
            "preferences": "Preferences",
            "availability": "Availability"
        },
        "step5": {
            "dietaryLabel": "Dietary Restrictions",
            "dietaryPlaceholder": "e.g. Vegetarian, Allergies"
        },
        "step8": {
           "creating": "Creating Profile...",
           "submit": "Submit Application"
        },
        "exitModal": {
            "title": "Exit Onboarding?",
            "progressSaved": "Your progress has been saved as a draft.",
            "returnLater": "You can return later to complete your profile.",
            "continueOnboarding": "Continue Onboarding",
            "exitToBrowse": "Exit to Browse"
        }
    }

    # Recursive update to preserve existing keys not in new_translations
    def recursive_update(d, u):
        if not isinstance(d, dict):
            d = {}
        for k, v in u.items():
            if isinstance(v, dict):
                d[k] = recursive_update(d.get(k, {}), v)
            else:
                d[k] = v
        return d

    recursive_update(data['auPair']['onboarding'], new_translations)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("Successfully updated en.json with Au Pair Onboarding translations.")

fix_en_json()

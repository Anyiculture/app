import json
import collections

en_file = 'src/i18n/locales/en.json'
zh_file = 'src/i18n/locales/zh.json'

# Mapped from HostFamilyOnboarding.tsx context
new_keys = {
    "auPair": {
        "onboarding": {
            "familyLifestyle": "Family Lifestyle",
            "parenting": "Parenting Style", 
            "houseRules": "House Rules",
            "preferences": "Au Pair Preferences",
            "workStructure": "Work Structure",
            "benefits": "Benefits",
            
            "familyName": "Family Name",
            "familyNamePlaceholder": "e.g. The Smith Family",
            "adultsAndKids": "Family Size",
            "totalMembers": "Total Members",
            "children": "Number of Children",
            "location": "Location",
            "homeType": "Home Type",
            "householdVibe": "Household Vibe",
            
            "homeTypeHouse": "House",
            "homeTypeApartment": "Apartment",
            "homeTypeFarm": "Farm",
            "homeTypeTownhouse": "Townhouse",
            
            "vibeActive": "Active",
            "vibeCalm": "Calm",
            "vibeCreative": "Creative",
            "vibeIntellectual": "Intellectual",
            "vibeSocial": "Social",
            "vibeStructured": "Structured",
            "vibeRelaxed": "Relaxed",
            "vibeNature": "Nature-loving",
            
            "questionParenting": "What is your parenting style?",
            "questionDiscipline": "How do you approach discipline?",
            "questionRules": "What activities/behaviors are NOT allowed?",
            "questionRulesDetails": "Elaborate on your house rules (Optional)",
            "elaborateRulesPlaceholder": "e.g. We prefer quiet time after 9 PM...",
            "questionTraits": "What personality traits are you looking for?",
            "preferredNationalities": "Preferred Nationalities",
            "labelIdealCandidate": "Ideal Candidate Profile",
            "labelLookingFor": "Looking for someone who is",
            "questionDuties": "What will be the Au Pair's main duties?",
            "startDate": "Start Date",
            "endDate": "End Date",
            "questionSalary": "Monthly Pocket Money (CNY)",
            "labelPrivateRoom": "Private Room",
            "questionBenefits": "Additional Benefits",
            
            "options": {
                "parentingDescription": "This helps Au Pairs understand how you interact with your children.",
                "houseRulesDescription": "Be clear about deal-breakers for your home.",
                "parenting": {
                    "gentle": "Gentle Parenting",
                    "montessori": "Montessori Inspired",
                    "authoritative": "Authoritative",
                    "attachment": "Attachment Parenting",
                    "free_range": "Free-Range",
                    "structured": "Strict/Structured"
                },
                "discipline": {
                    "discussion": "Discussion",
                    "timeouts": "Time-outs",
                    "consequences": "Natural Consequences",
                    "loss_privileges": "Loss of Privileges",
                    "au_pair_leads": "Au Pair can discipline",
                    "parents_only": "Only parents discipline"
                },
                "rules": {
                    "no_smoking": "No Smoking",
                    "no_drinking": "No Drinking",
                    "no_overnight_guests": "No Overnight Guests",
                    "curfew": "Curfew",
                    "keep_room_tidy": "Keep Room Tidy",
                    "screen_limit": "Limit Screen Time",
                    "vegan": "Vegetarian Diet",
                    "other": "Other"
                },
                "traits": {
                    "energetic": "Energetic",
                    "calm": "Calm",
                    "organized": "Organized",
                    "creative": "Creative",
                    "outdoorsy": "Outdoorsy",
                    "independent": "Independent",
                    "nurturing": "Nurturing",
                    "serious": "Broad-minded"
                },
                "duties": {
                    "school_pickup": "School Pickup",
                    "homework": "Homework Help",
                    "meal_prep": "Meal Prep",
                    "light_housekeeping": "Light Housekeeping",
                    "bedtime": "Bedtime Routine",
                    "sports": "Driving to Activities",
                    "laundry": "Kids Laundry",
                    "language_teaching": "Language Teaching"
                },
                "benefits": {
                    "car_use": "Personal Use of Car",
                    "gym": "Gym Membership",
                    "language_classes": "Language Classes Paid",
                    "travel": "Travel with Family",
                    "sim_card": "SIM Card/Data Plan",
                    "transit_pass": "Public Transit Pass",
                    "bonuses": "Completion Bonus"
                }
            },
            
            "steps": {
                "media": "Family Photos & Video",
                "review": "Review Profile"
            },
            "media": {
                "familyPhotosLabel": "Family & Home Photos",
                "familyPhotosDesc": "Upload 1-5 photos showing your family, the Au Pair's room, and living areas.",
                "videoLabel": "Family Intro Video",
                "videoDesc": "Upload a short video introducing your family (optional)."
            },
            "error": {
                "photoRequired": "Please upload at least one photo of your family or home"
            },
            "exit": "Exit",
            "editProfileDesc": "Update your family profile information",
            
            "familySize": "Family Size",
            "parentingStyles": "Parenting Styles",
            "discipline": "Discipline",
            "duties": "Duties",
            "lookingFor": "Looking for",
            
            "nextStep": "Next Step",
            "completeProfile": "Complete Profile",
            "creatingProfile": "Creating Profile...",
            "pleaseWait": "Please wait...",
            
            "hostFamily": {
                "reviewDesc": "Review your profile information below"
            },
            "labelReview": "Review",
            
            "exitModal": {
                "title": "Exit Onboarding?",
                "progressSaved": "Your progress has been saved as a draft.",
                "returnLater": "You can return later to complete your profile.",
                "exitToBrowse": "Exit to Browse",
                "continueOnboarding": "Continue Onboarding"
            }
        }
    },
    "jobs": {
        "salary": {
            "label": "Salary"
        }
    }
}

def update_file(file_path, is_zh=False):
    print(f"Updating {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f, object_pairs_hook=collections.OrderedDict)
        
        # Helper to merge deeply
        def deep_merge(target, source):
            for k, v in source.items():
                if isinstance(v, dict):
                    if k not in target:
                        target[k] = collections.OrderedDict()
                    if not isinstance(target[k], dict):
                        target[k] = collections.OrderedDict() 
                    deep_merge(target[k], v)
                else:
                    if k not in target:
                        # For ZH, technically we should translate, but English fallback is better than raw key
                        # If simple keys, maybe append (EN)? No, just use English for now.
                        target[k] = v 
        
        deep_merge(data, new_keys)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("Success.")
        
    except Exception as e:
        print(f"Error updating {file_path}: {e}")

if __name__ == "__main__":
    update_file(en_file)
    update_file(zh_file, is_zh=True)

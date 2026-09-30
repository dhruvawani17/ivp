/**
 * Clinical Dermatology Intelligence Engine
 * 1. Multi-Condition Differential Diagnosis (DDx) & Contraindication Matrix
 * 2. Contact Allergen & Skincare Ingredient Scanner
 * 3. Anatomical Distribution Correlation (Flexural vs Extensor vs Sun-Exposed)
 */

// --- Anatomical Zones & Pathologic Associations ---
export const ANATOMICAL_ZONES = [
  { id: "face", label: "Face & Cheeks", category: "seborrheic_sun", region: "Head" },
  { id: "scalp", label: "Scalp", category: "seborrheic", region: "Head" },
  { id: "neck", label: "Neck", category: "contact_fold", region: "Upper" },
  { id: "chest", label: "Chest / Decollete", category: "sun_exposed", region: "Torso" },
  { id: "abdomen", label: "Abdomen", category: "general_trunk", region: "Torso" },
  { id: "back_upper", label: "Upper Back", category: "seborrheic_acne", region: "Torso" },
  { id: "back_lower", label: "Lower Back", category: "general_trunk", region: "Torso" },
  { id: "elbow_extensor", label: "Elbows (Outer / Extensor)", category: "extensor", region: "Arms" },
  { id: "elbow_flexural", label: "Elbow Creases (Inner / Flexural)", category: "flexural", region: "Arms" },
  { id: "forearm", label: "Forearm", category: "contact_sun", region: "Arms" },
  { id: "hands", label: "Hands & Fingers", category: "contact_occupational", region: "Arms" },
  { id: "knee_extensor", label: "Knees (Outer / Extensor)", category: "extensor", region: "Legs" },
  { id: "knee_flexural", label: "Behind Knees (Popliteal / Flexural)", category: "flexural", region: "Legs" },
  { id: "legs", label: "Lower Legs / Shins", category: "stasis_xerosis", region: "Legs" },
  { id: "feet", label: "Feet & Soles", category: "acral_fungal", region: "Legs" },
];

// --- Differential Diagnosis (DDx) Knowledge Base ---
export const DERM_CONDITIONS = [
  {
    id: "contact_dermatitis",
    name: "Allergic / Irritant Contact Dermatitis",
    icd10: "L23.9",
    typicalPresentation: "Well-demarcated erythematous patch, pruritus, vesicular papules after exposure to topicals, soaps, or metals.",
    contraindications: [
      "Avoid continued use of fragranced lotions or harsh soaps.",
      "Do NOT apply triple antibiotic ointments containing neomycin/bacitracin (common contact sensitizers).",
    ],
    primaryTreatment: "Discontinue suspect contactant, cool compresses, hypoallergenic emollient, mild topical hydrocortisone under physician advice.",
  },
  {
    id: "atopic_eczema",
    name: "Atopic Dermatitis (Eczema)",
    icd10: "L20.9",
    typicalPresentation: "Pruritic, dry, lichenified erythematous patches predominantly in flexural folds (creases of elbows and knees).",
    contraindications: [
      "Avoid hot showers and drying detergents (SLS) which strip ceramides.",
      "Do NOT scratch vigorously — high risk of secondary Staphylococcal infection.",
    ],
    primaryTreatment: "Barrier restoration with ceramide-dominant balms, damp skin occlusion, allergen avoidance.",
  },
  {
    id: "psoriasis_plaque",
    name: "Plaque Psoriasis",
    icd10: "L40.0",
    typicalPresentation: "Sharply demarcated, thick salmon-pink plaques covered with silvery micaceous scales on extensor surfaces (elbows, knees, scalp).",
    contraindications: [
      "Do NOT abruptly stop systemic corticosteroids (triggers severe erythrodermic flare).",
      "Avoid skin trauma / abrasive loofahs (Koebner phenomenon induces new lesions).",
    ],
    primaryTreatment: "Topical vitamin D analogues, keratolytics (salicylic acid), prescription mid-to-high potency topical corticosteroids.",
  },
  {
    id: "tinea_corporis",
    name: "Tinea Corporis (Fungal / Ringworm)",
    icd10: "B35.4",
    typicalPresentation: "Annular (ring-shaped) erythematous plaque with active, raised, scaly advancing border and central clearing.",
    contraindications: [
      "CRITICAL: NEVER apply topical corticosteroids (Hydrocortisone/Betamethasone) alone — causes 'Tinea Incognito', masking symptoms while accelerating fungal proliferation!",
    ],
    primaryTreatment: "Topical antifungal (Terbinafine, Clotrimazole) twice daily for 2–4 weeks, keeping area clean and dry.",
  },
  {
    id: "seborrheic_dermatitis",
    name: "Seborrheic Dermatitis",
    icd10: "L21.9",
    typicalPresentation: "Greasy, yellowish scaling on erythematous base along sebum-rich regions: scalp, eyebrows, nasolabial folds, and chest.",
    contraindications: [
      "Avoid heavy occlusive oils (coconut oil, petroleum jelly) that feed Malassezia yeast.",
    ],
    primaryTreatment: "Ketoconazole or Zinc Pyrithione wash, gentle non-comedogenic hydration.",
  },
  {
    id: "melanocytic_lesion",
    name: "Atypical Melanocytic Lesion / Dysplastic Nevus",
    icd10: "D22.9",
    typicalPresentation: "Pigmented macule or papule exhibiting structural asymmetry, border scalloping, or multi-chromatic pigmentation.",
    contraindications: [
      "NEVER attempt home mole removal or acid/bleaching creams.",
      "Do NOT freeze or laser without prior histopathological dermoscopy evaluation.",
    ],
    primaryTreatment: "Formal dermoscopic monitoring, sequential digital dermatoscopy, or excisional biopsy if high TDS score.",
  },
];

// --- Compute Differential Diagnosis Probabilities ---
export function calculateDifferentialDiagnosis({
  symptomsText = "",
  bodyZoneId = "forearm",
  cvMetrics = null,
  fitzpatrick = null,
  detectedAllergens = [],
}) {
  const text = symptomsText.toLowerCase();
  const zone = ANATOMICAL_ZONES.find((z) => z.id === bodyZoneId) || ANATOMICAL_ZONES[9];

  // Base scoring map
  const scores = {
    contact_dermatitis: 30,
    atopic_eczema: 25,
    psoriasis_plaque: 15,
    tinea_corporis: 12,
    seborrheic_dermatitis: 10,
    melanocytic_lesion: 5,
  };

  // 1. Text keyword heuristics
  if (text.includes("itch") || text.includes("scratch")) {
    scores.contact_dermatitis += 20;
    scores.atopic_eczema += 25;
    scores.tinea_corporis += 15;
  }
  if (text.includes("soap") || text.includes("cream") || text.includes("detergent") || text.includes("jewelry") || text.includes("new product")) {
    scores.contact_dermatitis += 35;
  }
  if (text.includes("ring") || text.includes("circle") || text.includes("spreading edge") || text.includes("cat") || text.includes("gym")) {
    scores.tinea_corporis += 40;
  }
  if (text.includes("scale") || text.includes("flak") || text.includes("silver") || text.includes("thick")) {
    scores.psoriasis_plaque += 30;
    scores.seborrheic_dermatitis += 20;
  }
  if (text.includes("burn") || text.includes("sting") || text.includes("warm")) {
    scores.contact_dermatitis += 15;
  }
  if (text.includes("mole") || text.includes("dark spot") || text.includes("brown") || text.includes("black")) {
    scores.melanocytic_lesion += 45;
  }

  // 2. Anatomical Location correlation
  if (zone.category === "flexural") {
    scores.atopic_eczema += 35;
    scores.psoriasis_plaque -= 10;
  } else if (zone.category === "extensor") {
    scores.psoriasis_plaque += 35;
    scores.atopic_eczema -= 10;
  } else if (zone.category === "seborrheic" || zone.category === "seborrheic_sun") {
    scores.seborrheic_dermatitis += 40;
  } else if (zone.category === "contact_occupational" || zone.category === "contact_sun") {
    scores.contact_dermatitis += 25;
  } else if (zone.category === "acral_fungal") {
    scores.tinea_corporis += 30;
  }

  // 3. Computer Vision ABCDE weighting
  if (cvMetrics) {
    if (cvMetrics.tdsScore > 5.0 || cvMetrics.color?.distinctCount >= 3) {
      scores.melanocytic_lesion += 40;
    }
    // High border irregularity with scaling
    if (cvMetrics.border?.score > 40) {
      scores.tinea_corporis += 15;
      scores.psoriasis_plaque += 15;
    }
    // Highly symmetric with moderate redness
    if (cvMetrics.asymmetry?.score < 25) {
      scores.contact_dermatitis += 10;
      scores.atopic_eczema += 10;
    }
  }

  // 4. Detected Allergens
  if (detectedAllergens.length > 0) {
    scores.contact_dermatitis += detectedAllergens.length * 15;
  }

  // Normalize scores to 100%
  const total = Object.values(scores).reduce((a, b) => Math.max(1, a + Math.max(0, b)), 0);
  const ranked = DERM_CONDITIONS.map((cond) => {
    const raw = Math.max(5, scores[cond.id] || 5);
    const prob = Math.round((raw / total) * 100);
    return {
      ...cond,
      probability: prob,
    };
  }).sort((a, b) => b.probability - a.probability);

  // Normalize top 4 to sum gracefully
  const top4 = ranked.slice(0, 4);
  const topSum = top4.reduce((s, c) => s + c.probability, 0);
  top4.forEach((c) => {
    c.probability = Math.round((c.probability / topSum) * 100);
  });

  return top4;
}

// --- Common Contact Allergens & Skincare Registry ---
export const CONTACT_ALLERGENS_DATABASE = [
  {
    name: "Fragrance / Parfum",
    aliases: ["parfum", "fragrance", "aroma", "essential oil", "linalool", "limonene", "geraniol", "eugenol"],
    hazardLevel: "High (Top Contact Sensitizer)",
    hazardColor: "#ef4444",
    commonIn: "Perfumes, scented lotions, face creams, deodorants.",
    advice: "Switch to 100% fragrance-free products marked 'fragrance-free' (not just 'unscented').",
  },
  {
    name: "Methylisothiazolinone (MI / MCI)",
    aliases: ["methylisothiazolinone", "methylchloroisothiazolinone", "kathon"],
    hazardLevel: "Very High (Preservative Sensitizer)",
    hazardColor: "#ef4444",
    commonIn: "Wet wipes, liquid shampoos, body washes, laundry detergents.",
    advice: "Look for preservative alternatives like phenoxyethanol or potassium sorbate.",
  },
  {
    name: "Sulfates (SLS / SLES)",
    aliases: ["sodium lauryl sulfate", "sodium laureth sulfate", "ammonium lauryl sulfate", "sls", "sles"],
    hazardLevel: "Moderate (Severe Barrier Stripper)",
    hazardColor: "#f59e0b",
    commonIn: "Foaming facial cleansers, body washes, toothpastes.",
    advice: "Causes transepidermal water loss. Switch to sulfate-free, non-foaming cream cleansers.",
  },
  {
    name: "Nickel / Metallic Triggers",
    aliases: ["nickel", "cobalt", "chromium", "plated jewelry"],
    hazardLevel: "High (Top Metal Allergen)",
    hazardColor: "#ef4444",
    commonIn: "Watch buckles, costume jewelry, belt buckles, denim buttons.",
    advice: "Apply clear enamel over metal buttons or switch to surgical grade titanium/platinum.",
  },
  {
    name: "Lanolin / Wool Alcohols",
    aliases: ["lanolin", "acetylated lanolin", "wool alcohol", "lanolin oil"],
    hazardLevel: "Moderate (Common Eczema Sensitizer)",
    hazardColor: "#f59e0b",
    commonIn: "Heavy winter ointments, lip balms, nipple creams.",
    advice: "Substitute with pure 100% white petrolatum (Vaseline) or squalane.",
  },
  {
    name: "Formaldehyde Releasers",
    aliases: ["dmdm hydantoin", "imidazolidinyl urea", "quaternium-15", "diazolidinyl urea"],
    hazardLevel: "High (Preservative Sensitizer)",
    hazardColor: "#ef4444",
    commonIn: "Hair relaxers, body lotions, nail polishes.",
    advice: "Discontinue immediately if developing eyelid or neck eczema.",
  },
  {
    name: "Benzoyl Peroxide / Retinoids (High Strength)",
    aliases: ["benzoyl peroxide", "retinol", "tretinoin", "adapalene", "salicylic acid"],
    hazardLevel: "Moderate (Chemical Irritant)",
    hazardColor: "#f59e0b",
    commonIn: "Acne treatments, anti-aging night serums.",
    advice: "May cause chemical contact dermatitis if skin barrier is broken. Suspend usage until skin heals.",
  },
];

// --- Product Presets for Quick Patient Selection ---
export const PRODUCT_PRESETS = [
  { label: "Scented Body Lotion", ingredients: "water, glycerin, mineral oil, cetyl alcohol, fragrance, parfum, linalool, phenoxyethanol" },
  { label: "Antibacterial Hand Wash", ingredients: "water, sodium lauryl sulfate, cocamidopropyl betaine, methylisothiazolinone, fragrance, yellow 5" },
  { label: "Anti-Aging Night Serum", ingredients: "water, retinol 1%, dimethicone, dmdm hydantoin, limonene, essential oil mix" },
  { label: "Standard Laundry Detergent", ingredients: "surfactants, fragrance, optical brighteners, methylisothiazolinone, enzymes" },
  { label: "Costume Jewelry / Watch", ingredients: "nickel, copper alloy, metallic plating" },
  { label: "Heavy Wool/Lanolin Balm", ingredients: "petrolatum, lanolin alcohol, mineral oil, cetearyl alcohol" },
];

// --- Scan Ingredients Function ---
export function scanIngredientsForAllergens(inputText) {
  if (!inputText || !inputText.trim()) return [];

  const text = inputText.toLowerCase();
  const matched = [];

  for (const item of CONTACT_ALLERGENS_DATABASE) {
    const hits = item.aliases.filter((alias) => text.includes(alias.toLowerCase()));
    if (hits.length > 0) {
      matched.push({
        ...item,
        matchedTokens: hits,
      });
    }
  }

  return matched;
}

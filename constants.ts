import { ClinicalData, Results, DdimerUnit, FormItem, AnticoagulantMonitoringInfo } from './types';

export const INITIAL_CLINICAL_DATA: ClinicalData = {
  age: '',
  gender: '',
  pregnant: false,
  clinicalDVT: false,
  peFirstDiagnosis: false,
  heartRate: '',
  immobilization: false,
  previousVTE: false,
  hemoptysis: false,
  malignancy: false,
  ageOver50: false,
  hrOver100: false,
  oxygenSat: '',
  legSwelling: false,
  recentSurgery: false,
  priorVTE: false,
  hormones: false,
  yearsDVT: false,
  yearsHemoptysis: false,
  yearsPELikely: false,
  ddimer: '',
  ddimerUnit: 'mg/L' as DdimerUnit,
  sbp: '',
  troponin: false,
  bnp: false,
  rvDysfunction: false,
  ctpaFindings: '',
  peConfirmed: false,
  bleedingRisk: false,
  renalFunction: '',
  peProvoked: false,
  peProvokedFactorDetails: '',
  hemodynamicallyUnstable: false,
  thrombolysisNeeded: false,
  activeBleeding: false,
  oxygenNeeded: false,
  peOnAnticoag: false,
  severePain: false,
  socialReasons: false,
  renalImpairment: false,
  liverImpairment: false,
  pregnantHestia: false,
  hitHistory: false,
  chestXrayPerformed: false,
  chestXraySuggestsOtherDiagnosis: null,
  ctpaPerformedCancer: false,
  ctpaPositiveCancer: null,
};

export const INITIAL_RESULTS: Results = {
  wellsScore: 0,
  wellsCategory: '',
  percCriteriaMet: 0,
  percPositive: false,
  yearsCriteriaMet: 0,
  yearsCategory: '',
  ddimerThreshold: 0.5, // Default for mg/L FEU
  hestiaScore: 0,
  outpatientEligible: true,
  peRiskLevel: '',
};

export const DDIMER_UNITS: DdimerUnit[] = ['mg/L', 'µg/L', 'ng/mL'];

export const WELLS_CRITERIA_ITEMS: FormItem[] = [
  { key: 'clinicalDVT', label: 'Signes cliniques de TVP', points: 3 },
  { key: 'peFirstDiagnosis', label: 'EP diagnostic le plus probable', points: 3 },
  // Heart rate > 100 bpm is handled separately as it's a common input
  { key: 'immobilization', label: 'Immobilisation ≥3j ou chirurgie <4 semaines', points: 1.5 },
  { key: 'previousVTE', label: 'Antécédent de TVP/EP', points: 1.5 },
  { key: 'hemoptysis', label: 'Hémoptysie', points: 1 },
  { key: 'malignancy', label: 'Cancer actif (traitement en cours, palliatif ou <6 mois)', points: 1 }
];

export const PERC_CRITERIA_ITEMS: FormItem[] = [
  { key: 'ageOver50', label: 'Âge ≥ 50 ans', auto: (data) => parseInt(data.age) >= 50 },
  { key: 'hrOver100', label: 'FC ≥ 100 bpm', auto: (data) => parseInt(data.heartRate) >= 100 },
  { key: 'oxygenSat' as any, label: 'SpO2 &lt; 95% à l\'air ambiant', auto: (data) => parseFloat(data.oxygenSat) < 95 },
  { key: 'legSwelling', label: 'Œdème unilatéral de jambe' },
  { key: 'hemoptysis', label: 'Hémoptysie' }, // Repeated from Wells, but part of PERC
  { key: 'recentSurgery', label: 'Chirurgie ou traumatisme récent (&lt;4 semaines)' },
  { key: 'priorVTE', label: 'Antécédent de TVP/EP' }, // Repeated
  { key: 'hormones', label: 'Prise d\'œstrogènes' }
];

export const YEARS_CRITERIA_ITEMS: FormItem[] = [
  { key: 'yearsDVT', label: 'Signes cliniques de TVP' },
  { key: 'yearsHemoptysis', label: 'Hémoptysie' },
  { key: 'yearsPELikely', label: 'EP diagnostic le plus probable (selon le clinicien)' }
];

export const HESTIA_CRITERIA_ITEMS: FormItem[] = [
    { key: 'hemodynamicallyUnstable', label: 'Instabilité hémodynamique (PAS &lt;100 mmHg ou FC &gt;100 bpm)' },
    { key: 'thrombolysisNeeded', label: 'Thrombolyse ou embolectomie nécessaire' },
    { key: 'activeBleeding', label: 'Saignement actif ou risque hémorragique élevé (ex: plaquettes &lt; 75 G/L, TA &gt; 180/110 non contrôlée)' },
    { key: 'oxygenNeeded', label: 'Oxygénothérapie &gt;24h pour maintenir SpO2 &gt;90% (ou &gt;92-95% si patho respi chronique)' },
    { key: 'peOnAnticoag', label: 'EP diagnostiquée sous anticoagulation curative' },
    { key: 'severePain', label: 'Douleur sévère nécessitant analgésiques IV &gt;24h' },
    { key: 'socialReasons', label: 'Raison médicale ou sociale nécessitant admission &gt;24h (ex: absence de soutien à domicile, comorbidités importantes)' },
    { key: 'renalImpairment', label: 'Clairance créatinine &lt;30 mL/min' },
    { key: 'liverImpairment', label: 'Insuffisance hépatique sévère (Child-Pugh C)' },
    { key: 'pregnantHestia', label: 'Grossesse' },
    { key: 'hitHistory', label: 'Antécédent de thrombopénie induite à l\'héparine (TIH)' }
];


export const GENDER_OPTIONS = [
  { value: '', label: 'Sélectionner' },
  { value: 'male', label: 'Masculin' },
  { value: 'female', label: 'Féminin' },
];

export const CTPA_FINDINGS_OPTIONS = [
  { value: '', label: 'Sélectionner' },
  { value: 'central', label: 'Embolie centrale (tronc, branches principales)' },
  { value: 'segmental', label: 'Embolie segmentaire' },
  { value: 'subsegmental', label: 'Embolie sous-segmentaire' },
  { value: 'bilateral', label: 'Embolie bilatérale' },
  { value: 'massive', label: 'Embolie massive (&gt;50% lit vasculaire)' },
];

export const RENAL_FUNCTION_OPTIONS = [
  { value: '', label: 'Sélectionner' },
  { value: 'normal', label: 'Normale (ClCr ≥ 50 mL/min)' },
  { value: 'moderate', label: 'Modérément altérée (ClCr 30-49 mL/min)' },
  { value: 'severe', label: 'Sévèrement altérée (ClCr &lt; 30 mL/min)' },
];

export const ANTICOAGULANT_OPTIONS = {
  general: {
    doacs: ['Rivaroxaban (Xarelto®)', 'Apixaban (Eliquis®)', 'Edoxaban (Lixiana®)', 'Dabigatran (Pradaxa®)'],
    lmwh: ['Enoxaparine (Lovenox®)', 'Tinzaparine (Innohep®)', 'Daltéparine (Fragmin®)'],
    warfarin: ['Warfarine (Coumadine®)'],
    ufh: ['Héparine Non Fractionnée (HNF)']
  },
  pregnant: {
    lmwh: ['Enoxaparine (Lovenox®)', 'Tinzaparine (Innohep®)', 'Daltéparine (Fragmin®)'],
    ufh: ['Héparine Non Fractionnée (HNF)']
  },
  cancer: {
    lmwh: ['Enoxaparine (Lovenox®)', 'Tinzaparine (Innohep®)', 'Daltéparine (Fragmin®)'],
    doacs: ['Edoxaban (Lixiana®)', 'Rivaroxaban (Xarelto®)', 'Apixaban (Eliquis®)'],
  }
};

export const TREATMENT_DOSING = {
  rivaroxaban: "15 mg BID pendant 21 jours, puis 20 mg OD. Peut être réduit à 10 mg OD après 6 mois si traitement prolongé.",
  apixaban: "10 mg BID pendant 7 jours, puis 5 mg BID. Peut être réduit à 2.5 mg BID après 6 mois si traitement prolongé.",
  edoxaban: "60 mg OD (ou 30 mg OD si ClCr 15-50 mL/min, poids ≤60 kg, ou inhibiteur P-gp puissant). Précédé par LMWH/UFH pendant au moins 5 jours.",
  dabigatran: "150 mg BID (ou 110 mg BID si âge ≥80 ans ou ClCr 30-50 mL/min avec risque hémorragique élevé). Précédé par LMWH/UFH pendant au moins 5 jours.",
  enoxaparin_curative: "1 mg/kg BID SC, ou 1.5 mg/kg OD SC.",
  enoxaparin_cancer: "1 mg/kg BID SC (préféré pour les 3-6 premiers mois). Alternative : 1.5 mg/kg OD SC.",
  enoxaparin_renal_moderate: "1 mg/kg OD SC (si ClCr 15-29 mL/min pour indication TVP/EP). Prudence.",
  enoxaparin_pregnancy: "1 mg/kg BID SC, ou 1.5 mg/kg OD SC. Doses ajustées au poids de grossesse. Surveillance anti-Xa peut être utile.",
  warfarin: "Dose initiale 5-10 mg, puis ajuster selon INR (cible 2.0-3.0). Nécessite un chevauchement avec LMWH/UFH pendant au moins 5 jours ET INR ≥2.0 pendant 24h.",
  ufh_curative: "Bolus 80 UI/kg (max 5000 UI), puis perfusion 18 UI/kg/h (max 1250 UI/h). Ajuster selon TCA (cible 1.5-2.5x la normale).",
  alteplase: "100 mg en 2 heures IV. Ou 0.6 mg/kg sur 15 min (max 50mg) pour arrêt cardiaque."
};

export const TREATMENT_DURATION_GUIDELINES = {
  provoked_transient: "3 mois.",
  unprovoked_first: "Au moins 3-6 mois, puis réévaluation pour traitement prolongé (considérer risque récidive vs hémorragie).",
  unprovoked_recurrent: "Traitement prolongé (souvent à vie) si risque hémorragique acceptable.",
  cancer: "Traitement prolongé (indéfini) tant que le cancer est actif ou sous traitement. Au moins 6 mois.",
  pregnancy: "Pendant toute la grossesse ET au moins 6 semaines post-partum (total minimum 3 mois)."
};

export const MONITORING_DATA: AnticoagulantMonitoringInfo[] = [
  {
    anticoagulant: "HBPM (ex: Enoxaparine)",
    tests: [
      { test: "NFS (Plaquettes)", frequency: "Tous les 2-3 jours de J6 à J14, puis tous les 1-3 mois.", condition: "Thrombopénie", interpretation: "Arrêter HBPM. Envisager inhibiteur direct de la thrombine si TIH suspectée." },
      { test: "Créatininémie", frequency: "Tous les 1-3 mois ou si changement fonction rénale/saignement.", interpretation: "Ajuster la dose d'énoxaparine si nécessaire." },
      { test: "Poids du patient", frequency: "Tous les 1-3 mois.", interpretation: "Ajuster la dose d'énoxaparine si nécessaire." },
      { test: "Anti-Xa", frequency: "Populations spéciales (IR sévère CrCl <30, grossesse, obésité morbide). Pic 4h post-dose après min 3 doses.", interpretation: "Cible 0.5-1.0 UI/mL (pour 2 inj/j) ou 1.0-2.0 UI/mL (pour 1 inj/j, moins validé)." }
    ]
  },
  {
    anticoagulant: "Héparine Non Fractionnée (HNF)",
    tests: [
      { test: "NFS (Plaquettes)", frequency: "Tous les 2-3 jours de J6 à J14, puis tous les 1-3 mois.", condition: "TIH (Thrombopénie Induite par Héparine)", interpretation: "Arrêter Héparine. Envisager inhibiteur direct de la thrombine." },
      { test: "TCA", frequency: "6h post bolus et 6h après chaque changement de dose, puis quotidiennement une fois stable.", interpretation: "Ajuster la dose pour maintenir TCA cible (ex: 1.5-2.5x la normale)." }
    ]
  },
  {
    anticoagulant: "Warfarine (AVK)",
    tests: [
      { test: "NFS", frequency: "Annuellement.", condition: "Thrombopénie", interpretation: "Surveiller." },
      { test: "INR", frequency: "Tous les 1-3 jours jusqu'à 2 INR consécutifs dans la cible, puis espacer progressivement (max 12 semaines entre les tests).", condition: "Hypercoagulabilité ou Hypocoagulabilité induite par Warfarine", interpretation: "Ajuster la dose selon la cible INR (généralement 2.0-3.0)." }
    ]
  },
  {
    anticoagulant: "Dabigatran (Pradaxa®)",
    tests: [
      { test: "NFS", frequency: "Annuellement, ou si saignement.", interpretation: "Surveiller." },
      { test: "Créatininémie/ClCr", frequency: "Annuellement. Tous les 3-6 mois si ClCr 30-49 mL/min ou âge >75 ans.", interpretation: "Arrêter si ClCr < 30 mL/min. Ajuster dose si ClCr 30-50 mL/min et risque hémorragique." }
    ]
  },
  {
    anticoagulant: "Rivaroxaban (Xarelto®)",
    tests: [
      { test: "NFS", frequency: "Annuellement, ou si saignement.", interpretation: "Surveiller." },
      { test: "Créatininémie/ClCr", frequency: "Annuellement. Tous les 3-6 mois si ClCr 30-49 mL/min ou âge >75 ans.", interpretation: "Arrêter si ClCr < 15 mL/min (certains disent <30). Prudence et ajustement/éviter si ClCr 15-49 mL/min." },
      { test: "Bilan hépatique (ASAT, ALAT, Bili)", frequency: "Annuellement, ou si symptômes.", condition: "Insuffisance hépatique", interpretation: "Arrêter si Child-Pugh B ou C modérée à sévère, ou maladie hépatique avec coagulopathie." }
    ]
  },
  {
    anticoagulant: "Apixaban (Eliquis®)",
    tests: [
      { test: "NFS", frequency: "Annuellement, ou si saignement.", interpretation: "Surveiller." },
      { test: "Créatininémie/ClCr", frequency: "Annuellement. Plus fréquemment si ClCr limite ou âge >75 ans.", interpretation: "Prudence et ajustement de dose si ClCr 15-29 mL/min (2.5 mg BID). Éviter si ClCr <15 mL/min." },
      { test: "Bilan hépatique", frequency: "Annuellement, ou si symptômes.", condition: "Insuffisance hépatique", interpretation: "Arrêter si Child-Pugh C sévère. Prudence si Child-Pugh B modérée." }
    ]
  },
  {
    anticoagulant: "Edoxaban (Lixiana®)",
    tests: [
      { test: "NFS", frequency: "Annuellement, ou si saignement.", interpretation: "Surveiller." },
      { test: "Créatininémie/ClCr", frequency: "Annuellement. Plus fréquemment si ClCr limite ou âge >75 ans.", interpretation: "Ajuster dose à 30 mg OD si ClCr 15-50 mL/min. Éviter si ClCr <15 mL/min ou >95 mL/min (moins d'efficacité dans certaines études FA, prudence EP)." },
      { test: "Bilan hépatique", frequency: "Annuellement, ou si symptômes.", condition: "Insuffisance hépatique", interpretation: "Prudence si insuffisance hépatique modérée. Éviter si sévère." }
    ]
  }
];

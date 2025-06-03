
import { ClinicalData, Results, DdimerUnit, FormItem } from './types';

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
};

export const INITIAL_RESULTS: Results = {
  wellsScore: 0,
  wellsCategory: '',
  percCriteriaMet: 0,
  percPositive: false,
  yearsCriteriaMet: 0,
  yearsCategory: '',
  ddimerThreshold: 0.5, // Default for mg/L
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
  { key: 'oxygenSat' as any, label: 'SpO2 < 95% à l\'air ambiant', auto: (data) => parseFloat(data.oxygenSat) < 95 },
  { key: 'legSwelling', label: 'Œdème unilatéral de jambe' },
  { key: 'hemoptysis', label: 'Hémoptysie' }, // Repeated from Wells, but part of PERC
  { key: 'recentSurgery', label: 'Chirurgie ou traumatisme récent (<4 semaines)' },
  { key: 'priorVTE', label: 'Antécédent de TVP/EP' }, // Repeated
  { key: 'hormones', label: 'Prise d\'œstrogènes' }
];

export const YEARS_CRITERIA_ITEMS: FormItem[] = [
  { key: 'yearsDVT', label: 'Signes cliniques de TVP' },
  { key: 'yearsHemoptysis', label: 'Hémoptysie' },
  { key: 'yearsPELikely', label: 'EP diagnostic le plus probable (selon le clinicien)' }
];

export const HESTIA_CRITERIA_ITEMS: FormItem[] = [
    { key: 'hemodynamicallyUnstable', label: 'Instabilité hémodynamique (PAS <100 mmHg ou FC >100 bpm)' },
    { key: 'thrombolysisNeeded', label: 'Thrombolyse ou embolectomie nécessaire' },
    { key: 'activeBleeding', label: 'Saignement actif ou risque hémorragique élevé (ex: plaquettes < 75 G/L, TA > 180/110 non contrôlée)' },
    { key: 'oxygenNeeded', label: 'Oxygénothérapie >24h pour maintenir SpO2 >90% (ou >92-95% si patho respi chronique)' },
    { key: 'peOnAnticoag', label: 'EP diagnostiquée sous anticoagulation curative' },
    { key: 'severePain', label: 'Douleur sévère nécessitant analgésiques IV >24h' },
    { key: 'socialReasons', label: 'Raison médicale ou sociale nécessitant admission >24h (ex: absence de soutien à domicile, comorbidités importantes)' },
    { key: 'renalImpairment', label: 'Clairance créatinine <30 mL/min' },
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
  { value: 'massive', label: 'Embolie massive (>50% lit vasculaire)' },
];

export const RENAL_FUNCTION_OPTIONS = [
  { value: '', label: 'Sélectionner' },
  { value: 'normal', label: 'Normale (ClCr ≥ 50 mL/min)' },
  { value: 'moderate', label: 'Modérément altérée (ClCr 30-49 mL/min)' },
  { value: 'severe', label: 'Sévèrement altérée (ClCr < 30 mL/min)' },
];
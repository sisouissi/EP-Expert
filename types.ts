
export type PatientType = 'non-pregnant' | 'pregnant' | '';

export type Step = 
  | 'home' 
  | 'clinical-assessment' 
  | 'diagnostic-recommendations' 
  | 'risk-stratification' 
  | 'treatment-recommendations' 
  | 'disposition';

export type DdimerUnit = 'mg/L' | 'µg/L' | 'ng/mL';

export interface ClinicalData {
  age: string;
  gender: 'male' | 'female' | '';
  pregnant: boolean;
  // Wells Criteria
  clinicalDVT: boolean;
  peFirstDiagnosis: boolean;
  heartRate: string;
  immobilization: boolean;
  previousVTE: boolean;
  hemoptysis: boolean;
  malignancy: boolean;
  // PERC Criteria (some are derived, some input)
  ageOver50: boolean; // Derived
  hrOver100: boolean; // Derived
  oxygenSat: string;
  legSwelling: boolean; // This is 'unilateral leg swelling'
  recentSurgery: boolean; // This is 'surgery/trauma requiring hospitalization in previous 4 weeks'
  priorVTE: boolean; // This is 'prior DVT/PE'
  hormones: boolean; // This is 'estrogen use'
  // YEARS Criteria
  yearsDVT: boolean;
  yearsHemoptysis: boolean;
  yearsPELikely: boolean;
  // D-dimer
  ddimer: string;
  ddimerUnit: DdimerUnit;
  // Risk factors for stratification
  sbp: string; // Systolic Blood Pressure
  troponin: boolean;
  bnp: boolean; // or NT-proBNP
  rvDysfunction: boolean; // Echo or CT
  ctpaFindings: 'central' | 'segmental' | 'subsegmental' | 'bilateral' | 'massive' | '';
  // Treatment factors
  peConfirmed: boolean;
  bleedingRisk: boolean; // High bleeding risk
  renalFunction: 'normal' | 'moderate' | 'severe' | ''; // ClCr based
  // Hestia criteria
  hemodynamicallyUnstable: boolean; // For Hestia specifically (PAS <100 or HR >100)
  thrombolysisNeeded: boolean;
  activeBleeding: boolean;
  oxygenNeeded: boolean; // SpO2 < 90% > 24h
  peOnAnticoag: boolean;
  severePain: boolean; // IV analgesia > 24h
  socialReasons: boolean; // Medical or social reason for admission > 24h
  renalImpairment: boolean; // ClCr < 30 mL/min for Hestia
  liverImpairment: boolean; // Severe (Child-Pugh C)
  pregnantHestia: boolean; // For Hestia, pregnancy is a criterion
  hitHistory: boolean; // History of HIT
}

export interface Results {
  wellsScore: number;
  wellsCategory: string;
  percCriteriaMet: number;
  percPositive: boolean;
  yearsCriteriaMet: number;
  yearsCategory: string;
  ddimerThreshold: number;
  hestiaScore: number;
  outpatientEligible: boolean;
  peRiskLevel: 'low' | 'intermediate' | 'high' | '';
}

export interface FormItem<T = boolean> {
  key: keyof ClinicalData;
  label: string;
  points?: number;
  auto?: (data: ClinicalData) => T; 
}
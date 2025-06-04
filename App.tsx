
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Heart, Stethoscope, AlertTriangle, CheckCircle, XCircle, Info, Calculator, FileText, Home, User, Baby, Activity, ShieldCheck, UserCheck, PlusCircle, ShieldAlert, RadioTower, TestTube2, Pill, Clock, HelpCircle, CalendarDays, ListChecks, Microscope, Printer, BookOpen, X } from 'lucide-react';
import { ClinicalData, Results, PatientType, Step, FormItem, AnticoagulantMonitoringInfo, Abbreviation } from './types';
import { INITIAL_CLINICAL_DATA, INITIAL_RESULTS, DDIMER_UNITS, WELLS_CRITERIA_ITEMS, PERC_CRITERIA_ITEMS, YEARS_CRITERIA_ITEMS, HESTIA_CRITERIA_ITEMS, GENDER_OPTIONS, CTPA_FINDINGS_OPTIONS, RENAL_FUNCTION_OPTIONS, ANTICOAGULANT_OPTIONS, TREATMENT_DOSING, TREATMENT_DURATION_GUIDELINES, MONITORING_DATA, ABBREVIATIONS_LIST } from './constants';
import { Input, Select, Checkbox } from './components/shared/FormElements';
import { SectionCard } from './components/shared/SectionCard';
import { AlertBox } from './components/shared/AlertBox';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [patientType, setPatientType] = useState<PatientType>('');
  const [clinicalData, setClinicalData] = useState<ClinicalData>(INITIAL_CLINICAL_DATA);
  const [results, setResults] = useState<Results>(INITIAL_RESULTS);
  const [showAbbreviationsModal, setShowAbbreviationsModal] = useState<boolean>(false);


  const resetState = useCallback(() => {
    // Preserve patient name if user wants to start a new case for the same patient
    // but reset everything else. Or clear it if it's a truly new patient.
    // For now, let's clear it for a full reset. User can re-enter.
    setClinicalData(INITIAL_CLINICAL_DATA);
    setResults(INITIAL_RESULTS);
    setPatientType('');
    setCurrentStep('home');
    setShowAbbreviationsModal(false);
  }, []);

  const calculateScores = useCallback(() => {
    // Wells Score
    let wellsScore = 0;
    if (clinicalData.clinicalDVT) wellsScore += 3;
    if (clinicalData.peFirstDiagnosis) wellsScore += 3;
    if (parseInt(clinicalData.heartRate) > 100) wellsScore += 1.5;
    if (clinicalData.immobilization) wellsScore += 1.5;
    if (clinicalData.previousVTE) wellsScore += 1.5;
    if (clinicalData.hemoptysis) wellsScore += 1;
    if (clinicalData.malignancy) wellsScore += 1;

    let wellsCategory = '';
    if (wellsScore <= 1) wellsCategory = 'Faible (≤1)';
    else if (wellsScore <= 4 && patientType === 'active-cancer') wellsCategory = 'Faible/Modérée (≤4)'; // Page 6 threshold for cancer
    else if (wellsScore <= 6) wellsCategory = 'Modérée (2-6)';
    else wellsCategory = 'Élevée (&gt;6)';
    if (wellsScore >= 5 && patientType === 'active-cancer') wellsCategory = 'Élevée (≥5)'; // Page 6 threshold for cancer


    // PERC Score
    let percCriteriaMet = 0;
    if (clinicalData.ageOver50) percCriteriaMet++;
    if (clinicalData.hrOver100) percCriteriaMet++;
    if (parseFloat(clinicalData.oxygenSat) < 95) percCriteriaMet++;
    if (clinicalData.legSwelling) percCriteriaMet++;
    if (clinicalData.hemoptysis) percCriteriaMet++;
    if (clinicalData.recentSurgery) percCriteriaMet++;
    if (clinicalData.priorVTE) percCriteriaMet++;
    if (clinicalData.hormones) percCriteriaMet++;
    const percPositive = percCriteriaMet > 0;
    
    // YEARS Criteria
    let yearsCriteriaMet = 0;
    if (clinicalData.yearsDVT) yearsCriteriaMet++;
    if (clinicalData.yearsHemoptysis) yearsCriteriaMet++;
    if (clinicalData.yearsPELikely) yearsCriteriaMet++;
    const yearsCategory = yearsCriteriaMet === 0 ? '0 critère' : `${yearsCriteriaMet} critère(s)`;

    // D-dimer Threshold (in mg/L FEU)
    const ageNum = parseInt(clinicalData.age);
    let ddimerThresholdValue: number;
    const baseAgeAdjustedDdimerCutoff = (ageNum > 50 && !isNaN(ageNum)) ? ageNum * 0.01 : 0.5;

    if (patientType === 'active-cancer') {
        ddimerThresholdValue = baseAgeAdjustedDdimerCutoff;
    } else if (patientType === 'pregnant') {
        if (results.yearsCriteriaMet === 0) { 
            ddimerThresholdValue = Math.max(1.0, baseAgeAdjustedDdimerCutoff);
        } else { 
            ddimerThresholdValue = Math.max(0.5, baseAgeAdjustedDdimerCutoff);
        }
    } else { // Non-pregnant, non-cancer
         if (wellsScore <= 1) { 
            if (results.yearsCriteriaMet === 0) {
                ddimerThresholdValue = Math.max(1.0, baseAgeAdjustedDdimerCutoff);
            } else {
                ddimerThresholdValue = Math.max(0.5, baseAgeAdjustedDdimerCutoff);
            }
        } else if (wellsScore <= 6 ) { 
             if (results.yearsCriteriaMet === 0) {
                ddimerThresholdValue = Math.max(1.0, baseAgeAdjustedDdimerCutoff);
            } else {
                ddimerThresholdValue = Math.max(0.5, baseAgeAdjustedDdimerCutoff);
            }
        }
         else { 
            ddimerThresholdValue = baseAgeAdjustedDdimerCutoff;
        }
    }
     if (ddimerThresholdValue === undefined) ddimerThresholdValue = 0.5;


    // Hestia Score
    let hestiaScore = 0;
    if (clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 100) || (clinicalData.heartRate !== '' && parseInt(clinicalData.heartRate) > 100) ) hestiaScore++; 
    if (clinicalData.thrombolysisNeeded) hestiaScore++;
    if (clinicalData.activeBleeding) hestiaScore++; 
    if (clinicalData.oxygenNeeded || (clinicalData.oxygenSat !== '' && parseFloat(clinicalData.oxygenSat) < 90)) hestiaScore++; 
    if (clinicalData.peOnAnticoag) hestiaScore++;
    if (clinicalData.severePain) hestiaScore++; 
    if (clinicalData.socialReasons) hestiaScore++;
    if (clinicalData.renalImpairment || clinicalData.renalFunction === 'severe') hestiaScore++; 
    if (clinicalData.liverImpairment) hestiaScore++; 
    if (clinicalData.pregnantHestia || clinicalData.pregnant) hestiaScore++;
    if (clinicalData.hitHistory) hestiaScore++;
    const outpatientEligible = hestiaScore === 0;

    // PE Risk Level (ESC like simplified)
    let peRiskLevelCalculated: Results['peRiskLevel'] = '';
    const isHighRiskHemodynamicallyUnstable = clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 90);
    const hasRVDysfunctionOrBiomarkers = clinicalData.rvDysfunction || clinicalData.troponin || clinicalData.bnp;

    if (isHighRiskHemodynamicallyUnstable) {
      peRiskLevelCalculated = 'high';
    } else if (hasRVDysfunctionOrBiomarkers) { 
      peRiskLevelCalculated = 'intermediate'; 
    } else {
      peRiskLevelCalculated = 'low';
    }
    
    setResults({
      wellsScore,
      wellsCategory,
      percCriteriaMet,
      percPositive,
      yearsCriteriaMet,
      yearsCategory,
      ddimerThreshold: ddimerThresholdValue,
      hestiaScore,
      outpatientEligible,
      peRiskLevel: peRiskLevelCalculated,
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicalData, patientType, results.yearsCriteriaMet]); // Added results.yearsCriteriaMet because it's used in ddimerThresholdValue calculation

  useEffect(() => {
    calculateScores();
  }, [calculateScores]);
  
  useEffect(() => {
    const ageNum = parseInt(clinicalData.age);
    const hrNum = parseInt(clinicalData.heartRate);
    const newAgeOver50 = !isNaN(ageNum) && ageNum >= 50;
    const newHrOver100 = !isNaN(hrNum) && hrNum >= 100;

    if (newAgeOver50 !== clinicalData.ageOver50 || newHrOver100 !== clinicalData.hrOver100) {
      setClinicalData(prev => ({
        ...prev,
        ageOver50: newAgeOver50,
        hrOver100: newHrOver100,
      }));
    }
  }, [clinicalData.age, clinicalData.heartRate, clinicalData.ageOver50, clinicalData.hrOver100]);

  const handleInputChange = (field: keyof ClinicalData, value: string | boolean | number | null) => {
    setClinicalData(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'pregnant' && value === true) {
        newState.gender = 'female';
        newState.pregnantHestia = true; 
      }
      if (field === 'pregnant' && value === false) {
        newState.pregnantHestia = false;
      }
      if (field === 'renalFunction' && value === 'severe') {
        newState.renalImpairment = true; 
      }
      if (field === 'renalFunction' && value !== 'severe') {
        newState.renalImpairment = false;
      }
      return newState;
    });
  };

  const getDisplayDdimerThreshold = () => {
    let displayThreshold = results.ddimerThreshold;
    let precision = 2;
    if (clinicalData.ddimerUnit === 'ng/mL' || clinicalData.ddimerUnit === 'µg/L') {
        displayThreshold = results.ddimerThreshold * 1000;
        precision = 0;
    }
    return displayThreshold.toFixed(precision);
  };
  
  const renderCheckboxItem = (item: FormItem, data: ClinicalData, color = "sky") => {
    let isChecked = item.auto ? item.auto(data) : (data[item.key] as boolean);
    let isDisabled = !!item.auto;

    if (item.key === 'malignancy' && patientType === 'active-cancer') {
        isChecked = true;
        isDisabled = true;
    }

    return (
       <Checkbox
        key={item.key as string}
        id={item.key as string}
        label={<span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: item.label + (item.points ? ` <span class="font-semibold text-${color}-600">(+${item.points})</span>` : '') }}></span>}
        checked={isChecked}
        onChange={(e) => !isDisabled && handleInputChange(item.key, e.target.checked)}
        disabled={isDisabled}
        containerClassName="mb-3"
        className={`mr-2 h-4 w-4 text-${color}-600 focus:ring-${color}-500 border-slate-300 rounded`}
      />
    );
  };

  const handlePrintReport = () => {
    const ddimerValue = parseFloat(clinicalData.ddimer);
    const ddimerPresent = !isNaN(ddimerValue);
    const ddimerIsPositive = ddimerPresent && ddimerValue >= results.ddimerThreshold;

    let diagnosticRecText = 'Non déterminé'; // Placeholder
    // Simplified determination of diagnostic recommendation for report
    if (patientType === 'active-cancer') {
        if (results.wellsScore <= 4) {
            if (clinicalData.chestXraySuggestsOtherDiagnosis === true) diagnosticRecText = "Radio thoracique positive pour un autre diagnostic. Traiter cette condition.";
            else if (clinicalData.chestXraySuggestsOtherDiagnosis === false) {
                if (ddimerPresent) diagnosticRecText = ddimerIsPositive ? "CTPA recommandé (Wells ≤4, RxT non-diag, D-dimères +)." : "EP peu probable (Wells ≤4, RxT non-diag, D-dimères -).";
                else diagnosticRecText = "D-dimères recommandés (Wells ≤4, RxT non-diag).";
            } else diagnosticRecText = "Radio thoracique et D-dimères recommandés.";
        } else diagnosticRecText = "CTPA direct recommandé (Wells ≥ 5).";
    } else if (patientType === 'pregnant') {
      diagnosticRecText = clinicalData.yearsDVT ? "Doppler MI recommandé. Si neg: considérer RxT puis CTPA/VQ." : "RxT puis CTPA/VQ si non diag. D-dimères peuvent aider.";
      if(ddimerPresent){
        diagnosticRecText += ddimerIsPositive ? " (D-dimères +)" : " (D-dimères -)";
      }
    } else {
        if (results.wellsScore <= 1) {
            if (!results.percPositive) diagnosticRecText = 'EP cliniquement exclue (Wells faible, PERC négatif).';
            else diagnosticRecText = ddimerPresent ? (ddimerIsPositive ? 'CTPA recommandé (D-dimères +).' : 'EP exclue (D-dimères -).') : 'D-dimères recommandés (Wells faible, PERC positif).';
        } else if (results.wellsScore <= 6) {
            diagnosticRecText = ddimerPresent ? (ddimerIsPositive ? 'CTPA recommandé (D-dimères +).' : 'EP exclue (D-dimères -).') : 'D-dimères recommandés (Wells modéré).';
        } else {
            diagnosticRecText = 'CTPA direct recommandé (Wells élevé).';
        }
    }
    
    const isHighRiskInput = clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 90);
    const hasRVDysfunction = clinicalData.rvDysfunction;
    const hasBiomarkers = clinicalData.troponin || clinicalData.bnp;
    let riskLevelText = "Non déterminé";
    if (isHighRiskInput) riskLevelText = "RISQUE ÉLEVÉ (Instabilité Hémodynamique)";
    else if (hasRVDysfunction && hasBiomarkers) riskLevelText = "RISQUE INTERMÉDIAIRE-ÉLEVÉ";
    else if (hasRVDysfunction || hasBiomarkers) riskLevelText = "RISQUE INTERMÉDIAIRE-FAIBLE";
    else riskLevelText = "RISQUE FAIBLE";


    let treatmentRecText = "Basé sur le niveau de risque et le profil patient (voir application)."; // Placeholder
    if (isHighRiskInput) treatmentRecText = "Reperfusion urgente (Thrombolyse/Embolectomie) + HNF IV. Soins intensifs.";
    else if (patientType === 'active-cancer') treatmentRecText = "HBPM ou AODs spécifiques (Edoxaban, Rivaroxaban, Apixaban). Durée: indéfinie si cancer actif.";
    else if (patientType === 'pregnant') treatmentRecText = `HBPM (${TREATMENT_DOSING.enoxaparin_pregnancy}). Durée: grossesse + 6 semaines post-partum.`;
    else if (clinicalData.renalFunction === 'severe') treatmentRecText = "HNF IV ou AVK. HBPM/AODs avec prudence/ajustement majeur.";
    else treatmentRecText = "AODs (1ère intention pour risque faible/intermédiaire-faible stable) ou HBPM/AVK. Durée selon provocation de l'EP.";
    
    let durationKey: keyof typeof TREATMENT_DURATION_GUIDELINES = 'unprovoked_first';
    if (patientType === 'active-cancer') durationKey = 'cancer';
    else if (patientType === 'pregnant') durationKey = 'pregnancy';
    else if (clinicalData.peProvoked) durationKey = 'provoked_transient';
    const durationText = TREATMENT_DURATION_GUIDELINES[durationKey];

    const reportHTML = `
      <html>
        <head>
          <title>Rapport Patient EP - ${clinicalData.patientName || 'N/A'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; font-size: 10pt; }
            @page { size: A4; margin: 1cm; }
            h1, h2, h3 { color: #333; margin-top: 1.5em; margin-bottom: 0.5em; }
            h1 { font-size: 16pt; text-align: center; border-bottom: 2px solid #333; padding-bottom: 5px; }
            h2 { font-size: 14pt; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
            h3 { font-size: 12pt; }
            .section { margin-bottom: 15px; padding-left: 10px; }
            .label { font-weight: bold; color: #555; }
            p { margin: 0.3em 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 9pt; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .value { margin-left: 5px; }
            .alert { padding: 10px; margin-top: 10px; border-radius: 4px; }
            .alert-info { background-color: #e7f3fe; border-left: 4px solid #2196F3; }
            .alert-success { background-color: #e8f5e9; border-left: 4px solid #4CAF50; }
            .alert-warning { background-color: #fff3e0; border-left: 4px solid #ff9800; }
            .alert-error { background-color: #ffebee; border-left: 4px solid #f44336; }
            .flex-container { display: flex; justify-content: space-between; }
            .flex-item { width: 48%; }
            ul { padding-left: 20px; margin: 0.3em 0; }
          </style>
        </head>
        <body>
          <h1>Rapport Embolie Pulmonaire</h1>
          
          <div class="section">
            <h2>Identification du Patient</h2>
            <p><span class="label">Nom:</span><span class="value">${clinicalData.patientName || 'Non spécifié'}</span></p>
            <p><span class="label">Âge:</span><span class="value">${clinicalData.age || 'N/A'} ans</span></p>
            <p><span class="label">Sexe:</span><span class="value">${clinicalData.gender || 'N/A'}</span></p>
            <p><span class="label">Type de Patient:</span><span class="value">${patientType === 'non-pregnant' ? 'Standard' : patientType === 'pregnant' ? 'Enceinte' : 'Cancer Actif'}</span></p>
          </div>

          <div class="section">
            <h2>Évaluation Clinique et Scores</h2>
            <div class="flex-container">
                <div class="flex-item">
                    <p><span class="label">Score de Wells:</span><span class="value">${results.wellsScore.toFixed(1)} (${results.wellsCategory})</span></p>
                    ${patientType !== 'pregnant' && patientType !== 'active-cancer' && results.wellsScore <= 1 ? `<p><span class="label">PERC:</span><span class="value">${results.percPositive ? `Positif (${results.percCriteriaMet} critère(s))` : 'Négatif'}</span></p>` : ''}
                    ${patientType !== 'active-cancer' ? `<p><span class="label">Critères YEARS:</span><span class="value">${results.yearsCategory}</span></p>` : ''}
                </div>
                <div class="flex-item">
                    ${ddimerPresent ? `<p><span class="label">D-Dimères:</span><span class="value">${clinicalData.ddimer} ${clinicalData.ddimerUnit} (Seuil: ${getDisplayDdimerThreshold()} ${clinicalData.ddimerUnit}) - ${ddimerIsPositive ? 'Positif' : 'Négatif'}</span></p>` : '<p><span class="label">D-Dimères:</span><span class="value">Non renseignés ou non applicables</span></p>'}
                    ${patientType === 'active-cancer' && results.wellsScore <=4 ? `<p><span class="label">Rx Thoracique (Cancer, Wells ≤4):</span><span class="value">${clinicalData.chestXrayPerformed ? (clinicalData.chestXraySuggestsOtherDiagnosis === true ? 'Autre diagnostic' : clinicalData.chestXraySuggestsOtherDiagnosis === false ? 'Non-diagnostique' : 'Non interprétée') : 'Non réalisée'}</span></p>` : ''}
                </div>
            </div>
          </div>
          
          <div class="section alert alert-info">
            <h2>Recommandation Diagnostique Principale</h2>
            <p>${diagnosticRecText}</p>
            ${clinicalData.ctpaPerformedCancer && patientType === 'active-cancer' ? `<p><span class="label">Résultat CTPA (Cancer):</span> ${clinicalData.ctpaPositiveCancer ? 'Positif pour EP' : 'Négatif pour EP'}</p>` : ''}
            ${clinicalData.peConfirmed && patientType !== 'active-cancer' ? `<p><span class="label">Confirmation EP par imagerie:</span> Oui</p>`: ''}
          </div>

          ${clinicalData.peConfirmed || (patientType === 'active-cancer' && clinicalData.ctpaPositiveCancer === true) ? `
          <div class="section">
            <h2>Stratification du Risque (EP Confirmée)</h2>
            <p><span class="label">Stabilité Hémodynamique (PAS):</span><span class="value">${clinicalData.sbp || 'N/A'} mmHg ${clinicalData.hemodynamicallyUnstable ? '(Instable)' : '(Stable)'}</span></p>
            <p><span class="label">Dysfonction VD:</span><span class="value">${clinicalData.rvDysfunction ? 'Oui' : 'Non'}</span></p>
            <p><span class="label">Biomarqueurs Cardiaques (Troponine/BNP):</span><span class="value">${clinicalData.troponin || clinicalData.bnp ? 'Positifs' : 'Négatifs'}</span></p>
            <div class="alert alert-warning">
                <p><span class="label">Niveau de Risque ESC:</span><span class="value">${riskLevelText}</span></p>
            </div>
            <p><span class="label">Critères HESTIA (pour ambulatoire):</span><span class="value">${results.hestiaScore} positifs - ${results.outpatientEligible ? 'Ambulatoire Possible' : 'Hospitalisation Recommandée'}</span></p>
          </div>

          <div class="section alert alert-success">
            <h2>Plan Thérapeutique</h2>
            <p><span class="label">Recommandation Générale:</span><span class="value">${treatmentRecText}</span></p>
            <p><span class="label">Durée du traitement:</span><span class="value">${durationText} (Facteur provoquant: ${clinicalData.peProvoked ? clinicalData.peProvokedFactorDetails || 'Oui' : 'Non'})</span></p>
            <p><span class="label">Fonction Rénale:</span><span class="value">${clinicalData.renalFunction || 'N/A'}</span></p>
            <p><span class="label">Risque Hémorragique élevé:</span><span class="value">${clinicalData.bleedingRisk ? 'Oui' : 'Non'}</span></p>
          </div>
          
          <div class="section">
            <h2>Suivi Recommandé</h2>
            <p>Consulter le tableau de suivi biologique pour l'anticoagulant spécifique prescrit.</p>
            <p>Suivi clinique régulier pour évaluer réponse, tolérance, observance, et symptômes persistants. Réévaluation à 3 mois pour la durée du traitement (sauf cas spécifiques).</p>
          </div>
          ` : `
           <div class="section alert alert-info">
            <p>La stratification du risque et le plan thérapeutique ne sont pas applicables ou l'EP n'est pas encore confirmée.</p>
           </div>
          `}
           <p style="text-align:center; font-size: 8pt; margin-top: 30px;">Ce rapport est généré par EP-Expert et ne remplace pas le jugement clinique. Vérifiez toutes les informations. Date: ${new Date().toLocaleDateString()}</p>
        </body>
      </html>
    `;
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHTML);
      reportWindow.document.close(); // Important for some browsers
      reportWindow.focus(); // Required for some browsers to allow print
      // Delay print to ensure content is loaded
      setTimeout(() => {
        reportWindow.print();
      }, 500); 
    }
  };

  const toggleAbbreviationsModal = () => setShowAbbreviationsModal(!showAbbreviationsModal);

  const renderHome = () => (
    <div className="max-w-5xl mx-auto animate-fadeIn px-4">
       {clinicalData.patientName && patientType && ( // Display if a case was started
        <div className="mb-8 text-center p-4 bg-sky-50 border border-sky-200 rounded-lg">
          <p className="text-lg text-sky-700">Cas en cours pour : <span className="font-semibold">{clinicalData.patientName}</span> <span className="text-sm">({patientType === 'non-pregnant' ? 'Standard' : patientType === 'pregnant' ? 'Enceinte' : 'Cancer Actif'})</span></p>
          <button 
            onClick={() => setCurrentStep('clinical-assessment')}
            className="mt-2 text-sm text-sky-600 hover:text-sky-800 font-medium underline"
          >
            Continuer l'évaluation
          </button>
        </div>
      )}
      <div className="text-center mb-12 pt-8">
        <div className="inline-block p-4 bg-red-100 rounded-full mb-6">
          <Heart className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
          Aide à la décision dans l'embolie pulmonaire
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Outil interactif pour guider les professionnels de santé dans le diagnostic et la prise en charge de l'embolie pulmonaire.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {[
          { type: 'non-pregnant', icon: UserCheck, title: 'Patient Standard', description: 'Évaluation avec Wells, PERC, YEARS.', color: 'sky', gradientFrom: 'from-sky-500', gradientTo: 'to-sky-700' },
          { type: 'pregnant', icon: Baby, title: 'Patiente Enceinte', description: 'Algorithme adapté (YEARS modifié).', color: 'pink', gradientFrom: 'from-pink-500', gradientTo: 'to-pink-700' },
          { type: 'active-cancer', icon: ShieldAlert, title: 'Patient avec Cancer Actif', description: 'Algorithme spécifique (Wells, RxT, D-Dimères).', color: 'amber', gradientFrom: 'from-amber-500', gradientTo: 'to-amber-700' }
        ].map(pt => (
          <button
            key={pt.type}
            className={`group relative text-left p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out overflow-hidden bg-gradient-to-br ${pt.gradientFrom} ${pt.gradientTo} text-white focus:outline-none focus:ring-4 focus:ring-${pt.color}-400 focus:ring-opacity-50`}
            onClick={() => {
              setPatientType(pt.type as PatientType);
              // Preserve patientName if it exists, otherwise reset relevant fields
              const currentName = clinicalData.patientName;
              const baseData = { ...INITIAL_CLINICAL_DATA, patientName: currentName };

              if (pt.type === 'pregnant') {
                setClinicalData({ ...baseData, pregnant: true, gender: 'female', pregnantHestia: true, malignancy: false, chestXraySuggestsOtherDiagnosis: null, chestXrayPerformed: false });
              } else if (pt.type === 'active-cancer') {
                setClinicalData({ ...baseData, malignancy: true, pregnant: false, pregnantHestia: false, chestXraySuggestsOtherDiagnosis: null, chestXrayPerformed: false });
              } else {
                 setClinicalData({ ...baseData, pregnant: false, pregnantHestia: false, malignancy: false, chestXraySuggestsOtherDiagnosis: null, chestXrayPerformed: false });
              }
              setCurrentStep('clinical-assessment');
            }}
          >
            <div className="relative z-10">
              <div className="mb-4">
                <pt.icon className={`h-12 w-12 text-white opacity-80`} />
              </div>
              <h3 className={`text-2xl font-semibold mb-2`}>{pt.title}</h3>
              <p className={`text-white opacity-90 mb-6 text-sm`}>{pt.description}</p>
              <div className={`inline-flex items-center font-medium bg-white bg-opacity-20 group-hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors`}>
                Commencer
                <ChevronRight className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
             <div className={`absolute -bottom-8 -right-8 text-white opacity-10 group-hover:opacity-15 transform group-hover:scale-110 transition-all duration-500`}>
                <pt.icon size={120}/>
             </div>
          </button>
        ))}
      </div>

      <SectionCard title="Fonctionnalités Principales" className="bg-white">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Calculator, title: 'Scores Automatisés', text: 'Wells, PERC, YEARS, Hestia.', color: 'sky' },
            { icon: ShieldCheck, title: 'Recommandations Basées sur Guidelines', text: 'Adaptées aux dernières données probantes.', color: 'emerald' },
            { icon: Activity, title: 'Adapté au Profil Patient', text: 'Prise en compte grossesse, cancer, comorbidités.', color: 'purple' }
          ].map(feat => (
            <div key={feat.title} className={`flex items-start p-6 bg-slate-50 rounded-xl border border-slate-200`}>
              <div className={`p-3 rounded-full bg-${feat.color}-100 mr-4`}>
                <feat.icon className={`h-6 w-6 text-${feat.color}-600`} />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-lg mb-1">{feat.title}</h4>
                <p className="text-sm text-slate-600">{feat.text}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
       <p className="text-center text-xs text-slate-500 mt-8">
        Développé pour les professionnels de santé. Ce calculateur ne remplace pas le jugement clinique.
      </p>
    </div>
  );
  
  const StepHeader: React.FC<{ title: string; subtitle: string; icon?: React.ElementType }> = ({ title, subtitle, icon: Icon }) => (
    <div className="mb-10 text-center">
      {Icon && <Icon className="h-12 w-12 text-sky-600 mx-auto mb-4" />}
      <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-600 text-lg max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );

  const renderClinicalAssessment = () => {
    const ddimerValue = parseFloat(clinicalData.ddimer);
    const ddimerPresent = !isNaN(ddimerValue);
    const ddimerIsPositiveForCancer = ddimerPresent && ddimerValue >= results.ddimerThreshold;

    let patientProfileSubtitle = 'Patient standard (pas de grossesse)';
    if (patientType === 'pregnant') patientProfileSubtitle = 'Patiente enceinte';
    if (patientType === 'active-cancer') patientProfileSubtitle = 'Patient avec cancer actif';

    return (
    <div className="max-w-6xl mx-auto animate-fadeIn px-4">
      <StepHeader 
        title="Évaluation Clinique Initiale"
        subtitle={`${patientProfileSubtitle} - Données cliniques et scores de probabilité.`}
        icon={Stethoscope}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Données Démographiques" className="lg:col-span-1" icon={<User size={20}/>}>
          <div className="space-y-5">
            <Input label="Nom du Patient (Optionnel)" type="text" value={clinicalData.patientName} onChange={(e) => handleInputChange('patientName', e.target.value)} placeholder="Prénom Nom" />
            <Input label="Âge (années)" type="number" value={clinicalData.age} onChange={(e) => handleInputChange('age', e.target.value)} placeholder="Ex: 45" />
            {patientType !== 'pregnant' && (
              <Select label="Sexe" value={clinicalData.gender} onChange={(e) => handleInputChange('gender', e.target.value as ClinicalData['gender'])} options={GENDER_OPTIONS} />
            )}
            {patientType === 'pregnant' && <div className="p-3 bg-pink-50 border border-pink-200 rounded-md text-sm text-pink-700">Sexe: Féminin (Patiente enceinte sélectionnée)</div>}
             <Input label="Fréquence cardiaque (bpm)" type="number" value={clinicalData.heartRate} onChange={(e) => handleInputChange('heartRate', e.target.value)} placeholder="Ex: 80" />
            <Input label="SpO2 (% à l'air ambiant)" type="number" value={clinicalData.oxygenSat} onChange={(e) => handleInputChange('oxygenSat', e.target.value)} placeholder="Ex: 98" min="0" max="100" />
          </div>
        </SectionCard>

        <SectionCard title="Score de Wells" className="lg:col-span-2" icon={<Calculator size={20}/>}>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
            {WELLS_CRITERIA_ITEMS.map(item => renderCheckboxItem(item, clinicalData, 'sky'))}
             <Checkbox
                key="wellsHeartRate"
                id="wellsHeartRate"
                label={<span className="text-sm text-slate-700">Fréquence cardiaque &gt; 100 bpm <span className="font-semibold text-sky-600">(+1.5)</span></span>}
                checked={parseInt(clinicalData.heartRate) > 100}
                disabled
                className="mr-2 h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded"
             />
          </div>
          <div className="mt-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
            <div className="text-md font-semibold text-sky-800">
              Score de Wells: {results.wellsScore.toFixed(1)} - <span className="font-bold">{results.wellsCategory}</span>
            </div>
          </div>
        </SectionCard>

        {patientType === 'active-cancer' && results.wellsScore <= 4 && (
            <SectionCard title="Radio Thoracique & D-Dimères (Cancer, Wells ≤4)" className="lg:col-span-3 bg-amber-50 border-amber-200" icon={<RadioTower size={20} className="text-amber-700"/>}>
                 <Checkbox 
                    label="Radio thoracique réalisée et interprétée ?"
                    checked={clinicalData.chestXrayPerformed}
                    onChange={(e) => handleInputChange('chestXrayPerformed', e.target.checked)}
                    containerClassName="mb-4"
                 />
                {clinicalData.chestXrayPerformed && (
                    <div className="mb-4 pl-6">
                        <p className="text-sm text-amber-800 mb-2">La radio thoracique suggère-t-elle un autre diagnostic (ex: pneumonie, pneumothorax, épanchement pleural important, masse) ?</p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => handleInputChange('chestXraySuggestsOtherDiagnosis', true)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${clinicalData.chestXraySuggestsOtherDiagnosis === true ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100'}`}>
                                Oui, autre diagnostic probable
                            </button>
                            <button 
                                onClick={() => handleInputChange('chestXraySuggestsOtherDiagnosis', false)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${clinicalData.chestXraySuggestsOtherDiagnosis === false ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100'}`}>
                                Non, pas d'autre diagnostic évident
                            </button>
                        </div>
                    </div>
                )}

                {clinicalData.chestXrayPerformed && clinicalData.chestXraySuggestsOtherDiagnosis === false && (
                    <div className="mt-6 pt-4 border-t border-amber-300">
                        <h4 className="text-md font-semibold text-amber-800 mb-3">Dosage des D-dimères (Cancer, Wells ≤4, RxT non diagnostique)</h4>
                        <div className="grid md:grid-cols-2 gap-6 items-end">
                            <Input label="Valeur des D-dimères" type="number" step="0.01" value={clinicalData.ddimer} onChange={(e) => handleInputChange('ddimer', e.target.value)} placeholder="Ex: 0.25" />
                            <Select label="Unité des D-dimères" value={clinicalData.ddimerUnit} onChange={(e) => handleInputChange('ddimerUnit', e.target.value as ClinicalData['ddimerUnit'])} options={DDIMER_UNITS.map(u => ({value: u, label: u}))} />
                        </div>
                         {ddimerPresent && (
                            <AlertBox
                                type={ddimerIsPositiveForCancer ? "error" : "success"}
                                title="Interprétation des D-dimères (Cancer)"
                                message={
                                    <>
                                    Valeur: {clinicalData.ddimer} {clinicalData.ddimerUnit}. Seuil (âge-ajusté): {getDisplayDdimerThreshold()} {clinicalData.ddimerUnit}.
                                    <br />
                                    Résultat: {ddimerIsPositiveForCancer ? 
                                        <span className="font-bold">Positif.</span> : 
                                        <span className="font-bold">Négatif.</span>
                                    }
                                    </>
                                }
                                className="mt-6"
                            />
                        )}
                    </div>
                )}
                 {clinicalData.chestXrayPerformed && clinicalData.chestXraySuggestsOtherDiagnosis === true && (
                     <AlertBox type="info" title="Orientation RxT" message="La radio thoracique suggère un autre diagnostic. Traiter cette condition en priorité. L'EP est moins probable." className="mt-4"/>
                 )}
            </SectionCard>
        )}


        {patientType !== 'active-cancer' && results.wellsScore <= 1 && patientType !== 'pregnant' && (
          <SectionCard title="Critères PERC (Si Wells faible et patient non-enceinte/non-cancer)" className="lg:col-span-3 bg-purple-50 border-purple-200" icon={<XCircle size={20} className="text-purple-700"/>}>
            <p className="text-sm text-purple-700 mb-4">Si score de Wells faible ET TOUS les critères PERC sont absents, l'EP peut être exclue sans D-dimères.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
              {PERC_CRITERIA_ITEMS.map(item => renderCheckboxItem(item, clinicalData, 'purple'))}
            </div>
            <AlertBox 
              type={results.percPositive ? "warning" : "success"}
              title="Résultat PERC"
              message={results.percPositive ? `Au moins un critère PERC est positif (${results.percCriteriaMet} critère(s)). L'EP n'est pas exclue par PERC. Procéder aux D-dimères.` : "Aucun critère PERC positif. L'EP est considérée comme exclue cliniquement."}
              className="mt-6"
            />
          </SectionCard>
        )}
        
        {patientType !== 'active-cancer' && (
            <SectionCard title="Critères YEARS" className="lg:col-span-3 bg-emerald-50 border-emerald-200" icon={<CalendarDays size={20} className="text-emerald-700"/>}>
            <p className="text-sm text-emerald-700 mb-4">Utilisés pour ajuster le seuil des D-dimères (si Wells non-élevé ou patiente enceinte).</p>
            <div className="grid md:grid-cols-3 gap-x-6 gap-y-2">
                {YEARS_CRITERIA_ITEMS.map(item => renderCheckboxItem(item, clinicalData, 'emerald'))}
            </div>
            <div className="mt-4 p-3 bg-emerald-100 rounded-lg">
                <div className="text-sm font-medium text-emerald-800">
                Critères YEARS présents: {results.yearsCategory}
                </div>
                { ( (patientType !== 'pregnant' && results.wellsScore <= 6) || patientType === 'pregnant' ) && 
                <div className="text-xs text-emerald-700 mt-1">
                Seuil D-dimères adapté (FEU): {results.ddimerThreshold.toFixed(2)} {clinicalData.ddimerUnit.startsWith('mg/L') ? clinicalData.ddimerUnit : `mg/L (équivalent ${getDisplayDdimerThreshold()} ${clinicalData.ddimerUnit})`}
                </div>
                }
            </div>
            </SectionCard>
        )}

        {patientType !== 'active-cancer' && (
            ((patientType === 'non-pregnant' && (results.wellsScore > 1 || (results.wellsScore <=1 && results.percPositive))) || patientType === 'pregnant') && 
            <SectionCard title="Dosage des D-dimères" className="lg:col-span-3" icon={<TestTube2 size={20}/>}>
            <div className="grid md:grid-cols-2 gap-6 items-end">
                <Input label="Valeur des D-dimères" type="number" step="0.01" value={clinicalData.ddimer} onChange={(e) => handleInputChange('ddimer', e.target.value)} placeholder="Ex: 0.25" />
                <Select label="Unité des D-dimères" value={clinicalData.ddimerUnit} onChange={(e) => handleInputChange('ddimerUnit', e.target.value as ClinicalData['ddimerUnit'])} options={DDIMER_UNITS.map(u => ({value: u, label: u}))} />
            </div>
            {ddimerPresent && (
                <AlertBox
                type={parseFloat(clinicalData.ddimer) < results.ddimerThreshold ? "success" : "error"}
                title="Interprétation des D-dimères"
                message={
                    <>
                    Valeur: {clinicalData.ddimer} {clinicalData.ddimerUnit}. Seuil adapté: {getDisplayDdimerThreshold()} {clinicalData.ddimerUnit}.
                    <br />
                    Résultat: {parseFloat(clinicalData.ddimer) < results.ddimerThreshold ? 
                        <span className="font-bold">Négatif (EP moins probable / exclue selon contexte).</span> : 
                        <span className="font-bold">Positif (EP suspectée, imagerie généralement nécessaire).</span>
                    }
                    </>
                }
                className="mt-6"
                />
            )}
            </SectionCard>
        )}
      </div>

      <div className="flex justify-between mt-12">
        <button onClick={() => setCurrentStep('home')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
          <ChevronLeft className="h-5 w-5 mr-2" /> Accueil
        </button>
        <button onClick={() => setCurrentStep('diagnostic-recommendations')} className="flex items-center px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors shadow-md hover:shadow-lg">
          Recommandations Diagnostiques <ChevronRight className="h-5 w-5 ml-2" />
        </button>
      </div>
    </div>
  );
  };
  
  const renderDiagnosticRecommendations = () => {
    const ddimerValue = parseFloat(clinicalData.ddimer);
    const ddimerPresent = !isNaN(ddimerValue);
    const ddimerIsPositive = ddimerPresent && ddimerValue >= results.ddimerThreshold;

    let recommendation = '';
    let nextStepInfo = '';
    let alertTypeMain: "info" | "success" | "warning" | "error" = 'info';

    if (patientType === 'active-cancer') {
        if (results.wellsScore <= 4) {
            if (!clinicalData.chestXrayPerformed || clinicalData.chestXraySuggestsOtherDiagnosis === null) {
                recommendation = "Wells ≤4. Radio thoracique et D-dimères (âge-ajusté) recommandés. Veuillez compléter ces informations à l'étape précédente.";
                alertTypeMain = 'info';
            } else if (clinicalData.chestXraySuggestsOtherDiagnosis === true) {
                recommendation = "Radio thoracique positive pour un autre diagnostic. Traiter cette condition.";
                nextStepInfo = "L'EP est moins probable. Surveillance clinique pour symptômes d'EP si le diagnostic alternatif n'explique pas tout.";
                alertTypeMain = 'success';
            } else if (clinicalData.chestXraySuggestsOtherDiagnosis === false) { // RxT non diagnostique
                if (!ddimerPresent) {
                     recommendation = "Wells ≤4, RxT non-diagnostique. Dosage des D-dimères (âge-ajusté) recommandé.";
                     nextStepInfo = `Seuil D-dimères (âge-ajusté): ${getDisplayDdimerThreshold()} ${clinicalData.ddimerUnit}.`;
                     alertTypeMain = 'info';
                } else if (ddimerIsPositive) {
                    recommendation = "Wells ≤4, RxT non-diagnostique, D-dimères positifs. Angioscanner pulmonaire (CTPA) recommandé.";
                    alertTypeMain = 'warning';
                } else { // D-dimer négatif
                    recommendation = "Wells ≤4, RxT non-diagnostique, D-dimères négatifs. EP peu probable.";
                    nextStepInfo = "Considérer d'autres diagnostics si les symptômes persistent.";
                    alertTypeMain = 'success';
                }
            }
        } else { // Wells score >= 5 for cancer patient
            recommendation = "Probabilité élevée (Wells ≥ 5). Angioscanner pulmonaire (CTPA) direct recommandé.";
            alertTypeMain = 'error';
            nextStepInfo = 'Procéder au CTPA sans D-dimères préalables.';
        }
    } else if (patientType === 'pregnant') {
        if (clinicalData.yearsDVT) { 
            recommendation = "Signes cliniques de TVP (ou symptômes de jambe). Échographie veineuse des membres inférieurs (Doppler de compression) recommandée en 1ère intention.";
            alertTypeMain = 'info';
            nextStepInfo = "Si écho positive pour TVP: traiter. Si écho négative: considérer Chest X-ray puis CTPA/VQ si X-ray non diagnostique et suspicion EP persiste. D-dimères peuvent être utiles si écho négative mais guidelines varient.";
        } else { 
             recommendation = "Absence de signes de TVP manifestes. Recommandation typique : Chest X-ray. Si non diagnostique et suspicion EP persiste, CTPA ou Scintigraphie V/Q.";
             alertTypeMain = 'info';
             nextStepInfo = "D-dimères (seuil adapté YEARS/âge si utilisé : " + getDisplayDdimerThreshold() + " " + clinicalData.ddimerUnit + ") peuvent aider mais leur place est débattue en grossesse. Préférer imagerie si suspicion forte.";
             if(ddimerPresent){
                 if(ddimerIsPositive) {
                     recommendation = `D-dimères positifs (${clinicalData.ddimer} ${clinicalData.ddimerUnit}). Chest X-ray puis CTPA/VQ si non diagnostique.`;
                     alertTypeMain = 'warning';
                 } else {
                     recommendation = `D-dimères négatifs (${clinicalData.ddimer} ${clinicalData.ddimerUnit}). EP moins probable.`;
                     alertTypeMain = 'success';
                 }
             }
        }
    } else { // Non-pregnant, non-cancer patient logic
        if (results.wellsScore <= 1) { 
            if (!results.percPositive) { 
                recommendation = 'Score de Wells faible ET critères PERC tous négatifs. EP cliniquement exclue.';
                alertTypeMain = 'success';
                nextStepInfo = 'Pas d\'examens complémentaires nécessaires pour EP. Rechercher un diagnostic alternatif.';
            } else { 
                if (ddimerPresent) {
                    recommendation = ddimerIsPositive ? 'D-dimères positifs. Angioscanner pulmonaire (CTPA) recommandé.' : 'D-dimères négatifs. EP exclue.';
                    alertTypeMain = ddimerIsPositive ? 'warning' : 'success';
                    nextStepInfo = ddimerIsPositive ? 'Procéder à l\'imagerie.' : 'Rechercher un diagnostic alternatif.';
                } else {
                    recommendation = 'Wells faible mais PERC non négatif. Dosage des D-dimères.';
                    alertTypeMain = 'info';
                    nextStepInfo = `Seuil adapté (YEARS/âge): ${getDisplayDdimerThreshold()} ${clinicalData.ddimerUnit}. Si négatifs, EP exclue. Si positifs, CTPA.`;
                }
            }
        } else if (results.wellsScore <= 6) { 
            if (ddimerPresent) {
                recommendation = ddimerIsPositive ? 'D-dimères positifs. Angioscanner pulmonaire (CTPA) recommandé.' : 'D-dimères négatifs. EP exclue.';
                alertTypeMain = ddimerIsPositive ? 'warning' : 'success';
                 nextStepInfo = ddimerIsPositive ? 'Procéder à l\'imagerie.' : 'Rechercher un diagnostic alternatif.';
            } else {
                recommendation = 'Wells modéré. Dosage des D-dimères.';
                alertTypeMain = 'info';
                nextStepInfo = `Seuil adapté (YEARS/âge): ${getDisplayDdimerThreshold()} ${clinicalData.ddimerUnit}. Si négatifs, EP exclue. Si positifs, CTPA.`;
            }
        } else { 
            recommendation = 'Probabilité élevée (Wells &gt; 6). Angioscanner pulmonaire (CTPA) direct recommandé.';
            alertTypeMain = 'error';
            nextStepInfo = 'Procéder immédiatement au CTPA sans D-dimères préalables.';
        }
    }

    const canProceedToRiskStrat = clinicalData.peConfirmed || (patientType === 'active-cancer' && clinicalData.ctpaPerformedCancer && clinicalData.ctpaPositiveCancer === true) || (patientType==='pregnant' && recommendation.includes("traiter"));


    return (
      <div className="max-w-6xl mx-auto animate-fadeIn px-4">
        <StepHeader 
            title="Recommandations Diagnostiques"
            subtitle="Basées sur l'évaluation clinique, les scores et les D-dimères (si pertinents)."
            icon={FileText}
        />

        <SectionCard title="Résumé des Scores Calculés" className="mb-8" icon={<Calculator size={20}/>}>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 bg-sky-50 rounded-xl shadow-md border border-sky-200">
              <div className="flex items-center text-sky-700 mb-1">
                <Calculator className="h-6 w-6 mr-2" /> <h4 className="font-semibold text-lg">Score de Wells</h4>
              </div>
              <p className="text-3xl font-bold text-sky-600">{results.wellsScore.toFixed(1)}</p>
              <p className="text-md text-sky-700 font-medium">{results.wellsCategory}</p>
            </div>
            
            {patientType !== 'pregnant' && patientType !== 'active-cancer' && results.wellsScore <=1 && (
                 <div className={`p-5 rounded-xl shadow-md border ${results.percPositive ? 'bg-purple-50 border-purple-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`flex items-center mb-1 ${results.percPositive ? 'text-purple-700' : 'text-emerald-700'}`}>
                        <XCircle className="h-6 w-6 mr-2" /> <h4 className="font-semibold text-lg">Critères PERC</h4>
                    </div>
                    <p className={`text-xl font-bold ${results.percPositive ? 'text-purple-600' : 'text-emerald-600'}`}>
                        {results.percPositive ? `Positif (${results.percCriteriaMet} critère(s))` : 'Négatif'}
                    </p>
                </div>
            )}

            {patientType !== 'active-cancer' && ( 
                <div className="p-5 bg-teal-50 rounded-xl shadow-md border border-teal-200">
                <div className="flex items-center text-teal-700 mb-1">
                    <CalendarDays className="h-6 w-6 mr-2" /> <h4 className="font-semibold text-lg">Critères YEARS</h4>
                </div>
                <p className="text-xl font-bold text-teal-600">{results.yearsCategory}</p>
                <p className="text-sm text-teal-700">Seuil D-dimères (FEU): {results.ddimerThreshold.toFixed(2)} {clinicalData.ddimerUnit.startsWith('mg/L') ? clinicalData.ddimerUnit : `mg/L (équivalent ${getDisplayDdimerThreshold()} ${clinicalData.ddimerUnit})`}</p>
                </div>
            )}
             {patientType === 'active-cancer' && clinicalData.chestXrayPerformed && clinicalData.chestXraySuggestsOtherDiagnosis === false && (
                <div className="p-5 bg-amber-50 rounded-xl shadow-md border border-amber-200">
                    <div className="flex items-center text-amber-700 mb-1">
                        <TestTube2 className="h-6 w-6 mr-2" /> <h4 className="font-semibold text-lg">D-Dimères (Cancer)</h4>
                    </div>
                     {ddimerPresent ? 
                        <p className={`text-xl font-bold ${ddimerIsPositive ? 'text-red-600' : 'text-emerald-600'}`}>{ddimerIsPositive ? "Positif" : "Négatif"}</p> :
                        <p className="text-md text-amber-700">Non renseigné</p>
                     }
                    <p className="text-sm text-amber-700">Seuil âge-ajusté: {getDisplayDdimerThreshold()} {clinicalData.ddimerUnit}</p>
                </div>
             )}
          </div>
        </SectionCard>

        <AlertBox type={alertTypeMain} title="Recommandation Principale" message={<><p className="text-base mb-2">{recommendation}</p><p className="text-sm font-medium opacity-90">{nextStepInfo}</p></>} className="mb-8 !p-6 !rounded-xl" />
        
        {patientType === 'active-cancer' && 
         ((results.wellsScore <= 4 && clinicalData.chestXraySuggestsOtherDiagnosis === false && ddimerPresent && ddimerIsPositive) || results.wellsScore >= 5) &&
         !clinicalData.ctpaPerformedCancer && (
          <SectionCard title="Résultat Angioscanner Pulmonaire (CTPA)" className="bg-indigo-50 border-indigo-200 mb-8" icon={<Microscope size={20} className="text-indigo-700"/>}>
            <p className="text-sm text-indigo-700 mb-3">Le CTPA a-t-il été réalisé et est-il positif pour une embolie pulmonaire ?</p>
            <div className="flex space-x-4">
                <button 
                    onClick={() => {
                        handleInputChange('ctpaPerformedCancer', true);
                        handleInputChange('ctpaPositiveCancer', true);
                        handleInputChange('peConfirmed', true); 
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-emerald-500 hover:bg-emerald-600 text-white`}>
                    Oui, CTPA Positif
                </button>
                <button 
                    onClick={() => {
                        handleInputChange('ctpaPerformedCancer', true);
                        handleInputChange('ctpaPositiveCancer', false);
                        handleInputChange('peConfirmed', false);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors bg-red-500 hover:bg-red-600 text-white`}>
                    Non, CTPA Négatif
                </button>
            </div>
          </SectionCard>
        )}
        {clinicalData.ctpaPerformedCancer && clinicalData.ctpaPositiveCancer === false && (
             <AlertBox type="success" title="CTPA Négatif (Cancer)" message="L'angioscanner pulmonaire est négatif. L'embolie pulmonaire est exclue. Considérer d'autres diagnostics." className="mb-8"/>
        )}

        {patientType === 'pregnant' && (
          <SectionCard title="Considérations Spécifiques (Grossesse)" className="bg-pink-50 border-pink-200 mb-8" icon={<Baby size={20} className="text-pink-700"/>}>
            <ul className="space-y-2 text-sm text-pink-700 list-disc list-inside pl-2">
               { !clinicalData.yearsDVT && <li>L'échographie veineuse des membres inférieurs reste une option si une suspicion clinique de TVP se manifeste.</li>}
              <li>Si échographie positive pour TVP : traiter pour EP/TVP. Pas d'autre imagerie pulmonaire nécessaire.</li>
              <li>Pour imagerie pulmonaire (CTPA ou V/Q), le choix dépend de la disponibilité, expertise locale, et discussion multidisciplinaire. Faible exposition fœtale.</li>
              <li>Une consultation spécialisée (pneumologue, obstétricien, radiologue) est fortement recommandée.</li>
            </ul>
          </SectionCard>
        )}
        
        { ( (recommendation.toLowerCase().includes("angioscanner") || recommendation.toLowerCase().includes("imagerie pulmonaire")) && patientType !== 'active-cancer' && !clinicalData.peConfirmed ) && (
          <SectionCard title="Confirmation d'EP par Imagerie (Non-Cancer)" className="mb-8 bg-sky-50 border-sky-200" icon={<CheckCircle size={20} className="text-sky-700"/>}>
              <p className="text-slate-600 mb-4 text-sm">Si l'imagerie (CTPA, scintigraphie V/Q) confirme le diagnostic d'embolie pulmonaire, veuillez l'indiquer :</p>
              <button
                  onClick={() => {
                    handleInputChange('peConfirmed', true);
                  }}
                  className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-md transition-colors shadow-md hover:shadow-lg"
              >
                  EP Confirmée par Imagerie <Activity className="h-5 w-5 ml-3" />
              </button>
          </SectionCard>
        )}
        
        {canProceedToRiskStrat && (
             <SectionCard title="EP Confirmée ou Fortement Suspectée" className="mb-8 bg-emerald-50 border-emerald-200" icon={<ShieldCheck size={20} className="text-emerald-700"/>}>
                 <p className="text-emerald-700 mb-4 text-sm">Le diagnostic d'EP est confirmé ou les investigations y mènent. Procédez à la stratification du risque pour orienter la thérapie.</p>
                 <button
                     onClick={() => setCurrentStep('risk-stratification')}
                     className="w-full flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-md transition-colors shadow-md hover:shadow-lg"
                 >
                    Procéder à la Stratification du Risque <ChevronRight className="h-5 w-5 ml-2" />
                 </button>
             </SectionCard>
        )}


        <div className="flex justify-between mt-12">
          <button onClick={() => setCurrentStep('clinical-assessment')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
            <ChevronLeft className="h-5 w-5 mr-2" /> Retour Évaluation
          </button>
          {!(clinicalData.ctpaPerformedCancer && clinicalData.ctpaPositiveCancer === false) && !canProceedToRiskStrat &&
            <button onClick={resetState} className="flex items-center px-6 py-3 text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg font-medium transition-colors">
                <Home className="h-5 w-5 mr-2" /> Nouveau Patient
            </button>
          }
        </div>
      </div>
    );
  };
  
  const renderRiskStratification = () => {
     const isHighRiskInput = clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 90);
     const hasRVDysfunction = clinicalData.rvDysfunction;
     const hasBiomarkers = clinicalData.troponin || clinicalData.bnp;
     
     let riskCategoryDisplay: React.ReactNode = null;

     if (isHighRiskInput) {
        riskCategoryDisplay = <AlertBox type="error" title="RISQUE ÉLEVÉ (Instabilité Hémodynamique)" message={<><p className="mb-1">Choc ou hypotension. Risque de mortalité précoce &gt; 15%.</p> <strong className="mt-1 block">Recommandation : Thrombolyse systémique ou embolectomie en urgence. Anticoagulation (HNF). Soins intensifs.</strong></>} />;
     } else if (hasRVDysfunction && hasBiomarkers) {
        riskCategoryDisplay = <AlertBox type="warning" title="RISQUE INTERMÉDIAIRE-ÉLEVÉ" message={<><p className="mb-1">Stabilité hémodynamique MAIS dysfonction VD ET biomarqueurs positifs. Risque de mortalité 3-15%.</p><strong className="mt-1 block">Recommandation : Anticoagulation. Hospitalisation. Surveillance rapprochée. Discuter thrombolyse de sauvetage ou ttt. percutané si dégradation.</strong></>} />;
     } else if (hasRVDysfunction || hasBiomarkers) {
        riskCategoryDisplay = <AlertBox type="warning" title="RISQUE INTERMÉDIAIRE-FAIBLE" message={<><p className="mb-1">Stabilité hémodynamique ET dysfonction VD OU biomarqueurs positifs (un seul des deux). Risque de mortalité 3-15%.</p> <strong className="mt-1 block">Recommandation : Anticoagulation. Hospitalisation généralement.</strong></>} />;
     } else {
        riskCategoryDisplay = <AlertBox type="success" title="RISQUE FAIBLE" message={<><p className="mb-1">Stabilité hémodynamique, pas de dysfonction VD, pas de biomarqueurs positifs. Risque de mortalité &lt; 1-3%.</p> <strong className="mt-1 block">Recommandation : Anticoagulation. Traitement ambulatoire possible (critères HESTIA).</strong></>} />;
     }

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn px-4">
            <StepHeader 
                title="Stratification du Risque de l'EP Confirmée"
                subtitle="Évaluation de la sévérité pour adapter la prise en charge thérapeutique."
                icon={Activity}
            />

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <SectionCard title="Stabilité Hémodynamique" icon={<Heart size={20}/>}>
                    <div className="space-y-5">
                        <Input label="Pression Artérielle Systolique (PAS, mmHg)" type="number" value={clinicalData.sbp} onChange={(e) => handleInputChange('sbp', e.target.value)} placeholder="Ex: 120" />
                        <Checkbox label="Choc cardiogénique ou hypotension persistante (PAS &lt; 90 mmHg, ou chute &gt; 40 mmHg &gt; 15 min, non due à arythmie/hypovolémie/sepsis)" checked={clinicalData.hemodynamicallyUnstable} onChange={(e) => handleInputChange('hemodynamicallyUnstable', e.target.checked)} />
                        {clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 90 && !clinicalData.hemodynamicallyUnstable && 
                            <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md border border-red-200">Note: PAS actuelle &lt; 90 mmHg indique une instabilité.</p>}
                    </div>
                </SectionCard>

                <SectionCard title="Dysfonction VD & Biomarqueurs Cardiaques" icon={<Stethoscope size={20}/>}>
                     <div className="space-y-4">
                        <Checkbox label="Dysfonction Ventriculaire Droite (VD) à l'échocardiographie ou au CTPA" checked={clinicalData.rvDysfunction} onChange={(e) => handleInputChange('rvDysfunction', e.target.checked)} />
                        <Checkbox label="Élévation de la Troponine (I ou T)" checked={clinicalData.troponin} onChange={(e) => handleInputChange('troponin', e.target.checked)} />
                        <Checkbox label="Élévation du BNP / NT-proBNP" checked={clinicalData.bnp} onChange={(e) => handleInputChange('bnp', e.target.checked)} />
                    </div>
                </SectionCard>
                
                <SectionCard title="Autres Facteurs Pronostiques" className="lg:col-span-2" icon={<HelpCircle size={20}/>}>
                    <div className="grid md:grid-cols-2 gap-6">
                         <Select label="Localisation/Étendue au CTPA" value={clinicalData.ctpaFindings} onChange={(e) => handleInputChange('ctpaFindings', e.target.value as ClinicalData['ctpaFindings'])} options={CTPA_FINDINGS_OPTIONS} />
                         <Select label="Fonction Rénale (ClCr estimée)" value={clinicalData.renalFunction} onChange={(e) => handleInputChange('renalFunction', e.target.value as ClinicalData['renalFunction'])} options={RENAL_FUNCTION_OPTIONS} />
                    </div>
                    <Checkbox label="Risque hémorragique élevé identifié (contre-indication relative/absolue à la thrombolyse/anticoagulation intensive)" checked={clinicalData.bleedingRisk} onChange={(e) => handleInputChange('bleedingRisk', e.target.checked)} containerClassName="mt-6"/>
                     {patientType === 'active-cancer' && <p className="text-sm text-amber-700 mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">Note: Le cancer actif est un facteur de risque majeur de récidive et peut influencer le risque hémorragique.</p>}
                    <div className="mt-6 space-y-3">
                        <Checkbox label="EP Provoquée (par facteur de risque transitoire ou persistant identifiable)?" checked={clinicalData.peProvoked} onChange={(e) => handleInputChange('peProvoked', e.target.checked)} />
                        {clinicalData.peProvoked && (
                            <Input label="Détail du facteur provoquant (ex: chirurgie récente, immobilisation, cancer, contraception, etc.)" type="text" value={clinicalData.peProvokedFactorDetails} onChange={(e) => handleInputChange('peProvokedFactorDetails', e.target.value)} placeholder="Préciser le facteur"/>
                        )}
                    </div>
                </SectionCard>
            </div>
            
            <SectionCard title="Classification du Risque ESC et Orientation Thérapeutique" className="mb-8 !p-0" icon={<ShieldCheck size={20}/>}>
                <div className="p-6"> {riskCategoryDisplay ? riskCategoryDisplay : <p className="text-slate-500 text-center py-4">Remplissez les critères ci-dessus pour visualiser la classification du risque et les recommandations.</p>} </div>
                 <p className="text-xs text-slate-500 px-6 pb-4">Note: Le niveau de risque général calculé est '{results.peRiskLevel || 'non déterminé'}'. La classification ci-dessus affine cette évaluation pour une prise en charge optimale.</p>
            </SectionCard>

            <div className="flex justify-between mt-12">
                <button onClick={() => setCurrentStep('diagnostic-recommendations')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
                    <ChevronLeft className="h-5 w-5 mr-2" /> Précédent
                </button>
                <button onClick={() => setCurrentStep('treatment-recommendations')} className="flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-md hover:shadow-lg">
                    Recommandations Thérapeutiques <ChevronRight className="h-5 w-5 ml-2" />
                </button>
            </div>
        </div>
    );
  };
  
  const TreatmentDetail: React.FC<{title: string, content: string | string[], icon?: React.ElementType}> = ({title, content, icon: Icon}) => (
    <div className="mb-3">
        <div className="flex items-center text-slate-700 mb-1">
            {Icon && <Icon size={18} className="mr-2 text-sky-700"/>}
            <h5 className="font-semibold text-sm">{title}:</h5>
        </div>
        {Array.isArray(content) ? 
            <ul className="list-disc list-inside pl-4 text-xs text-slate-600 space-y-0.5">
                {content.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul> :
            <p className="text-xs text-slate-600 pl-4">{content}</p>
        }
    </div>
  );


  const renderTreatmentRecommendations = () => {
    const isHighRiskInput = clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 90);
    const hasRVDysfunction = clinicalData.rvDysfunction;
    const hasBiomarkers = clinicalData.troponin || clinicalData.bnp;
    
    const isTrueHighRisk = isHighRiskInput;
    const isTrueIntermediateHighRisk = !isHighRiskInput && hasRVDysfunction && hasBiomarkers;
    const isTrueIntermediateLowRisk = !isHighRiskInput && (hasRVDysfunction || hasBiomarkers) && !(hasRVDysfunction && hasBiomarkers);
    const isTrueLowRisk = !isHighRiskInput && !hasRVDysfunction && !hasBiomarkers;

    let durationKey: keyof typeof TREATMENT_DURATION_GUIDELINES = 'unprovoked_first';
    if (patientType === 'active-cancer') durationKey = 'cancer';
    else if (patientType === 'pregnant') durationKey = 'pregnancy';
    else if (clinicalData.peProvoked) durationKey = 'provoked_transient';
    
    const getDrugList = (type: 'doacs' | 'lmwh' | 'warfarin' | 'ufh') => {
        if (patientType === 'pregnant') return ANTICOAGULANT_OPTIONS.pregnant[type as 'lmwh' | 'ufh'] || [];
        if (patientType === 'active-cancer') return ANTICOAGULANT_OPTIONS.cancer[type as 'lmwh' | 'doacs'] || [];
        return ANTICOAGULANT_OPTIONS.general[type] || [];
    }
    
    const SpecificDosingDetails: React.FC<{ drugKey: keyof typeof TREATMENT_DOSING }> = ({ drugKey }) => (
        <p className="text-xs text-slate-500 pl-4 italic mt-0.5">{TREATMENT_DOSING[drugKey]}</p>
    );
    

    return (
    <div className="max-w-6xl mx-auto animate-fadeIn px-4">
        <StepHeader 
            title="Recommandations Thérapeutiques pour EP Confirmée"
            subtitle="Prise en charge adaptée au niveau de risque, aux comorbidités et situations spécifiques."
            icon={Pill}
        />

        <div className="space-y-8">
            {isTrueHighRisk && (
                <SectionCard title="Traitement - RISQUE ÉLEVÉ (Instabilité)" className="border-red-500 bg-red-50 shadow-xl" icon={<AlertTriangle className="text-red-600"/>}>
                    <AlertBox type="error" title="🚨 URGENCE VITALE - REPERFUSION IMMÉDIATE" message={
                        <div className="space-y-2 text-sm">
                           <TreatmentDetail title="Thrombolyse Systémique" content={["Altéplase (100mg/2h IV ou 0.6mg/kg sur 15min si arrêt cardiaque) ou Ténectéplase.", "À initier SANS DÉLAI si absence de contre-indication absolue."]} icon={Activity}/>
                           <TreatmentDetail title="Alternative si Contre-indication/Échec Thrombolyse" content="Embolectomie chirurgicale ou traitement percutané par cathéter." icon={HelpCircle}/>
                           <TreatmentDetail title="Anticoagulation Initiale" content="Héparine Non Fractionnée (HNF) IV." icon={Pill}/>
                           <SpecificDosingDetails drugKey="ufh_curative"/>
                           <TreatmentDetail title="Lieu de Soins" content="Admission en Unité de Soins Intensifs (USI) ou Réanimation." icon={Home}/>
                            {clinicalData.bleedingRisk && <p className="font-bold text-red-700 mt-2 text-xs">Risque hémorragique élevé noté : thrombolyse souvent contre-indiquée. Privilégier embolectomie/traitement percutané.</p>}
                        </div>
                    }/>
                </SectionCard>
            )}
            {(isTrueIntermediateHighRisk || isTrueIntermediateLowRisk) && (
                 <SectionCard title={`Traitement - RISQUE INTERMÉDIAIRE ${isTrueIntermediateHighRisk ? '(Élevé)' : '(Faible)'}`} className="border-amber-500 bg-amber-50 shadow-lg" icon={<AlertTriangle className="text-amber-600"/>}>
                     <AlertBox type="warning" title="⚠️ ANTICOAGULATION ET SURVEILLANCE RAPPROCHÉE" message={
                        <div className="space-y-2 text-sm">
                            <TreatmentDetail title="Anticoagulation Parentérale Initiale" content={["HBPM (ex: énoxaparine), Fondaparinux, ou HNF IV.", ...getDrugList('lmwh'), ...getDrugList('ufh')]} icon={Pill}/>
                            {patientType !== 'pregnant' && <SpecificDosingDetails drugKey="enoxaparin_curative"/>}
                            {patientType === 'pregnant' && <SpecificDosingDetails drugKey="enoxaparin_pregnancy"/>}
                            {TREATMENT_DOSING.ufh_curative && <SpecificDosingDetails drugKey="ufh_curative"/>}

                            <TreatmentDetail title="Relais Anticoagulant Oral (après stabilisation)" content={["AOD (Apixaban, Rivaroxaban, Edoxaban, Dabigatran) ou AVK.", ...getDrugList('doacs'), ...getDrugList('warfarin')]} icon={Pill}/>
                             <p className="text-xs text-slate-500 pl-4 italic">Détails posologiques: Apixaban - {TREATMENT_DOSING.apixaban}; Rivaroxaban - {TREATMENT_DOSING.rivaroxaban}; Edoxaban - {TREATMENT_DOSING.edoxaban}; Dabigatran - {TREATMENT_DOSING.dabigatran}; Warfarine - {TREATMENT_DOSING.warfarin}</p>
                            
                            <TreatmentDetail title="Lieu de Soins" content="Hospitalisation pour surveillance initiale, surtout si risque intermédiaire-élevé." icon={Home}/>
                            {isTrueIntermediateHighRisk && <TreatmentDetail title="Si Dégradation Hémodynamique" content="Thrombolyse de sauvetage ou traitement percutané." icon={Activity}/>}
                        </div>
                    }/>
                 </SectionCard>
            )}
            {isTrueLowRisk && (
                 <SectionCard title="Traitement - RISQUE FAIBLE" className="border-emerald-500 bg-emerald-50 shadow-lg" icon={<CheckCircle className="text-emerald-600"/>}>
                     <AlertBox type="success" title="✅ ANTICOAGULATION STANDARD" message={
                        <div className="space-y-2 text-sm">
                             <TreatmentDetail title="Anticoagulation (1ère intention AOD)" content={getDrugList('doacs')} icon={Pill}/>
                             <p className="text-xs text-slate-500 pl-4 italic">Détails posologiques: Apixaban - {TREATMENT_DOSING.apixaban}; Rivaroxaban - {TREATMENT_DOSING.rivaroxaban}; Edoxaban - {TREATMENT_DOSING.edoxaban}; Dabigatran - {TREATMENT_DOSING.dabigatran}.</p>
                            
                            <TreatmentDetail title="Alternatives" content={["HBPM/Fondaparinux puis relais AVK ou Edoxaban.", ...getDrugList('lmwh'), ...getDrugList('warfarin')]} icon={Pill}/>
                            {patientType !== 'pregnant' && <SpecificDosingDetails drugKey="enoxaparin_curative"/>}
                             <SpecificDosingDetails drugKey="warfarin"/>

                            <TreatmentDetail title="Lieu de Soins" content="Traitement ambulatoire possible si tous les critères HESTIA sont négatifs et conditions socio-familiales favorables (voir étape suivante)." icon={Home}/>
                        </div>
                    }/>
                 </SectionCard>
            )}

            <SectionCard title="Considérations Spécifiques et Comorbidités" icon={<ListChecks size={20}/>}>
                <div className="space-y-4">
                    {patientType === 'active-cancer' && ( 
                        <AlertBox type="info" title="🎗️ EP et Cancer Actif" message={
                            <div className="text-sm space-y-1">
                                <p><strong>Choix préférentiels :</strong> HBPM (ex: {TREATMENT_DOSING.enoxaparin_cancer}) ou certains AOD (Edoxaban, Rivaroxaban, Apixaban - évaluer risque hémorragique digestif/GU, type de cancer).</p>
                                <p><strong>Posologies AOD Cancer:</strong> Rivaroxaban - {TREATMENT_DOSING.rivaroxaban}; Apixaban - {TREATMENT_DOSING.apixaban}; Edoxaban - {TREATMENT_DOSING.edoxaban}</p>
                                <p>Apixaban peut être considéré si ClCr &lt; 30 mL/min (voir notes spécifiques).</p>
                                <p>Rivaroxaban : éviter si cancer GI/GU, risque hémorragique élevé, métastases cérébrales actives.</p>
                            </div>
                        } />
                    )}
                    {patientType === 'pregnant' && (
                         <AlertBox type="info" title="🤰 EP et Grossesse/Post-partum" message={
                             <div className="text-sm space-y-1">
                                 <p><strong>Traitement :</strong> HBPM à dose thérapeutique ({TREATMENT_DOSING.enoxaparin_pregnancy}).</p>
                                 <p>Surveillance anti-Xa possible. AVK et AOD contre-indiqués pendant la grossesse. HNF si risque hémorragique majeur ou accouchement imminent.</p>
                             </div>
                         } />
                    )}
                    {clinicalData.renalFunction === 'severe' && ( 
                        <AlertBox type="warning" title="🧊 EP et Insuffisance Rénale Sévère (ClCr &lt; 30 mL/min)" message={
                            <div className="text-sm space-y-1">
                                <p><strong>Options :</strong> HNF IV (monitorage TCA), AVK (monitorage INR attentif).</p>
                                <p>HBPM : prudence, {TREATMENT_DOSING.enoxaparin_renal_moderate}.</p>
                                <p>AOD : Apixaban 2.5mg x2/j si ClCr 15-29 + ≥2 critères (âge ≥80, poids ≤60kg). Majorité des autres AOD contre-indiqués ou à éviter.</p>
                                <p>Si ClCr &lt; 15 mL/min : HNF ou AVK souvent préférés. Hospitalisation avec héparine IV peut être plus sûre initialement.</p>
                            </div>
                        } />
                    )}
                     {clinicalData.renalFunction === 'moderate' && ( 
                        <AlertBox type="info" title="🧊 EP et Insuffisance Rénale Modérée (ClCr 30-49 mL/min)" message={
                            <div className="text-sm space-y-1">
                                <p><strong>HBPM :</strong> Généralement doses standard, mais prudence. Enoxaparine parfois réduite à 1mg/kg OD SC selon contexte.</p>
                                <p><strong>AOD :</strong> Dabigatran (110mg BID si risque hémorragique), Edoxaban (30mg OD). Rivaroxaban et Apixaban généralement doses standard mais prudence accrue.</p>
                                <p>Surveillance fonction rénale rapprochée.</p>
                            </div>
                        } />
                    )}
                </div>
            </SectionCard>

            <SectionCard title="Durée Recommandée du Traitement Anticoagulant" icon={<Clock size={20}/>}>
                 <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-1">EP Provoquée (facteur majeur transitoire résolu)</h4>
                        <p className="text-slate-600">• {TREATMENT_DURATION_GUIDELINES.provoked_transient} (Ex: {clinicalData.peProvokedFactorDetails || "chirurgie majeure, immobilisation, contraception oestroprogestative interrompue"})</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-1">EP Non Provoquée (idiopathique) ou Facteur Mineur/Persistant</h4>
                        <p className="text-slate-600">• 1er épisode: {TREATMENT_DURATION_GUIDELINES.unprovoked_first}</p>
                        <p className="text-slate-600">• Récidive EP non provoquée: {TREATMENT_DURATION_GUIDELINES.unprovoked_recurrent}</p>
                    </div>
                     {patientType === 'active-cancer' && (
                        <div className="md:col-span-2">
                             <h4 className="font-semibold text-slate-700 mb-1 text-amber-700">EP et Cancer Actif (Durée)</h4>
                             <p className="text-slate-600">• {TREATMENT_DURATION_GUIDELINES.cancer}</p>
                        </div>
                    )}
                    {patientType === 'pregnant' && (
                        <div className="md:col-span-2">
                             <h4 className="font-semibold text-slate-700 mb-1 text-pink-700">EP et Grossesse/Post-partum (Durée)</h4>
                             <p className="text-slate-600">• {TREATMENT_DURATION_GUIDELINES.pregnancy}</p>
                        </div>
                    )}
                 </div>
                 <p className="text-xs text-slate-500 mt-4">La décision de prolonger le traitement au-delà de la période initiale doit être individualisée (risque récidive vs risque hémorragique, préférences du patient).</p>
                 {clinicalData.bleedingRisk && <AlertBox type="warning" title="Risque Hémorragique Élevé" message="Pour les patients à haut risque hémorragique, la durée du traitement pourrait être plus courte, ou des doses réduites d'AOD envisagées pour le traitement prolongé." className="mt-4"/>}
            </SectionCard>
        </div>

        <div className="flex justify-between mt-12">
            <button onClick={() => setCurrentStep('risk-stratification')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
                <ChevronLeft className="h-5 w-5 mr-2" /> Précédent
            </button>
            <button onClick={() => setCurrentStep('disposition')} className="flex items-center px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors shadow-md hover:shadow-lg">
                Critères Hospitalisation/Ambulatoire <ChevronRight className="h-5 w-5 ml-2" />
            </button>
        </div>
    </div>
    );
  };
  
  const renderDisposition = () => {
    return (
        <div className="max-w-6xl mx-auto animate-fadeIn px-4">
            <StepHeader 
                title="Critères d'Hospitalisation vs Traitement Ambulatoire (EP à Faible Risque)"
                subtitle="Évaluation de l'éligibilité au traitement à domicile basée sur les critères HESTIA."
                icon={Home}
            />

            <SectionCard title="Critères HESTIA (Contre-indications au traitement ambulatoire)" className="mb-8" icon={<ListChecks size={20}/>}>
                <p className="text-sm text-slate-600 mb-6">Si UN SEUL critère HESTIA est positif, l'hospitalisation est généralement recommandée pour les patients avec EP à faible risque.</p>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    {HESTIA_CRITERIA_ITEMS.map(item => {
                        let isChecked = clinicalData[item.key] as boolean;
                        if (item.key === 'pregnantHestia' && clinicalData.pregnant) isChecked = true;
                        if (item.key === 'renalImpairment' && clinicalData.renalFunction === 'severe') isChecked = true;
                        if (item.key === 'hemodynamicallyUnstable' && (clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !=='' && parseInt(clinicalData.sbp) < 100) || (clinicalData.heartRate !== '' && parseInt(clinicalData.heartRate) > 100))) isChecked = true;

                        return (
                            <Checkbox
                                key={item.key as string}
                                id={`hestia_${item.key as string}`}
                                label={<span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: item.label }}></span>}
                                checked={isChecked}
                                onChange={(e) => handleInputChange(item.key, e.target.checked)}
                                disabled={
                                    (item.key === 'pregnantHestia' && clinicalData.pregnant) || 
                                    (item.key === 'renalImpairment' && clinicalData.renalFunction === 'severe') ||
                                    (item.key === 'hemodynamicallyUnstable' && (clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !=='' && parseInt(clinicalData.sbp) < 100) || (clinicalData.heartRate !== '' && parseInt(clinicalData.heartRate) > 100)))
                                }
                                className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                            />
                        );
                    })}
                </div>
            </SectionCard>

            <SectionCard title="Résultat HESTIA et Décision d'Orientation" className="mb-8 !p-0" icon={<ShieldCheck size={20}/>}>
                 <div className="p-6">
                 <AlertBox 
                    type={results.outpatientEligible ? "success" : "error"}
                    title={results.outpatientEligible ? "Traitement Ambulatoire Possible" : "Hospitalisation Recommandée"}
                    message={
                        <div className="text-sm">
                            <p className="mb-2">Score HESTIA: <strong>{results.hestiaScore} critère(s) positif(s) sur 11.</strong></p>
                            {results.outpatientEligible ? 
                                "Aucun critère HESTIA positif. Le patient semble éligible au traitement ambulatoire. Assurer une bonne compréhension, compliance, et un suivi rapproché." :
                                "Un ou plusieurs critères HESTIA sont positifs. L'hospitalisation est recommandée pour surveillance et prise en charge initiale."
                            }
                             {patientType === 'active-cancer' && !results.outpatientEligible && <p className="mt-2 font-semibold text-amber-700">Note: Pour les patients avec cancer actif, même à faible risque d'EP, la décision d'un traitement ambulatoire doit être particulièrement prudente et en concertation multidisciplinaire, compte tenu des comorbidités et risques associés au cancer.</p>}
                        </div>
                    }
                />
                </div>
            </SectionCard>

            {results.outpatientEligible && (
                <SectionCard title="Modalités du Traitement Ambulatoire (si éligible)" className="bg-emerald-50 border-emerald-200" icon={<CheckCircle className="text-emerald-700"/>}>
                    <ul className="list-disc list-inside space-y-2 text-sm text-emerald-700 pl-2">
                        <li>Initier le traitement anticoagulant (AOD de préférence, ou HBPM si cancer/grossesse/IR sévère) aux urgences ou en consultation très rapide.</li>
                        <li>Éducation thérapeutique du patient et de son entourage (reconnaissance des signes de complication, importance de l'observance).</li>
                        <li>Organiser un suivi médical rapproché (ex: consultation à J2-J7).</li>
                        <li>Assurer la disponibilité d'un contact médical en cas de problème.</li>
                        <li>Vérifier l'absence de contre-indications aux AODs (interactions médicamenteuses majeures, etc.).</li>
                         <li>Fournir des instructions claires sur quand consulter en urgence.</li>
                    </ul>
                </SectionCard>
            )}
            

            <div className="flex justify-between mt-12">
                <button onClick={() => setCurrentStep('treatment-recommendations')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
                    <ChevronLeft className="h-5 w-5 mr-2" /> Précédent
                </button>
                 <button onClick={() => setCurrentStep('follow-up-monitoring')} className="flex items-center px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors shadow-md hover:shadow-lg">
                    Suivi et Surveillance <ChevronRight className="h-5 w-5 ml-2" />
                </button>
            </div>
        </div>
    );
  };

  const renderFollowUpMonitoring = () => {
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn px-4">
        <StepHeader 
            title="Suivi et Surveillance du Traitement Anticoagulant"
            subtitle="Recommandations pour le monitoring biologique et clinique des patients sous anticoagulants."
            icon={CalendarDays}
        />
        <SectionCard title="Tableau Récapitulatif du Suivi Biologique par Anticoagulant" icon={<Microscope size={20}/>}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg shadow-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Anticoagulant</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Test(s)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fréquence</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Condition / Interprétation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {MONITORING_DATA.map((item) =>
                  item.tests.map((testItem, index) => (
                    <tr key={`${item.anticoagulant}-${testItem.test}-${index}`} className={index % 2 === 0 ? undefined : 'bg-slate-50/50'}>
                      {index === 0 && (
                        <td rowSpan={item.tests.length} className="px-4 py-3 align-top whitespace-nowrap text-sm font-medium text-slate-800 border-r border-slate-200">{item.anticoagulant}</td>
                      )}
                      <td className="px-4 py-3 whitespace-normal text-sm text-slate-700">{testItem.test}</td>
                      <td className="px-4 py-3 whitespace-normal text-sm text-slate-600">{testItem.frequency}</td>
                      <td className="px-4 py-3 whitespace-normal text-sm text-slate-600">
                        {testItem.condition && <span className="font-semibold text-sky-700">{testItem.condition}: </span>}
                        {testItem.interpretation}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
           <p className="text-xs text-slate-500 mt-4">Ces recommandations sont indicatives et peuvent être adaptées par le clinicien selon le contexte spécifique du patient. Un suivi clinique régulier est essentiel pour tous les patients.</p>
        </SectionCard>

        <SectionCard title="Suivi Clinique Général" className="mt-8" icon={<Stethoscope size={20}/>}>
             <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 pl-2">
                <li><strong>Court terme (1-4 semaines):</strong> Évaluer la réponse clinique (dyspnée, douleur thoracique), la tolérance et l'observance du traitement anticoagulant. Rechercher des saignements ou autres effets secondaires.</li>
                <li><strong>Moyen terme (3 mois):</strong> Réévaluer la nécessité de poursuivre l'anticoagulation (sauf si cancer actif/grossesse où la durée est plus longue). Rechercher des symptômes persistants (dyspnée d'effort, limitations fonctionnelles) pouvant évoquer un syndrome post-EP ou une Hypertension Thromboembolique Pulmonaire Chronique (HTP-TEC). Une échocardiographie de contrôle peut être discutée si symptômes persistants ou EP initiale sévère.</li>
                <li><strong>Long terme (au-delà de 3-6 mois):</strong> Pour les EP non provoquées ou avec facteurs de risque persistants, discuter annuellement la balance bénéfice/risque d'un traitement anticoagulant prolongé.</li>
                {patientType === 'active-cancer' && <li className="font-semibold text-amber-700">Pour les patients avec cancer, le suivi est souvent conjoint avec l'oncologue. La surveillance des complications (hémorragiques, thrombotiques) et des interactions médicamenteuses est cruciale. La décision de poursuivre/arrêter l'anticoagulation dépend de l'évolution du cancer.</li>}
                {patientType === 'pregnant' && <li className="font-semibold text-pink-700">Pour les patientes enceintes, le suivi est conjoint avec l'obstétricien et/ou l'hématologue. Ajustement des doses d'HBPM au poids, préparation à l'accouchement (switch HNF ou arrêt temporaire).</li>}
             </ul>
        </SectionCard>

        <div className="flex justify-between mt-12">
            <button onClick={() => setCurrentStep('disposition')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
                <ChevronLeft className="h-5 w-5 mr-2" /> Précédent
            </button>
            <button onClick={resetState} className="flex items-center px-8 py-3 text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg font-medium transition-colors">
                <Home className="h-5 w-5 mr-2" /> Terminer & Nouveau Patient
            </button>
        </div>
      </div>
    );
  };

  const renderAbbreviationsModal = () => {
    if (!showAbbreviationsModal) return null;

    const categorizedAbbreviations: Record<string, Abbreviation[]> = {};
    ABBREVIATIONS_LIST.forEach(item => {
      const category = item.category || 'Autres';
      if (!categorizedAbbreviations[category]) {
        categorizedAbbreviations[category] = [];
      }
      categorizedAbbreviations[category].push(item);
    });

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-5 border-b border-slate-200">
            <h3 className="text-xl font-semibold text-slate-700 flex items-center"><BookOpen size={24} className="mr-3 text-sky-600"/>Liste des Abréviations</h3>
            <button onClick={toggleAbbreviationsModal} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto space-y-4">
            {Object.entries(categorizedAbbreviations).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-md font-semibold text-sky-700 mb-2 border-b border-sky-200 pb-1">{category}</h4>
                <ul className="space-y-1.5 text-sm">
                  {items.sort((a,b) => a.abbr.localeCompare(b.abbr)).map(item => (
                    <li key={item.abbr} className="flex">
                      <strong className="w-28 text-slate-800">{item.abbr}:</strong>
                      <span className="text-slate-600">{item.full}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
           <div className="p-4 border-t border-slate-200 text-right">
            <button 
                onClick={toggleAbbreviationsModal} 
                className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors text-sm">
                Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'home': return renderHome();
      case 'clinical-assessment': return renderClinicalAssessment();
      case 'diagnostic-recommendations': return renderDiagnosticRecommendations();
      case 'risk-stratification': return clinicalData.peConfirmed || (patientType === 'active-cancer' && clinicalData.ctpaPositiveCancer === true) ? renderRiskStratification() : renderDiagnosticRecommendations(); 
      case 'treatment-recommendations': return clinicalData.peConfirmed || (patientType === 'active-cancer' && clinicalData.ctpaPositiveCancer === true) ? renderTreatmentRecommendations() : renderRiskStratification();
      case 'disposition': return clinicalData.peConfirmed || (patientType === 'active-cancer' && clinicalData.ctpaPositiveCancer === true) ? renderDisposition() : renderTreatmentRecommendations();
      case 'follow-up-monitoring': return clinicalData.peConfirmed || (patientType === 'active-cancer' && clinicalData.ctpaPositiveCancer === true) ? renderFollowUpMonitoring() : renderDisposition();
      default: return renderHome();
    }
  };
  
  const progressSteps: Step[] = ['home', 'clinical-assessment', 'diagnostic-recommendations', 'risk-stratification', 'treatment-recommendations', 'disposition', 'follow-up-monitoring'];
  const currentProgress = currentStep === 'home' ? 0 : (progressSteps.indexOf(currentStep)) / (progressSteps.length -1) * 100;


  return (
    <div className="min-h-screen bg-slate-50 py-6 font-sans">
        {currentStep !== 'home' && (
            <div className="fixed top-0 left-0 right-0 h-1.5 bg-sky-100 z-40"> {/* Lowered z-index for modal */}
                <div 
                    className="h-full bg-sky-500 transition-all duration-300 ease-out" 
                    style={{ width: `${currentProgress}%` }}
                ></div>
            </div>
        )}
        <header className="max-w-6xl mx-auto mb-8 mt-4 px-4 flex justify-between items-center">
            <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-full mr-3">
                    <Heart className="h-7 w-7 text-red-500"/>
                </div>
                <span className="text-2xl font-bold text-slate-700">EP-Expert</span>
            </div>
            {currentStep !== 'home' && (
                 <div className="flex items-center space-x-2">
                    <button 
                        onClick={handlePrintReport}
                        disabled={!(clinicalData.peConfirmed || (patientType === 'active-cancer' && clinicalData.ctpaPositiveCancer === true))}
                        title="Imprimer le rapport du patient"
                        className="flex items-center text-sm text-emerald-600 hover:text-emerald-800 font-medium py-2 px-3 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={16} className="mr-1.5"/> Imprimer
                    </button>
                     <button 
                        onClick={toggleAbbreviationsModal} 
                        title="Afficher les abréviations"
                        className="flex items-center text-sm text-purple-600 hover:text-purple-800 font-medium py-2 px-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                    >
                        <BookOpen size={16} className="mr-1.5"/> Abréviations
                    </button>
                    <button 
                        onClick={resetState} 
                        title="Commencer un nouveau cas"
                        className="flex items-center text-sm text-sky-600 hover:text-sky-800 font-medium py-2 px-3 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors"
                    >
                        <PlusCircle size={16} className="mr-1.5"/> Nouveau Cas
                    </button>
                 </div>
            )}
        </header>
      <main>
        {renderCurrentStep()}
      </main>
      {renderAbbreviationsModal()}
       <footer className="text-center text-xs text-slate-500 mt-8 py-6 border-t border-slate-200 px-4">
        <p className="mb-1">Application développée par Dr Zouhair Souissi © 2025 PE-Expert.</p>
        <p className="mb-1">
            Inspiré par les recommandations ESC 2019, CHEST, ASH, et les directives Kaiser Permanente (2022).
             Exemple de référence générale : <a href="https://www.annemergmed.com/article/S0196-0644(23)00033-1/pdf" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800 hover:underline">Managing Pulmonary Embolism. Ann Emerg Med. 2023.</a>
        </p>
        
      </footer>
    </div>
  );
};

export default App;

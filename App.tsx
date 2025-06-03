
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Heart, Stethoscope, AlertTriangle, CheckCircle, XCircle, Info, Calculator, FileText, Home, User, Baby, Activity, ShieldCheck, UserCheck, PlusCircle } from 'lucide-react';
import { ClinicalData, Results, PatientType, Step, FormItem } from './types';
import { INITIAL_CLINICAL_DATA, INITIAL_RESULTS, DDIMER_UNITS, WELLS_CRITERIA_ITEMS, PERC_CRITERIA_ITEMS, YEARS_CRITERIA_ITEMS, HESTIA_CRITERIA_ITEMS, GENDER_OPTIONS, CTPA_FINDINGS_OPTIONS, RENAL_FUNCTION_OPTIONS } from './constants';
import { Input, Select, Checkbox } from './components/shared/FormElements';
import { SectionCard } from './components/shared/SectionCard';
import { AlertBox } from './components/shared/AlertBox';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [patientType, setPatientType] = useState<PatientType>('');
  const [clinicalData, setClinicalData] = useState<ClinicalData>(INITIAL_CLINICAL_DATA);
  const [results, setResults] = useState<Results>(INITIAL_RESULTS);

  const resetState = useCallback(() => {
    setClinicalData(INITIAL_CLINICAL_DATA);
    setResults(INITIAL_RESULTS);
    setPatientType('');
    setCurrentStep('home');
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
    else if (wellsScore <= 6) wellsCategory = 'Modérée (2-6)';
    else wellsCategory = 'Élevée (&gt;6)';


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

    let ddimerThreshold = 0.5; // mg/L Default (FEU)
    if ((patientType !== 'pregnant' && wellsScore <= 6) || patientType === 'pregnant') {
        if (yearsCriteriaMet === 0) {
            ddimerThreshold = 1.0; // mg/L (FEU)
        } else {
            ddimerThreshold = 0.5; // mg/L (FEU)
        }
    }
    
    if (parseInt(clinicalData.age) > 50) {
        const ageAdjustedDimerValue = parseInt(clinicalData.age) * 0.01; 
        ddimerThreshold = Math.max(ddimerThreshold, ageAdjustedDimerValue);
    }

    // Hestia Score
    let hestiaScore = 0;
    if (clinicalData.hemodynamicallyUnstable) hestiaScore++;
    if (clinicalData.thrombolysisNeeded) hestiaScore++;
    if (clinicalData.activeBleeding) hestiaScore++;
    if (clinicalData.oxygenNeeded) hestiaScore++;
    if (clinicalData.peOnAnticoag) hestiaScore++;
    if (clinicalData.severePain) hestiaScore++;
    if (clinicalData.socialReasons) hestiaScore++;
    if (clinicalData.renalImpairment || clinicalData.renalFunction === 'severe') hestiaScore++;
    if (clinicalData.liverImpairment) hestiaScore++;
    if (clinicalData.pregnantHestia || clinicalData.pregnant) hestiaScore++;
    if (clinicalData.hitHistory) hestiaScore++;
    const outpatientEligible = hestiaScore === 0;

    // PE Risk Level
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
      ddimerThreshold,
      hestiaScore,
      outpatientEligible,
      peRiskLevel: peRiskLevelCalculated,
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicalData, patientType]); 

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

  const handleInputChange = (field: keyof ClinicalData, value: string | boolean | number) => {
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
  
  const renderCheckboxItem = (item: FormItem, data: ClinicalData, color = "sky") => {
    const isChecked = item.auto ? item.auto(data) : (data[item.key] as boolean);
    return (
       <Checkbox
        key={item.key as string}
        id={item.key as string}
        label={<span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: item.label + (item.points ? ` <span class="font-semibold text-${color}-600">(+${item.points})</span>` : '') }}></span>}
        checked={isChecked}
        onChange={(e) => !item.auto && handleInputChange(item.key, e.target.checked)}
        disabled={!!item.auto}
        containerClassName="mb-3"
        className={`mr-2 h-4 w-4 text-${color}-600 focus:ring-${color}-500 border-slate-300 rounded`}
      />
    );
  };

  const renderHome = () => (
    <div className="max-w-5xl mx-auto animate-fadeIn px-4">
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

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        {[
          { type: 'non-pregnant', icon: UserCheck, title: 'Patient Standard (pas de grossesse)', description: 'Évaluation avec Wells, PERC, YEARS.', color: 'sky', gradientFrom: 'from-sky-500', gradientTo: 'to-sky-700' },
          { type: 'pregnant', icon: Baby, title: 'Patiente Enceinte', description: 'Algorithme adapté (YEARS modifié).', color: 'pink', gradientFrom: 'from-pink-500', gradientTo: 'to-pink-700' }
        ].map(pt => (
          <button
            key={pt.type}
            className={`group relative text-left p-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out overflow-hidden bg-gradient-to-br ${pt.gradientFrom} ${pt.gradientTo} text-white focus:outline-none focus:ring-4 focus:ring-${pt.color}-400 focus:ring-opacity-50`}
            onClick={() => {
              setPatientType(pt.type as PatientType);
              if (pt.type === 'pregnant') {
                setClinicalData(prev => ({ ...prev, pregnant: true, gender: 'female', pregnantHestia: true }));
              } else {
                 setClinicalData(prev => ({ ...prev, pregnant: false, pregnantHestia: false }));
              }
              setCurrentStep('clinical-assessment');
            }}
          >
            <div className="relative z-10">
              <div className="mb-4">
                <pt.icon className={`h-12 w-12 text-white opacity-80`} />
              </div>
              <h3 className={`text-3xl font-semibold mb-2`}>{pt.title}</h3>
              <p className={`text-white opacity-90 mb-6`}>{pt.description}</p>
              <div className={`inline-flex items-center font-medium bg-white bg-opacity-20 group-hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors`}>
                Commencer l'évaluation
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
            { icon: ShieldCheck, title: 'Recommandations ESC', text: 'Basées sur les dernières guidelines.', color: 'emerald' },
            { icon: Activity, title: 'Adapté au Patient', text: 'Prise en compte grossesse, comorbidités.', color: 'amber' }
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
  
  const StepHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-600 text-lg max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );

  const renderClinicalAssessment = () => (
    <div className="max-w-6xl mx-auto animate-fadeIn px-4">
      <StepHeader 
        title="Évaluation Clinique Initiale"
        subtitle={`${patientType === 'pregnant' ? 'Patiente enceinte' : 'Patient standard (pas de grossesse)'} - Données cliniques : scores de probabilité.`}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <SectionCard title="Données Démographiques" className="lg:col-span-1">
          <div className="space-y-5">
            <Input label="Âge (années)" type="number" value={clinicalData.age} onChange={(e) => handleInputChange('age', e.target.value)} placeholder="Ex: 45" />
            {patientType !== 'pregnant' && (
              <Select label="Sexe" value={clinicalData.gender} onChange={(e) => handleInputChange('gender', e.target.value as ClinicalData['gender'])} options={GENDER_OPTIONS} />
            )}
            {patientType === 'pregnant' && <div className="p-3 bg-pink-50 border border-pink-200 rounded-md text-sm text-pink-700">Sexe: Féminin (Patiente enceinte sélectionnée)</div>}
             <Input label="Fréquence cardiaque (bpm)" type="number" value={clinicalData.heartRate} onChange={(e) => handleInputChange('heartRate', e.target.value)} placeholder="Ex: 80" />
            <Input label="SpO2 (% à l'air ambiant)" type="number" value={clinicalData.oxygenSat} onChange={(e) => handleInputChange('oxygenSat', e.target.value)} placeholder="Ex: 98" min="0" max="100" />
          </div>
        </SectionCard>

        <SectionCard title="Score de Wells" className="lg:col-span-2">
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

        {results.wellsScore <= 1 && patientType !== 'pregnant' && (
          <SectionCard title="Critères PERC (Si Wells faible et patient non-enceinte)" className="lg:col-span-3 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-700 mb-4">Si score de Wells faible ET TOUS les critères PERC sont absents, l'EP peut être exclue sans D-dimères.</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
              {PERC_CRITERIA_ITEMS.map(item => renderCheckboxItem(item, clinicalData, 'amber'))}
            </div>
            <AlertBox 
              type={results.percPositive ? "warning" : "success"}
              title="Résultat PERC"
              message={results.percPositive ? `Au moins un critère PERC est positif (${results.percCriteriaMet} critère(s)). L'EP n'est pas exclue par PERC. Procéder aux D-dimères.` : "Aucun critère PERC positif. L'EP est considérée comme exclue cliniquement."}
              className="mt-6"
            />
          </SectionCard>
        )}
        
        <SectionCard title="Critères YEARS" className="lg:col-span-3 bg-emerald-50 border-emerald-200">
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
              Seuil D-dimères adapté suggéré (FEU): {results.ddimerThreshold.toFixed(2)} {clinicalData.ddimerUnit}
              </div>
            }
          </div>
        </SectionCard>

        <SectionCard title="Dosage des D-dimères" className="lg:col-span-3">
          <div className="grid md:grid-cols-2 gap-6 items-end">
            <Input label="Valeur des D-dimères" type="number" step="0.01" value={clinicalData.ddimer} onChange={(e) => handleInputChange('ddimer', e.target.value)} placeholder="Ex: 0.25" />
            <Select label="Unité des D-dimères" value={clinicalData.ddimerUnit} onChange={(e) => handleInputChange('ddimerUnit', e.target.value as ClinicalData['ddimerUnit'])} options={DDIMER_UNITS.map(u => ({value: u, label: u}))} />
          </div>
          {clinicalData.ddimer && !isNaN(parseFloat(clinicalData.ddimer)) && (
            <AlertBox
              type={parseFloat(clinicalData.ddimer) < results.ddimerThreshold ? "success" : "error"}
              title="Interprétation des D-dimères"
              message={
                <>
                  Valeur: {clinicalData.ddimer} {clinicalData.ddimerUnit}. Seuil adapté (FEU): {results.ddimerThreshold.toFixed(2)} {clinicalData.ddimerUnit}.
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
  
  const renderDiagnosticRecommendations = () => {
    const ddimerValue = parseFloat(clinicalData.ddimer);
    const ddimerPresent = !isNaN(ddimerValue);
    const ddimerPositive = ddimerPresent && ddimerValue >= results.ddimerThreshold;

    let recommendation = '';
    let nextStepInfo = '';
    let alertTypeMain: "info" | "success" | "warning" | "error" = 'info';

    if (patientType === 'pregnant') {
        if (clinicalData.yearsDVT) { 
            recommendation = "Signes cliniques de TVP. Échographie veineuse des membres inférieurs (Doppler de compression) recommandée en 1ère intention.";
            alertTypeMain = 'info';
            
            let ddimerGuidanceForNegativeUS = '';
            if(ddimerPresent){
                ddimerGuidanceForNegativeUS = ddimerPositive ? 
                    `Les D-dimères (${clinicalData.ddimer} ${clinicalData.ddimerUnit}) sont positifs (seuil ${results.ddimerThreshold.toFixed(2)} ${clinicalData.ddimerUnit} FEU). Imagerie pulmonaire (CTPA/VQ) indiquée.` :
                    `Les D-dimères (${clinicalData.ddimer} ${clinicalData.ddimerUnit}) sont négatifs (seuil ${results.ddimerThreshold.toFixed(2)} ${clinicalData.ddimerUnit} FEU). EP exclue.`;
                 alertTypeMain = ddimerPositive ? 'warning' : 'success';
            } else {
                ddimerGuidanceForNegativeUS = `Le seuil de D-dimères est ${results.ddimerThreshold.toFixed(2)} ${clinicalData.ddimerUnit} FEU (basé sur ${results.yearsCriteriaMet} critère(s) YEARS et âge).`;
            }
            nextStepInfo = `Si écho positive pour TVP : traiter. Si écho négative : considérer D-dimères. ${ddimerGuidanceForNegativeUS}`;

        } else { 
            if (ddimerPresent) {
                recommendation = ddimerPositive ? 
                    'D-dimères positifs. Imagerie pulmonaire (CTPA ou scintigraphie V/Q) recommandée.' :
                    'D-dimères négatifs. EP exclue.';
                alertTypeMain = ddimerPositive ? 'warning' : 'success';
            } else {
                recommendation = `Dosage des D-dimères recommandé (seuil adapté: ${results.ddimerThreshold.toFixed(2)} ${clinicalData.ddimerUnit} FEU, basé sur ${results.yearsCriteriaMet} critère(s) YEARS et âge).`;
                alertTypeMain = 'info';
            }
            nextStepInfo = "Imagerie pulmonaire: CTPA vs scintigraphie V/Q. Faible exposition fœtale pour les deux. Discuter avec radiologue/obstétricien.";
        }
    } else { // Non-pregnant patient logic
        if (results.wellsCategory === 'Faible (≤1)') {
            if (!results.percPositive) { 
                recommendation = 'Score de Wells faible ET critères PERC tous négatifs. EP cliniquement exclue.';
                alertTypeMain = 'success';
                nextStepInfo = 'Pas d\'examens complémentaires nécessaires pour EP. Rechercher un diagnostic alternatif.';
            } else { 
                if (ddimerPresent) {
                    recommendation = ddimerPositive ? 'D-dimères positifs. Angioscanner pulmonaire (CTPA) recommandé.' : 'D-dimères négatifs. EP exclue.';
                    alertTypeMain = ddimerPositive ? 'warning' : 'success';
                    nextStepInfo = ddimerPositive ? 'Procéder à l\'imagerie.' : 'Rechercher un diagnostic alternatif.';
                } else {
                    recommendation = 'Wells faible mais PERC non négatif. Dosage des D-dimères (seuil adapté YEARS/âge).';
                    alertTypeMain = 'info';
                    nextStepInfo = `Seuil: ${results.ddimerThreshold.toFixed(2)} ${clinicalData.ddimerUnit} FEU. Si négatifs, EP exclue. Si positifs, CTPA.`;
                }
            }
        } else if (results.wellsCategory === 'Modérée (2-6)') {
            if (ddimerPresent) {
                recommendation = ddimerPositive ? 'D-dimères positifs. Angioscanner pulmonaire (CTPA) recommandé.' : 'D-dimères négatifs. EP exclue.';
                alertTypeMain = ddimerPositive ? 'warning' : 'success';
                 nextStepInfo = ddimerPositive ? 'Procéder à l\'imagerie.' : 'Rechercher un diagnostic alternatif.';
            } else {
                recommendation = 'Wells modéré. Dosage des D-dimères (seuil adapté YEARS/âge).';
                alertTypeMain = 'info';
                nextStepInfo = `Seuil: ${results.ddimerThreshold.toFixed(2)} ${clinicalData.ddimerUnit} FEU. Si négatifs, EP exclue. Si positifs, CTPA.`;
            }
        } else { // results.wellsCategory === 'Élevée (>6)'
            recommendation = 'Probabilité élevée (Wells &gt; 6). Angioscanner pulmonaire (CTPA) direct recommandé.';
            alertTypeMain = 'error';
            nextStepInfo = 'Procéder immédiatement au CTPA sans D-dimères préalables.';
        }
    }

    return (
      <div className="max-w-6xl mx-auto animate-fadeIn px-4">
        <StepHeader 
            title="Recommandations Diagnostiques"
            subtitle="Basées sur l'évaluation clinique, les scores et les D-dimères (si pertinents)."
        />

        <SectionCard title="Résumé des Scores Calculés" className="mb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 bg-sky-50 rounded-xl shadow-md border border-sky-200">
              <div className="flex items-center text-sky-700 mb-1">
                <Calculator className="h-6 w-6 mr-2" /> <h4 className="font-semibold text-lg">Score de Wells</h4>
              </div>
              <p className="text-3xl font-bold text-sky-600">{results.wellsScore.toFixed(1)}</p>
              <p className="text-md text-sky-700 font-medium">{results.wellsCategory}</p>
            </div>
            
            {patientType !== 'pregnant' && results.wellsScore <=1 && (
                 <div className={`p-5 rounded-xl shadow-md border ${results.percPositive ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`flex items-center mb-1 ${results.percPositive ? 'text-amber-700' : 'text-emerald-700'}`}>
                        <XCircle className="h-6 w-6 mr-2" /> <h4 className="font-semibold text-lg">Critères PERC</h4>
                    </div>
                    <p className={`text-xl font-bold ${results.percPositive ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {results.percPositive ? `Positif (${results.percCriteriaMet} critère(s))` : 'Négatif'}
                    </p>
                </div>
            )}

            <div className="p-5 bg-teal-50 rounded-xl shadow-md border border-teal-200">
              <div className="flex items-center text-teal-700 mb-1">
                <CheckCircle className="h-6 w-6 mr-2" /> <h4 className="font-semibold text-lg">Critères YEARS</h4>
              </div>
              <p className="text-xl font-bold text-teal-600">{results.yearsCategory}</p>
              <p className="text-sm text-teal-700">Seuil D-dimères adapté (FEU): {results.ddimerThreshold.toFixed(2)} {clinicalData.ddimerUnit}</p>
            </div>
          </div>
        </SectionCard>

        <AlertBox type={alertTypeMain} title="Recommandation Principale" message={<><p className="text-base mb-2">{recommendation}</p><p className="text-sm font-medium opacity-90">{nextStepInfo}</p></>} className="mb-8 !p-6 !rounded-xl" />

        {patientType === 'pregnant' && (
          <SectionCard title="Considérations Spécifiques (Grossesse)" className="bg-pink-50 border-pink-200 mb-8">
            <ul className="space-y-2 text-sm text-pink-700 list-disc list-inside pl-2">
               { !clinicalData.yearsDVT && <li>L'échographie veineuse des membres inférieurs reste une option si une suspicion clinique de TVP se manifeste.</li>}
              <li>Si échographie positive pour TVP : traiter pour EP/TVP. Pas d'autre imagerie pulmonaire nécessaire.</li>
              <li>Pour imagerie pulmonaire (CTPA ou V/Q), le choix dépend de la disponibilité, expertise locale, et discussion multidisciplinaire. Faible exposition fœtale.</li>
              <li>Une consultation spécialisée (pneumologue, obstétricien, radiologue) est fortement recommandée.</li>
            </ul>
          </SectionCard>
        )}

        <SectionCard title="Si Embolie Pulmonaire Confirmée par Imagerie">
            <p className="text-slate-600 mb-6">Si l'imagerie (CTPA, scintigraphie V/Q) confirme le diagnostic d'embolie pulmonaire, une stratification du risque est cruciale pour orienter la stratégie thérapeutique.</p>
            <button
                onClick={() => {
                handleInputChange('peConfirmed', true);
                setCurrentStep('risk-stratification');
                }}
                className="w-full flex items-center justify-center px-6 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold text-lg transition-colors shadow-md hover:shadow-lg"
            >
                EP Confirmée : Procéder à la Stratification du Risque <Activity className="h-6 w-6 ml-3" />
            </button>
        </SectionCard>

        <div className="flex justify-between mt-12">
          <button onClick={() => setCurrentStep('clinical-assessment')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
            <ChevronLeft className="h-5 w-5 mr-2" /> Retour Évaluation
          </button>
          <button onClick={resetState} className="flex items-center px-6 py-3 text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg font-medium transition-colors">
            <Home className="h-5 w-5 mr-2" /> Nouveau Patient
          </button>
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
            />

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <SectionCard title="Stabilité Hémodynamique">
                    <div className="space-y-5">
                        <Input label="Pression Artérielle Systolique (PAS, mmHg)" type="number" value={clinicalData.sbp} onChange={(e) => handleInputChange('sbp', e.target.value)} placeholder="Ex: 120" />
                        <Checkbox label="Choc cardiogénique ou hypotension persistante (PAS &lt; 90 mmHg, ou chute &gt; 40 mmHg &gt; 15 min, non due à arythmie/hypovolémie/sepsis)" checked={clinicalData.hemodynamicallyUnstable} onChange={(e) => handleInputChange('hemodynamicallyUnstable', e.target.checked)} />
                        {clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 90 && !clinicalData.hemodynamicallyUnstable && 
                            <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md border border-red-200">Note: PAS actuelle &lt; 90 mmHg indique une instabilité.</p>}
                    </div>
                </SectionCard>

                <SectionCard title="Dysfonction VD & Biomarqueurs Cardiaques">
                     <div className="space-y-4">
                        <Checkbox label="Dysfonction Ventriculaire Droite (VD) à l'échocardiographie ou au CTPA" checked={clinicalData.rvDysfunction} onChange={(e) => handleInputChange('rvDysfunction', e.target.checked)} />
                        <Checkbox label="Élévation de la Troponine (I ou T)" checked={clinicalData.troponin} onChange={(e) => handleInputChange('troponin', e.target.checked)} />
                        <Checkbox label="Élévation du BNP / NT-proBNP" checked={clinicalData.bnp} onChange={(e) => handleInputChange('bnp', e.target.checked)} />
                    </div>
                </SectionCard>
                
                <SectionCard title="Autres Facteurs Pronostiques" className="lg:col-span-2">
                    <div className="grid md:grid-cols-2 gap-6">
                         <Select label="Localisation/Étendue au CTPA" value={clinicalData.ctpaFindings} onChange={(e) => handleInputChange('ctpaFindings', e.target.value as ClinicalData['ctpaFindings'])} options={CTPA_FINDINGS_OPTIONS} />
                         <Select label="Fonction Rénale (ClCr)" value={clinicalData.renalFunction} onChange={(e) => handleInputChange('renalFunction', e.target.value as ClinicalData['renalFunction'])} options={RENAL_FUNCTION_OPTIONS} />
                    </div>
                    <Checkbox label="Risque hémorragique élevé identifié (contre-indication relative/absolue à la thrombolyse/anticoagulation intensive)" checked={clinicalData.bleedingRisk} onChange={(e) => handleInputChange('bleedingRisk', e.target.checked)} containerClassName="mt-6"/>
                </SectionCard>
            </div>
            
            <SectionCard title="Classification du Risque ESC et Orientation Thérapeutique" className="mb-8 !p-0">
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
  
  const renderTreatmentRecommendations = () => {
    const isHighRiskInput = clinicalData.hemodynamicallyUnstable || (clinicalData.sbp !== '' && parseInt(clinicalData.sbp) < 90);
    const hasRVDysfunction = clinicalData.rvDysfunction;
    const hasBiomarkers = clinicalData.troponin || clinicalData.bnp;
    
    const isTrueHighRisk = isHighRiskInput;
    const isTrueIntermediateHighRisk = !isHighRiskInput && hasRVDysfunction && hasBiomarkers;
    const isTrueIntermediateLowRisk = !isHighRiskInput && (hasRVDysfunction || hasBiomarkers) && !(hasRVDysfunction && hasBiomarkers);
    const isTrueLowRisk = !isHighRiskInput && !hasRVDysfunction && !hasBiomarkers;

    return (
    <div className="max-w-6xl mx-auto animate-fadeIn px-4">
        <StepHeader 
            title="Recommandations Thérapeutiques pour EP Confirmée"
            subtitle="Prise en charge adaptée au niveau de risque, aux comorbidités et situations spécifiques."
        />

        <div className="space-y-8">
            {isTrueHighRisk && (
                <SectionCard title="Traitement - RISQUE ÉLEVÉ (Instabilité)" className="border-red-500 bg-red-50 shadow-xl">
                    <AlertBox type="error" title="🚨 URGENCE VITALE - REPERFUSION IMMÉDIATE" message={
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            <li><strong>Thrombolyse systémique :</strong> Altéplase ou Ténectéplase. À initier SANS DÉLAI si absence de contre-indication absolue.</li>
                            <li>En cas de contre-indication ou échec thrombolyse : Embolectomie chirurgicale ou traitement percutané par cathéter.</li>
                            <li><strong>Anticoagulation initiale :</strong> Héparine Non Fractionnée (HNF) IV.</li>
                            <li>Admission en Unité de Soins Intensifs (USI) ou Réanimation.</li>
                            {clinicalData.bleedingRisk && <li className="font-bold text-red-700 mt-2">Risque hémorragique élevé noté : thrombolyse souvent contre-indiquée. Privilégier embolectomie/traitement percutané.</li>}
                        </ul>
                    }/>
                </SectionCard>
            )}
            {(isTrueIntermediateHighRisk || isTrueIntermediateLowRisk) && (
                 <SectionCard title={`Traitement - RISQUE INTERMÉDIAIRE ${isTrueIntermediateHighRisk ? '(Élevé)' : '(Faible)'}`} className="border-amber-500 bg-amber-50 shadow-lg">
                     <AlertBox type="warning" title="⚠️ ANTICOAGULATION ET SURVEILLANCE RAPPROCHÉE" message={
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            <li><strong>Anticoagulation thérapeutique parentérale :</strong> HBPM (ex: énoxaparine), Fondaparinux, ou HNF.</li>
                            <li>Hospitalisation pour surveillance initiale, surtout si risque intermédiaire-élevé.</li>
                            <li>Relais AOD (Apixaban, Rivaroxaban, Edoxaban) ou AVK une fois le patient stabilisé.</li>
                            {isTrueIntermediateHighRisk && <li>Si dégradation hémodynamique : thrombolyse de sauvetage ou traitement percutané.</li>}
                        </ul>
                    }/>
                 </SectionCard>
            )}
            {isTrueLowRisk && (
                 <SectionCard title="Traitement - RISQUE FAIBLE" className="border-emerald-500 bg-emerald-50 shadow-lg">
                     <AlertBox type="success" title="✅ ANTICOAGULATION STANDARD" message={
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            <li><strong>Anticoagulation :</strong> AOD en première intention (Apixaban, Rivaroxaban).</li>
                            <li>Alternatives : HBPM/Fondaparinux puis relais AVK ou Edoxaban.</li>
                            <li>Traitement ambulatoire possible si tous les critères HESTIA sont négatifs et conditions socio-familiales favorables (voir étape suivante).</li>
                        </ul>
                    }/>
                 </SectionCard>
            )}

            <SectionCard title="Considérations Spécifiques et Comorbidités">
                <div className="space-y-5">
                    {clinicalData.malignancy && (
                        <AlertBox type="info" title="🎗️ EP et Cancer Actif" message="HBPM au long cours souvent préférée. AOD (Edoxaban, Rivaroxaban, Apixaban) sont des alternatives validées pour de nombreux patients, discuter balance bénéfice/risque hémorragique (surtout digestif/génito-urinaire). Durée : tant que cancer actif." />
                    )}
                    {patientType === 'pregnant' && (
                         <AlertBox type="info" title="🤰 EP et Grossesse/Post-partum" message="HBPM à dose thérapeutique (ajustée au poids, surveillance anti-Xa possible) pendant toute la grossesse et au moins 6 semaines post-partum (total min. 3 mois). AVK et AOD contre-indiqués pendant la grossesse. HNF si risque hémorragique majeur ou accouchement imminent." />
                    )}
                    {clinicalData.renalFunction === 'severe' && ( 
                        <AlertBox type="warning" title="🧊 EP et Insuffisance Rénale Sévère (ClCr &lt; 30 mL/min)" message="HNF IV avec monitoring TCA. HBPM : prudence, réduction de dose et/ou surveillance anti-Xa. Certains AOD contre-indiqués ou nécessitent réduction majeure (Apixaban 2.5mg x2/j si ClCr 15-29 + ≥2 critères [âge ≥80, poids ≤60kg]). AVK possibles." />
                    )}
                </div>
            </SectionCard>

            <SectionCard title="Durée Recommandée du Traitement Anticoagulant">
                 <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-1">EP Provoquée (facteur majeur transitoire résolu)</h4>
                        <p className="text-slate-600">• <strong>3 mois</strong> (ex: chirurgie majeure, immobilisation prolongée, contraception oestroprogestative interrompue).</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700 mb-1">EP Non Provoquée (idiopathique) ou Facteur Mineur/Persistant</h4>
                        <p className="text-slate-600">• 1er épisode: <strong>Au moins 3-6 mois</strong>, puis réévaluation pour traitement prolongé.</p>
                        <p className="text-slate-600">• Récidive EP non provoquée: <strong>Traitement prolongé</strong> (souvent à vie) si risque hémorragique acceptable.</p>
                        <p className="text-slate-600">• EP et cancer actif: <strong>Traitement prolongé</strong> (au moins 6 mois, et tant que cancer actif).</p>
                    </div>
                 </div>
                 <p className="text-xs text-slate-500 mt-4">La décision de prolonger le traitement au-delà de la période initiale doit être individualisée (risque récidive vs risque hémorragique).</p>
            </SectionCard>
        </div>

        <div className="flex justify-between mt-12">
            <button onClick={() => setCurrentStep('risk-stratification')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
                <ChevronLeft className="h-5 w-5 mr-2" /> Précédent
            </button>
            {isTrueLowRisk ? ( 
                 <button onClick={() => setCurrentStep('disposition')} className="flex items-center px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors shadow-md hover:shadow-lg">
                    Critères Hospitalisation/Ambulatoire <ChevronRight className="h-5 w-5 ml-2" />
                </button>
            ) : ( 
                 <button onClick={resetState} className="flex items-center px-8 py-3 text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg font-medium transition-colors">
                    <Home className="h-5 w-5 mr-2" /> Terminer & Nouveau Patient
                </button>
            )}
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
            />

            <SectionCard title="Critères HESTIA (Contre-indications au traitement ambulatoire)" className="mb-8">
                <p className="text-sm text-slate-600 mb-6">Si UN SEUL critère HESTIA est positif, l'hospitalisation est généralement recommandée pour les patients avec EP à faible risque.</p>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                    {HESTIA_CRITERIA_ITEMS.map(item => {
                        let isChecked = clinicalData[item.key] as boolean;
                        // Auto-check Hestia pregnancy if patientType is pregnant
                        if (item.key === 'pregnantHestia' && clinicalData.pregnant) isChecked = true;
                        // Auto-check Hestia renal impairment if severe renal function selected
                        if (item.key === 'renalImpairment' && clinicalData.renalFunction === 'severe') isChecked = true;
                        
                        return (
                            <Checkbox
                                key={item.key as string}
                                id={`hestia_${item.key as string}`}
                                label={<span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: item.label }}></span>}
                                checked={isChecked}
                                onChange={(e) => handleInputChange(item.key, e.target.checked)}
                                // Disable if auto-checked by other state
                                disabled={(item.key === 'pregnantHestia' && clinicalData.pregnant) || (item.key === 'renalImpairment' && clinicalData.renalFunction === 'severe')}
                                className="mr-2 h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
                            />
                        );
                    })}
                </div>
            </SectionCard>

            <SectionCard title="Résultat HESTIA et Décision d'Orientation" className="mb-8 !p-0">
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
                        </div>
                    }
                />
                </div>
            </SectionCard>

            {results.outpatientEligible && (
                <SectionCard title="Modalités du Traitement Ambulatoire (si éligible)" className="bg-emerald-50 border-emerald-200">
                    <ul className="list-disc list-inside space-y-2 text-sm text-emerald-700 pl-2">
                        <li>Initier le traitement anticoagulant (AOD de préférence) aux urgences ou en consultation très rapide.</li>
                        <li>Éducation thérapeutique du patient et de son entourage (reconnaissance des signes de complication, importance de l'observance).</li>
                        <li>Organiser un suivi médical rapproché (ex: consultation à J2-J7).</li>
                        <li>Assurer la disponibilité d'un contact médical en cas de problème.</li>
                        <li>Vérifier l'absence de contre-indications aux AODs (interactions médicamenteuses majeures, etc.).</li>
                         <li>Fournir des instructions claires sur quand consulter en urgence.</li>
                    </ul>
                </SectionCard>
            )}
            
            <SectionCard title="Suivi Général de l'Embolie Pulmonaire" className="mt-8">
                 <ul className="list-disc list-inside space-y-2 text-sm text-slate-700 pl-2">
                    <li><strong>Court terme (1-4 semaines):</strong> Évaluer la réponse clinique (dyspnée, douleur thoracique), la tolérance et l'observance du traitement anticoagulant. Rechercher des saignements.</li>
                    <li><strong>Moyen terme (3 mois):</strong> Réévaluer la nécessité de poursuivre l'anticoagulation. Rechercher des symptômes persistants (dyspnée d'effort, limitations) pouvant évoquer un syndrome post-EP ou une HTAP thromboembolique chronique (HTP-TEC).</li>
                    <li><strong>Long terme (au-delà de 3-6 mois):</strong> Pour les EP non provoquées ou avec facteurs de risque persistants, discuter la balance bénéfice/risque d'un traitement anticoagulant prolongé.</li>
                 </ul>
            </SectionCard>

            <div className="flex justify-between mt-12">
                <button onClick={() => setCurrentStep('treatment-recommendations')} className="flex items-center px-6 py-3 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium transition-colors">
                    <ChevronLeft className="h-5 w-5 mr-2" /> Précédent
                </button>
                <button onClick={resetState} className="flex items-center px-8 py-3 text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg font-medium transition-colors">
                    <Home className="h-5 w-5 mr-2" /> Terminer & Nouveau Patient
                </button>
            </div>
        </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'home': return renderHome();
      case 'clinical-assessment': return renderClinicalAssessment();
      case 'diagnostic-recommendations': return renderDiagnosticRecommendations();
      case 'risk-stratification': return renderRiskStratification();
      case 'treatment-recommendations': return renderTreatmentRecommendations();
      case 'disposition': return renderDisposition();
      default: return renderHome();
    }
  };
  
  const progressSteps: Step[] = ['home', 'clinical-assessment', 'diagnostic-recommendations', 'risk-stratification', 'treatment-recommendations', 'disposition'];
  const currentProgress = currentStep === 'home' ? 0 : (progressSteps.indexOf(currentStep)) / (progressSteps.length -1) * 100;


  return (
    <div className="min-h-screen bg-slate-50 py-6 font-sans">
        {currentStep !== 'home' && (
            <div className="fixed top-0 left-0 right-0 h-1.5 bg-sky-100 z-50">
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
                 <button 
                    onClick={resetState} 
                    className="flex items-center text-sm text-sky-600 hover:text-sky-800 font-medium py-2 px-3 bg-sky-100 hover:bg-sky-200 rounded-lg transition-colors"
                >
                    <PlusCircle size={16} className="mr-1.5"/> Nouveau Cas
                </button>
            )}
        </header>
      <main>
        {renderCurrentStep()}
      </main>
       <footer className="text-center text-xs text-slate-500 mt-8 py-6 border-t border-slate-200 px-4">
        <p className="mb-1">Application développée par Dr Zouhair Souissi © 2025 PE-Expert.</p>
        <p className="mb-1">
            Référence : Managing Pulmonary Embolism. Ann Emerg Med. 2023;82(3):394-402.
        </p>
        
      </footer>
    </div>
  );
};

export default App;
import { EkgType } from './EkgFactory';

export const ekgTypeToFilename: Record<EkgType, string> = {
  [EkgType.NORMAL_SINUS_RHYTHM]: 'prawidłowy-rytm-zatokowy',
  [EkgType.SINUS_TACHYCARDIA]: 'tachykardia-zatokowa',
  [EkgType.SINUS_BRADYCARDIA]: 'bradykardia-zatokowa',
  [EkgType.ATRIAL_FIBRILLATION]: 'migotanie-przedsionkow',
  [EkgType.VENTRICULAR_FIBRILLATION]: 'migotanie-komor',
  [EkgType.VENTRICULAR_TACHYCARDIA]: 'czestoskurcz-komorowy',
  [EkgType.TORSADE_DE_POINTES]: 'torsade-de-pointes',
  [EkgType.ASYSTOLE]: 'asystolia',
  [EkgType.FIRST_DEGREE_AV_BLOCK]: 'blok-przedsionkowo-komorowy-1-stopnia',
  [EkgType.SECOND_DEGREE_AV_BLOCK]: 'blok-przedsionkowo-komorowy-2-stopnia',
  [EkgType.MOBITZ_TYPE_AV_BLOCK]:
    'blok-przedsionkowo-komorowy-2-stopnia-typu-mobitza',
  [EkgType.SA_BLOCK]: 'blok-zatokowo-przedsionkowy',
  [EkgType.WANDERING_ATRIAL_PACEMAKER]: 'nadkomorowe-wedrowanie-rozrusznika',
  [EkgType.SINUS_ARRHYTHMIA]: 'nadmiarowość-zatokowa',
  [EkgType.PREMATURE_VENTRICULAR_CONTRACTION]:
    'przedwczesne-pobudzenie-komorewe',
  [EkgType.PREMATURE_ATRIAL_CONTRACTION]:
    'przedwczesne-pobudzenie-przedsionkowe',
  [EkgType.PREMATURE_JUNCTIONAL_CONTRACTION]: 'przedwczesne-pobudzenie-wezlowe',
  [EkgType.ACCELERATED_VENTRICULAR_RHYTHM]: 'przyspieszony-rytm-komorowy',
  [EkgType.ACCELERATED_JUNCTIONAL_RHYTHM]: 'przyspieszony-rytm-wezlowy-1',
  [EkgType.IDIOVENTRICULAR_RHYTHM]: 'rytm-komorowy-idowentrykularny',
  [EkgType.VENTRICULAR_FLUTTER]: 'trzepotanie-komor',
  [EkgType.ATRIAL_FLUTTER_A]: 'trzepotanie-przedsionkow-a',
  [EkgType.ATRIAL_FLUTTER_B]: 'trzepotanie-przedsionkow-b',
  [EkgType.MULTIFOCAL_ATRIAL_TACHYCARDIA]:
    'wieloogniskowy-czestoskurcz-przedsionkowy',
  [EkgType.SINUS_ARREST]: 'zahamowanie-zatokowe',
  [EkgType.VENTRICULAR_ESCAPE_BEAT]: 'zastepcze-pobudzenie-komorowe',
  [EkgType.JUNCTIONAL_ESCAPE_BEAT]: 'zastepcze-pobudzenie-wezlowe',
  [EkgType.CUSTOM]: 'prawidłowy-rytm-zatokowy',
};

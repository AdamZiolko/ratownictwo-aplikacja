// Sound configuration interface
export interface SoundOption {
  id: string;
  name: string;
  file: any;
}

// Available sounds organized by category
export const AVAILABLE_SOUNDS: SoundOption[] = [
  // Adult Male sounds
  { id: "male_coughing", name: "Kaszel (M)", file: require("../../assets/sounds/Adult/Male/Coughing.wav") },
  { id: "male_coughing_long", name: "Kaszel długi (M)", file: require("../../assets/sounds/Adult/Male/Coughing(long).wav") },
  { id: "male_breathing", name: "Trudne oddychanie (M)", file: require("../../assets/sounds/Adult/Male/Difficultbreathing.wav") },
  { id: "male_hawk", name: "Odchrząkiwanie (M)", file: require("../../assets/sounds/Adult/Male/Hawk.wav") },
  { id: "male_moaning", name: "Jęk (M)", file: require("../../assets/sounds/Adult/Male/Moaning.wav") },
  { id: "male_moaning_long", name: "Jęk długi (M)", file: require("../../assets/sounds/Adult/Male/Moaning(long).wav") },
  { id: "male_no", name: "Nie (M)", file: require("../../assets/sounds/Adult/Male/No.wav") },
  { id: "male_ok", name: "OK (M)", file: require("../../assets/sounds/Adult/Male/Ok.wav") },
  { id: "male_screaming", name: "Krzyk (M)", file: require("../../assets/sounds/Adult/Male/Screaming.wav") },
  { id: "male_screaming2", name: "Krzyk 2 (M)", file: require("../../assets/sounds/Adult/Male/Screaming(type2).wav") },
  { id: "male_sobbing", name: "Szlochanie (M)", file: require("../../assets/sounds/Adult/Male/Sobbreathing.wav") },
  { id: "male_vomiting", name: "Wymioty (M)", file: require("../../assets/sounds/Adult/Male/Vomiting.wav") },
  { id: "male_vomiting2", name: "Wymioty 2 (M)", file: require("../../assets/sounds/Adult/Male/Vomiting(type2).wav") },
  { id: "male_vomiting3", name: "Wymioty 3 (M)", file: require("../../assets/sounds/Adult/Male/Vomiting(type3).wav") },
  { id: "male_yes", name: "Tak (M)", file: require("../../assets/sounds/Adult/Male/Yes.wav") },
  
  // Adult Female sounds
  { id: "female_breathing", name: "Oddychanie w skurczach (K)", file: require("../../assets/sounds/Adult/Female/Breathingthroughcontractions.wav") },
  { id: "female_coughing", name: "Kaszel (K)", file: require("../../assets/sounds/Adult/Female/Coughing.wav") },
  { id: "female_distressed", name: "Niepokój (K)", file: require("../../assets/sounds/Adult/Female/Distressed.wav") },
  { id: "female_hawk", name: "Odchrząkiwanie (K)", file: require("../../assets/sounds/Adult/Female/Hawk.wav") },
  { id: "female_moaning", name: "Jęk (K)", file: require("../../assets/sounds/Adult/Female/Moaning.wav") },
  { id: "female_no", name: "Nie (K)", file: require("../../assets/sounds/Adult/Female/No.wav") },
  { id: "female_ok", name: "OK (K)", file: require("../../assets/sounds/Adult/Female/Ok.wav") },
  { id: "female_pain", name: "Ból (K)", file: require("../../assets/sounds/Adult/Female/Pain.wav") },
  { id: "female_pushing_long", name: "Parcie długie (K)", file: require("../../assets/sounds/Adult/Female/Pushinglong.wav") },
  { id: "female_pushing_long_double", name: "Parcie długie podwójne (K)", file: require("../../assets/sounds/Adult/Female/Pushinglongdouble.wav") },
  { id: "female_pushing_single", name: "Parcie pojedyncze (K)", file: require("../../assets/sounds/Adult/Female/Pushingsingle.wav") },
  { id: "female_screaming", name: "Krzyk (K)", file: require("../../assets/sounds/Adult/Female/Screaming.wav") },
  { id: "female_sobbing", name: "Szlochanie (K)", file: require("../../assets/sounds/Adult/Female/Sobbreathing.wav") },
  { id: "female_sobbing2", name: "Szlochanie 2 (K)", file: require("../../assets/sounds/Adult/Female/Sobbreathing(type2).wav") },
  { id: "female_vomiting", name: "Wymioty (K)", file: require("../../assets/sounds/Adult/Female/Vomiting.wav") },
  { id: "female_yes", name: "Tak (K)", file: require("../../assets/sounds/Adult/Female/Yes.wav") },
  
  // Child sounds
  { id: "child_coughing", name: "Kaszel (Dziecko)", file: require("../../assets/sounds/Child/Coughing.wav") },
  { id: "child_hawk", name: "Odchrząkiwanie (Dziecko)", file: require("../../assets/sounds/Child/Hawk.wav") },
  { id: "child_moaning", name: "Jęk (Dziecko)", file: require("../../assets/sounds/Child/Moaning.wav") },
  { id: "child_no", name: "Nie (Dziecko)", file: require("../../assets/sounds/Child/No.wav") },
  { id: "child_ok", name: "OK (Dziecko)", file: require("../../assets/sounds/Child/Ok.wav") },
  { id: "child_screaming", name: "Krzyk (Dziecko)", file: require("../../assets/sounds/Child/Screaming.wav") },
  { id: "child_sobbing", name: "Szlochanie (Dziecko)", file: require("../../assets/sounds/Child/Sobbreathing.wav") },
  { id: "child_vomiting", name: "Wymioty (Dziecko)", file: require("../../assets/sounds/Child/Vomiting.wav") },
  { id: "child_vomiting2", name: "Wymioty 2 (Dziecko)", file: require("../../assets/sounds/Child/Vomiting(type2).wav") },
  { id: "child_yes", name: "Tak (Dziecko)", file: require("../../assets/sounds/Child/Yes.wav") },
  
  // Geriatric Male sounds
  { id: "geriatric_male_coughing", name: "Kaszel (Starszy M)", file: require("../../assets/sounds/Geriatric/Male/Coughing.wav") },
  { id: "geriatric_male_moaning", name: "Jęk (Starszy M)", file: require("../../assets/sounds/Geriatric/Male/Moaning.wav") },
  { id: "geriatric_male_no", name: "Nie (Starszy M)", file: require("../../assets/sounds/Geriatric/Male/No.wav") },
  { id: "geriatric_male_screaming", name: "Krzyk (Starszy M)", file: require("../../assets/sounds/Geriatric/Male/Screaming.wav") },
  { id: "geriatric_male_vomiting", name: "Wymioty (Starszy M)", file: require("../../assets/sounds/Geriatric/Male/Vomiting.wav") },
  { id: "geriatric_male_yes", name: "Tak (Starszy M)", file: require("../../assets/sounds/Geriatric/Male/Yes.wav") },
  
  // Geriatric Female sounds
  { id: "geriatric_female_coughing", name: "Kaszel (Starsza K)", file: require("../../assets/sounds/Geriatric/Female/Coughing.wav") },
  { id: "geriatric_female_moaning", name: "Jęk (Starsza K)", file: require("../../assets/sounds/Geriatric/Female/Moaning.wav") },
  { id: "geriatric_female_no", name: "Nie (Starsza K)", file: require("../../assets/sounds/Geriatric/Female/No.wav") },
  { id: "geriatric_female_screaming", name: "Krzyk (Starsza K)", file: require("../../assets/sounds/Geriatric/Female/Screaming.wav") },
  { id: "geriatric_female_vomiting", name: "Wymioty (Starsza K)", file: require("../../assets/sounds/Geriatric/Female/Vomiting.wav") },
  { id: "geriatric_female_yes", name: "Tak (Starsza K)", file: require("../../assets/sounds/Geriatric/Female/Yes.wav") },
  
  // Infant sounds
  { id: "infant_content", name: "Spokojne (Niemowlę)", file: require("../../assets/sounds/Infant/Content.wav") },
  { id: "infant_cough", name: "Kaszel (Niemowlę)", file: require("../../assets/sounds/Infant/Cough.wav") },
  { id: "infant_grunt", name: "Chrząknięcie (Niemowlę)", file: require("../../assets/sounds/Infant/Grunt.wav") },
  { id: "infant_hawk", name: "Odchrząkiwanie (Niemowlę)", file: require("../../assets/sounds/Infant/Hawk.wav") },
  { id: "infant_hiccup", name: "Czkawka (Niemowlę)", file: require("../../assets/sounds/Infant/Hiccup.wav") },
  { id: "infant_screaming", name: "Krzyk (Niemowlę)", file: require("../../assets/sounds/Infant/Screaming.wav") },
  { id: "infant_strongcry", name: "Silny płacz (Niemowlę)", file: require("../../assets/sounds/Infant/Strongcry.wav") },
  { id: "infant_strongcry2", name: "Silny płacz 2 (Niemowlę)", file: require("../../assets/sounds/Infant/Strongcry(type2).wav") },
  { id: "infant_weakcry", name: "Słaby płacz (Niemowlę)", file: require("../../assets/sounds/Infant/Weakcry.wav") },
  
  // Speech sounds
  { id: "speech_chesthurts", name: "Ból w klatce", file: require("../../assets/sounds/Speech/Chesthurts.wav") },
  { id: "speech_coulddie", name: "Czuję, że umieram", file: require("../../assets/sounds/Speech/DocIfeelIcoulddie.wav") },
  { id: "speech_goaway", name: "Odejdź", file: require("../../assets/sounds/Speech/Goaway.wav") },
  { id: "speech_notdizzy", name: "Nie mam zawrotów", file: require("../../assets/sounds/Speech/Idontfeeldizzy.wav") },
  { id: "speech_idontfeelwell", name: "Złe samopoczucie", file: require("../../assets/sounds/Speech/Idontfeelwell.wav") },
  { id: "speech_feelbetter", name: "Czuję się lepiej", file: require("../../assets/sounds/Speech/Ifeelbetternow.wav") },
  { id: "speech_feelbad", name: "Czuję się źle", file: require("../../assets/sounds/Speech/Ifeelreallybad.wav") },
  { id: "speech_dizzy", name: "Zawroty głowy", file: require("../../assets/sounds/Speech/Imfeelingverydizzy.wav") },
  { id: "speech_fine", name: "Dobrze się czuję", file: require("../../assets/sounds/Speech/Imfine.wav") },
  { id: "speech_nauseous", name: "Nudności", file: require("../../assets/sounds/Speech/Imquitenauseous.wav") },
  { id: "speech_hungry", name: "Jestem głodny", file: require("../../assets/sounds/Speech/Imreallyhungry.wav") },
  { id: "speech_thirsty", name: "Jestem spragniony", file: require("../../assets/sounds/Speech/Imreallythirsty.wav") },
  { id: "speech_sick", name: "Jestem chory", file: require("../../assets/sounds/Speech/Imsosick.wav") },
  { id: "speech_neverpain", name: "Nigdy taki ból", file: require("../../assets/sounds/Speech/Neverhadpainlikethisbefore.wav") },
  { id: "speech_no", name: "Nie", file: require("../../assets/sounds/Speech/No.wav") },
  { id: "speech_noallergies", name: "Brak alergii", file: require("../../assets/sounds/Speech/Noallergies.wav") },
  { id: "speech_nodiabetes", name: "Brak cukrzycy", file: require("../../assets/sounds/Speech/Nodiabetes.wav") },
  { id: "speech_nolungproblems", name: "Brak problemów z płucami", file: require("../../assets/sounds/Speech/Nolungorcardiacproblems.wav") },
  { id: "speech_pain2hours", name: "Ból od 2 godzin", file: require("../../assets/sounds/Speech/Painfor2hours.wav") },
  { id: "speech_pain", name: "Coś na ból", file: require("../../assets/sounds/Speech/Somethingforthispain.wav") },
  { id: "speech_thankyou", name: "Dziękuję", file: require("../../assets/sounds/Speech/Thankyou.wav") },
  { id: "speech_helped", name: "To pomogło", file: require("../../assets/sounds/Speech/Thathelped.wav") },
  { id: "speech_yes", name: "Tak", file: require("../../assets/sounds/Speech/Yes.wav") },
];

// Helper function to compare sound files
export const isSameSound = (file1: any, file2: any): boolean => {
  return JSON.stringify(file1) === JSON.stringify(file2);
};

// Function to find sound by file
export const findSoundByFile = (file: any): SoundOption | undefined => {
  return AVAILABLE_SOUNDS.find(sound => isSameSound(sound.file, file));
};

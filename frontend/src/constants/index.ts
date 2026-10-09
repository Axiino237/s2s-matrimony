export const CASTE_SUBCASTES: Record<string, string[]> = {
  'Kongu Vellalar': ['Kongu Vellalar', 'Kongu Gounder', 'Sendhalai Gounder', 'Nattu Gounder'],
  'Vellalar': ['Thuluva Vellalar', 'Karkathar Vellalar', 'Saiva Vellalar', 'Chozhia Vellalar'],
  'Nadar': ['Karikku Marathaan', 'Nattathi', 'Mel-naattar'],
  'Mudaliar': ['Thuluva Vellala Mudaliar', 'Senguntha Mudaliar', 'Agamudaya Mudaliar', 'Arcot Mudaliar'],
  'Chettiar': ['Nattukottai Chettiar', 'Devanga Chettiar', 'Vaniyar Chettiar', 'Beri Chettiar'],
  'Gounder': ['Kongu Gounder', 'Vettuva Gounder', 'Nattu Gounder'],
  'Pillai': ['Saiva Pillai', 'Karkartha Pillai', 'Seer Karuneegar Pillai', 'Sozhia Pillai'],
  'Iyengar': ['Vadakalai', 'Thenkalai'],
  'Iyer': ['Vadama', 'Brahacharanam', 'Vathima', 'Sholiyar'],
  'Thevar': ['Kallar', 'Maravar', 'Agamudayar'],
  'Vanniyar': ['Vanniya Kula Kshatriyar', 'Gounder', 'Naicker'],
  'Naidu': ['Kamma Naidu', 'Gavara Naidu', 'Balija Naidu'],
  'Reddy': ['Kamma Reddy', 'Desuru Reddy', 'Pokanati Reddy'],
};
export const STARS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
export const RASIS = ['Mesha','Rishabha','Mithuna','Kataka','Simha','Kanya','Tula','Vrischika','Dhanu','Makara','Kumbha','Meena'];
export const DOSHAMS = [
  'No Dosham',
  'Sevvai Dosham (செவ்வாய் தோஷம்)',
  'Rahu Kethu Dosham (ராகு கேது தோஷம்)',
  'Kaala Sarpa Dosham (கால சர்ப்ப தோஷம்)',
  'Pithru Dosham (பித்ரு தோஷம்)',
  'Kalathira Dosham (களத்திர தோஷம்)',
  'Naga Dosham (நாக தோஷம்)',
  'Sani Dosham (சனி தோஷம்)',
  'Guru Dosham (குரு தோஷம்)',
];

export const BILINGUAL_STARS = [
  { value: 'Ashwini', label: 'Ashwini (அஸ்வினி)' },
  { value: 'Bharani', label: 'Bharani (பரணி)' },
  { value: 'Krittika', label: 'Krittika (கார்த்திகை)' },
  { value: 'Rohini', label: 'Rohini (ரோகிணி)' },
  { value: 'Mrigashirsha', label: 'Mrigashirsha (மிருகசீரிஷம்)' },
  { value: 'Ardra', label: 'Ardra / Thiruvathirai (திருவாதிரை)' },
  { value: 'Punarvasu', label: 'Punarvasu / Punarpoosam (புனர்பூசம்)' },
  { value: 'Pushya', label: 'Pushya / Poosam (பூசம்)' },
  { value: 'Ashlesha', label: 'Ashlesha / Ayilyam (ஆயில்யம்)' },
  { value: 'Magha', label: 'Magha / Makam (மகம்)' },
  { value: 'Purva Phalguni', label: 'Purva Phalguni / Pooram (பூரம்)' },
  { value: 'Uttara Phalguni', label: 'Uttara Phalguni / Uthiram (உத்திரம்)' },
  { value: 'Hasta', label: 'Hasta / Hastham (ஹஸ்தம்)' },
  { value: 'Chitra', label: 'Chitra / Chithirai (சித்திரை)' },
  { value: 'Swati', label: 'Swati / Swathi (சுவாதி)' },
  { value: 'Vishakha', label: 'Vishakha / Visakam (விசாகம்)' },
  { value: 'Anuradha', label: 'Anuradha / Anusham (அனுஷம்)' },
  { value: 'Jyeshtha', label: 'Jyeshtha / Kettai (கேட்டை)' },
  { value: 'Mula', label: 'Mula / Moolam (மூலம்)' },
  { value: 'Purva Ashadha', label: 'Purva Ashadha / Pooradam (பூராடம்)' },
  { value: 'Uttara Ashadha', label: 'Uttara Ashadha / Uthiradam (உத்திராடம்)' },
  { value: 'Shravana', label: 'Shravana / Thiruvonam (திருவோணம்)' },
  { value: 'Dhanishta', label: 'Dhanishta / Avittam (அவிட்டம்)' },
  { value: 'Shatabhisha', label: 'Shatabhisha / Sadayam (சதயம்)' },
  { value: 'Purva Bhadrapada', label: 'Purva Bhadrapada / Poorattathi (பூரட்டாதி)' },
  { value: 'Uttara Bhadrapada', label: 'Uttara Bhadrapada / Uthirattathi (உத்திரட்டாதி)' },
  { value: 'Revati', label: 'Revati / Revathi (ரேவதி)' },
];

export const BILINGUAL_RASIS = [
  { value: 'Mesha', label: 'Mesha / Mesham (மேஷம் / Aries)' },
  { value: 'Rishabha', label: 'Rishabha / Rishabam (ரிஷபம் / Taurus)' },
  { value: 'Mithuna', label: 'Mithuna / Mithunam (மிதுனம் / Gemini)' },
  { value: 'Kataka', label: 'Kataka / Kadagam (கடகம் / Cancer)' },
  { value: 'Simha', label: 'Simha / Simmam (சிம்மம் / Leo)' },
  { value: 'Kanya', label: 'Kanya / Kanni (கன்னி / Virgo)' },
  { value: 'Tula', label: 'Tula / Thulaam (துலாம் / Libra)' },
  { value: 'Vrischika', label: 'Vrischika / Viruchigam (விருச்சிகம் / Scorpio)' },
  { value: 'Dhanu', label: 'Dhanu / Dhanusu (தனுசு / Sagittarius)' },
  { value: 'Makara', label: 'Makara / Magaram (மகரம் / Capricorn)' },
  { value: 'Kumbha', label: 'Kumbha / Kumbam (கும்பம் / Aquarius)' },
  { value: 'Meena', label: 'Meena / Meenam (மீனம் / Pisces)' },
];

export function normalizeStar(star?: string): string {
  if (!star) return '';
  const s = star.trim().toLowerCase();
  if (s.includes('punar') || s.includes('புனர்')) return 'Punarvasu';
  if (s.includes('ashw') || s.includes('asw') || s.includes('அஸ்வி')) return 'Ashwini';
  if (s.includes('bhar') || s.includes('பரணி')) return 'Bharani';
  if (s.includes('krit') || s.includes('karth') || s.includes('கார்த்')) return 'Krittika';
  if (s.includes('roh') || s.includes('ரோகி')) return 'Rohini';
  if (s.includes('mrig') || s.includes('mirug') || s.includes('மிருக')) return 'Mrigashirsha';
  if (s.includes('ardr') || s.includes('thiruvath') || s.includes('திருவா')) return 'Ardra';
  if (s.includes('push') || s.includes('poos') || s.includes('பூச')) return 'Pushya';
  if (s.includes('ashl') || s.includes('asl') || s.includes('ayil') || s.includes('ஆயில்')) return 'Ashlesha';
  if (s.includes('magh') || s.includes('mak') || s.includes('மக')) return 'Magha';
  if (s.includes('poorva phal') || s.includes('purva phal') || s.includes('pooram') || s.includes('பூர')) return 'Purva Phalguni';
  if (s.includes('uttara phal') || s.includes('uthir') || s.includes('உத்திர')) return 'Uttara Phalguni';
  if (s.includes('hast') || s.includes('astha') || s.includes('ஹஸ்த') || s.includes('அஸ்த')) return 'Hasta';
  if (s.includes('chitr') || s.includes('சித்')) return 'Chitra';
  if (s.includes('swat') || s.includes('சுவா')) return 'Swati';
  if (s.includes('visak') || s.includes('vishak') || s.includes('விசா')) return 'Vishakha';
  if (s.includes('anur') || s.includes('anush') || s.includes('அனு')) return 'Anuradha';
  if (s.includes('jyes') || s.includes('kett') || s.includes('கேட்')) return 'Jyeshtha';
  if (s.includes('mool') || s.includes('mula') || s.includes('மூல')) return 'Mula';
  if (s.includes('poorad') || s.includes('purva ashadha') || s.includes('பூரா')) return 'Purva Ashadha';
  if (s.includes('uthirad') || s.includes('uttara ashadha') || s.includes('உத்திரா')) return 'Uttara Ashadha';
  if (s.includes('thiruvon') || s.includes('shrav') || s.includes('திருவோ')) return 'Shravana';
  if (s.includes('avit') || s.includes('dhanis') || s.includes('அவிட்')) return 'Dhanishta';
  if (s.includes('saday') || s.includes('sathay') || s.includes('shatabh') || s.includes('சத')) return 'Shatabhisha';
  if (s.includes('pooratt') || s.includes('purva bhadra') || s.includes('பூரட்')) return 'Purva Bhadrapada';
  if (s.includes('uthiratt') || s.includes('uttara bhadra') || s.includes('உத்திரட்')) return 'Uttara Bhadrapada';
  if (s.includes('revat') || s.includes('ரேவ')) return 'Revati';
  const found = STARS.find(st => st.toLowerCase() === s);
  return found || star.trim();
}

export function normalizeRasi(rasi?: string): string {
  if (!rasi) return '';
  const r = rasi.trim().toLowerCase();
  if (r.includes('mesh') || r.includes('arie') || r.includes('மேஷ')) return 'Mesha';
  if (r.includes('rish') || r.includes('taur') || r.includes('ரிஷ')) return 'Rishabha';
  if (r.includes('mith') || r.includes('gemi') || r.includes('மிது')) return 'Mithuna';
  if (r.includes('katak') || r.includes('kadag') || r.includes('kark') || r.includes('canc') || r.includes('கடக')) return 'Kataka';
  if (r.includes('simh') || r.includes('simm') || r.includes('leo') || r.includes('சிம்')) return 'Simha';
  if (r.includes('kany') || r.includes('kanni') || r.includes('virg') || r.includes('கன்')) return 'Kanya';
  if (r.includes('tul') || r.includes('thul') || r.includes('libr') || r.includes('துலா')) return 'Tula';
  if (r.includes('vris') || r.includes('viruch') || r.includes('scorp') || r.includes('விருச்')) return 'Vrischika';
  if (r.includes('dhan') || r.includes('sagit') || r.includes('தனு')) return 'Dhanu';
  if (r.includes('mak') || r.includes('magar') || r.includes('capri') || r.includes('மகர')) return 'Makara';
  if (r.includes('kumb') || r.includes('aqua') || r.includes('கும்ப')) return 'Kumbha';
  if (r.includes('meen') || r.includes('pisc') || r.includes('மீன')) return 'Meena';
  const found = RASIS.find(rs => rs.toLowerCase() === r);
  return found || rasi.trim();
}



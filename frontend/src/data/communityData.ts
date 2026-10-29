export interface CommunityInfo {
  name: string;
  slug: string;
  categoryName: string;
  title: string;
  metaDescription: string;
  summary: string;
  subCommunities: string[];
  keyLocations: string[];
  traditions: string;
}

export const VERIFIED_COMMUNITIES: Record<string, CommunityInfo> = {
  nadar: {
    name: 'Nadar',
    slug: 'nadar',
    categoryName: 'Nadar Matrimony',
    title: 'Nadar Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Find verified Nadar brides and grooms. Explore authentic Hindu and Christian Nadar alliances, 10-Porutham horoscope matching, and strict contact privacy on S2S Matrimony.',
    summary:
      'The Nadar community has a proud heritage of enterprise, education, and deep family traditions across Tamil Nadu. S2S Nadar Matrimony connects verified alliances with mutual family respect.',
    subCommunities: [
      'Karukkuvattai Nadar',
      'Maraimar Nadar',
      'Nattathi Nadar',
      'Kalla Nadar',
      'Servai Nadar',
      'Mel-Nattar Nadar',
      'Christian Nadar',
      'Hindu Nadar',
      'Gramani',
      'General Nadar',
    ],
    keyLocations: ['Chennai', 'Tirunelveli', 'Tuticorin', 'Virudhunagar', 'Madurai', 'Coimbatore'],
    traditions:
      'Weddings feature traditional rituals, family blessings, exchange of garlands, and Vedic or Christian matrimonial rites respecting ancestral Gotram and Porutham compatibility.',
  },
  mudaliar: {
    name: 'Mudaliar',
    slug: 'mudaliar',
    categoryName: 'Mudaliar Matrimony',
    title: 'Mudaliar Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Discover compatible Mudaliar brides and grooms. Browse Arcot, Sengunthar, Thondaimandala, and Saiva Mudaliar profiles with verified contact protection and horoscope matching.',
    summary:
      'Known for their cultural refinement, academic distinction, and enduring heritage in Tamil Nadu, Mudaliar alliances place high value on education and family compatibility.',
    subCommunities: [
      'Arcot Mudaliar',
      'Thondaimandalam Mudaliar',
      'Sengunthar / Kaikolar',
      'Agamudayar Mudaliar',
      'Vellala Mudaliar',
      'Saiva Mudaliar',
      'Isai Vellalar',
      'Thuluva Mudaliar',
      'General Mudaliar',
    ],
    keyLocations: ['Chennai', 'Vellore', 'Kanchipuram', 'Coimbatore', 'Salem', 'Erode'],
    traditions:
      'Traditional ceremonies incorporate sacred Muhurtham rites, Kasi Yatra, and authentic 10-Porutham horoscope assessment for harmony and prosperity.',
  },
  gounder: {
    name: 'Gounder',
    slug: 'gounder',
    categoryName: 'Gounder Matrimony',
    title: 'Gounder Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Find genuine Kongu Vellala Gounder brides and grooms. Explore verified matrimonial profiles with Kootam matching, family background checks, and contact privacy on S2S Matrimony.',
    summary:
      'Rooted in the Kongu region of Tamil Nadu, the Gounder community is celebrated for agricultural heritage, industrial enterprise, and strong Kootam (clan) matchmaking principles.',
    subCommunities: [
      'Kongu Vellala Gounder',
      'Vettuva Gounder',
      'Nattu Gounder',
      'Kurumba Gounder',
      'Vanniya Gounder',
      'Urali Gounder',
      'Padayachi Gounder',
      'General Gounder',
    ],
    keyLocations: ['Coimbatore', 'Erode', 'Tiruppur', 'Salem', 'Namakkal', 'Karur'],
    traditions:
      'Kongu wedding traditions honor the sacred Mangala Vazhthu, Kootam exogamy rules, and familial unity under traditional elders.',
  },
  pillai: {
    name: 'Pillai',
    slug: 'pillai',
    categoryName: 'Pillai Matrimony',
    title: 'Pillai Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Connect with verified Saiva Pillai, Karkathar, and Tirunelveli Pillai brides and grooms. Enjoy traditional horoscope Porutham matching and privacy-protected contact access.',
    summary:
      'A distinguished Tamil community with strong spiritual, literary, and administrative foundations. S2S Pillai Matrimony honors orthodox vegetarian traditions and family values.',
    subCommunities: [
      'Saiva Pillai',
      'Karkathar Pillai',
      'Sozhia Pillai',
      'Tirunelveli Saiva Pillai',
      'Veerakodi Vellalar',
      'Desikar Pillai',
      'Illathupillai',
      'Pandiya Vellalar',
      'General Pillai',
    ],
    keyLocations: ['Tirunelveli', 'Madurai', 'Chennai', 'Thanjavur', 'Kanyakumari', 'Trichy'],
    traditions:
      'Vedic ceremonies, traditional Saivite rituals, Dasa Porutham horoscope verification, and auspicious Muhurtham celebrations.',
  },
  chettiar: {
    name: 'Chettiar',
    slug: 'chettiar',
    categoryName: 'Chettiar Matrimony',
    title: 'Chettiar Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Explore verified Chettiar matrimonial profiles. Search Nagarathar, Devanga, Vaniyar, and Arya Vysya brides and grooms with full privacy and horoscope matching.',
    summary:
      'Renowned worldwide for trade acumen, philanthropy, architectural heritage, and close-knit temple divisions (Pirivu), Chettiar alliances celebrate heritage and shared prosperity.',
    subCommunities: [
      'Nattukottai Chettiar (Nagarathar)',
      'Devanga Chettiar',
      'Elur Chettiar',
      'Vaniyar Chettiar',
      '24 Manai Telugu Chettiar',
      'Arya Vysya Chettiar',
      'Saiva Chettiar',
      'General Chettiar',
    ],
    keyLocations: ['Karaikudi', 'Devakottai', 'Chennai', 'Madurai', 'Coimbatore', 'Pudukkottai'],
    traditions:
      'Historic temple-based alliances, Pirivu exogamy checks, traditional gift exchanges (Seer Varisaigal), and sacred wedding chants.',
  },
  vanniyar: {
    name: 'Vanniyar',
    slug: 'vanniyar',
    categoryName: 'Vanniyar Matrimony',
    title: 'Vanniyar Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Find compatible Vanniya Kula Kshatriyar and Padayachi brides and grooms. Verified matrimonial biodatas, horoscope matching, and secure communication on S2S Matrimony.',
    summary:
      'One of the largest agrarian and valorous communities of northern and central Tamil Nadu, valuing strong kinship bonds, cultural festivals, and family solidarity.',
    subCommunities: [
      'Vanniya Kula Kshatriyar',
      'Padayachi',
      'Gounder Vanniyar',
      'Naicker Vanniyar',
      'Palli',
      'Arcot Vanniyar',
      'General Vanniyar',
    ],
    keyLocations: ['Cuddalore', 'Villupuram', 'Salem', 'Dharmapuri', 'Vellore', 'Chennai'],
    traditions:
      'Traditional Muhurtham customs, ceremonial marriage pandal rituals, and Porutham astrological review.',
  },
  thevar: {
    name: 'Thevar / Mukkulathor',
    slug: 'thevar',
    categoryName: 'Thevar / Mukkulathor Matrimony',
    title: 'Thevar Matrimony — Verified Mukkulathor Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Connect with genuine Thevar and Mukkulathor brides and grooms. Verified Kallar, Maravar, and Agamudayar profiles with horoscope matching and phone privacy.',
    summary:
      'The Mukkulathor confederation represents the historic trinity of Kallar, Maravar, and Agamudayar communities, recognized for courage, honor, and deep regional roots in southern Tamil Nadu.',
    subCommunities: [
      'Kallar (Ambalakarar)',
      'Kallar (Pramalai)',
      'Maravar (Sembanattu)',
      'Maravar (Appanattu)',
      'Agamudayar (Rajakula)',
      'Servai',
      'General Thevar',
    ],
    keyLocations: ['Madurai', 'Ramanathapuram', 'Sivagangai', 'Tirunelveli', 'Thanjavur', 'Theni'],
    traditions:
      'Traditional celebratory rites, ceremonial elder approvals, sacred thali tying, and astrology validation.',
  },
  naidu: {
    name: 'Naidu',
    slug: 'naidu',
    categoryName: 'Naidu Matrimony',
    title: 'Naidu Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Browse verified Kamma, Balija, and Gavara Naidu matrimonial profiles. Find compatible life partners with horoscope compatibility and contact privacy on S2S Matrimony.',
    summary:
      'A progressive and widely respected Telugu-Tamil heritage community with strong presence in business, governance, and technology across South India.',
    subCommunities: [
      'Kamma Naidu',
      'Balija Naidu',
      'Gavara Naidu',
      'Kapu Naidu',
      'Kambalathar Naidu',
      'Velama Naidu',
      'Muthuraja Naidu',
      'General Naidu',
    ],
    keyLocations: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Dindigul', 'Theni'],
    traditions:
      'Rituals blending Telugu and Tamil heritage, auspicious Jeelakarra Bellam rites, and 10-Porutham horoscope alignment.',
  },
  iyer: {
    name: 'Iyer',
    slug: 'iyer',
    categoryName: 'Iyer Matrimony',
    title: 'Iyer Matrimony — Tamil Brahmin Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Find verified Vadama, Brahacharanam, and Sholiya Iyer matrimonial profiles. Accurate Vedic 10-Porutham matching, Gothram exogamy checks, and complete privacy.',
    summary:
      'Tamil Brahmin Iyers uphold sacred Vedic rituals, classical Carnatic arts, and intellectual heritage. S2S Iyer Matrimony adheres strictly to traditional Gothra and Porutham principles.',
    subCommunities: [
      'Vadama Iyer',
      'Brahacharanam Iyer',
      'Astasahasram Iyer',
      'Sholiya Iyer',
      'Kaniyalar Iyer',
      'Gurukkal',
      'Dikshitar',
      'General Iyer',
    ],
    keyLocations: ['Chennai', 'Thanjavur', 'Kumbakonam', 'Trichy', 'Madurai', 'Coimbatore'],
    traditions:
      'Vedic vivaha samskaras including Vratham, Oonjal (swing ceremony), Kanyadhanam, Mangalya Dharanam, and Saptapadi around the sacred agni.',
  },
  iyengar: {
    name: 'Iyengar',
    slug: 'iyengar',
    categoryName: 'Iyengar Matrimony',
    title: 'Iyengar Matrimony — Vadakalai & Thenkalai Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Connect with compatible Vadakalai and Thenkalai Iyengar matrimonial profiles. Verified Tamil Vaishnava Brahmin brides & grooms with Vedic horoscope matching.',
    summary:
      'Devoted to Sri Vaishnavite philosophy and Ramanuja sampradaya, Iyengar alliances celebrate divine devotion, classical scholarship, and traditional family harmony.',
    subCommunities: ['Vadakalai Iyengar', 'Thenkalai Iyengar', 'General Iyengar'],
    keyLocations: ['Chennai', 'Srirangam', 'Kanchipuram', 'Madurai', 'Tiruchirappalli', 'Bangalore'],
    traditions:
      'Sri Vaishnava rituals honoring divya desam traditions, Nalangu, Oonjal, and strict Gothram compatibility checks.',
  },
  vellalar: {
    name: 'Vellalar',
    slug: 'vellalar',
    categoryName: 'Vellalar Matrimony',
    title: 'Vellalar Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Search verified Thondaimandala, Saiva, and Soliya Vellalar brides and grooms. Experience trusted community matching with phone masking and horoscope porutham.',
    summary:
      'The historic landed gentry of Tamil civilization, celebrated for integrity, civic stewardship, and preservation of classical Shaivite and cultural traditions.',
    subCommunities: [
      'Thondaimandala Vellalar',
      'Saiva Vellalar',
      'Soliya Vellalar',
      'Kodikal Vellalar',
      'Karkathar Vellalar',
      'Arcot Vellalar',
      'Nanjil Vellalar',
      'General Vellalar',
    ],
    keyLocations: ['Chennai', 'Madurai', 'Coimbatore', 'Tirunelveli', 'Thanjavur', 'Kanchipuram'],
    traditions:
      'Orthodox ceremonies, Muhurtham blessings, family feast traditions, and detailed horoscope Porutham matching.',
  },
  reddiyar: {
    name: 'Reddiyar',
    slug: 'reddiyar',
    categoryName: 'Reddiyar Matrimony',
    title: 'Reddiyar Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Find compatible Reddiyar brides and grooms in Tamil Nadu and South India. Verified profiles with horoscope compatibility, family verification, and contact privacy.',
    summary:
      'A respected agricultural and entrepreneurial community spanning Tamil Nadu and Andhra borders, characterized by close community unity and generous hospitality.',
    subCommunities: [
      'Kanjam Reddiyar',
      'Kamma Reddiyar',
      'Reddiar Ganjam',
      'Pokanati Reddiyar',
      'General Reddiyar',
    ],
    keyLocations: ['Virudhunagar', 'Madurai', 'Tirunelveli', 'Chennai', 'Salem', 'Coimbatore'],
    traditions:
      'Vibrant celebratory rites, traditional gold thali presentation, and Porutham calculation.',
  },
  'yadav-konar': {
    name: 'Yadav / Konar',
    slug: 'yadav-konar',
    categoryName: 'Yadav / Konar Matrimony',
    title: 'Yadav Konar Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Browse genuine Tamil Konar and Yadav matrimonial profiles. Explore verified bride and groom biodatas with horoscope matching and privacy controls.',
    summary:
      'Traced to ancient pastoral lineage and Lord Krishna worship, the Konar/Yadav community values family devotion, moral integrity, and regional unity across Tamil Nadu.',
    subCommunities: [
      'Tamil Konar',
      'Ayar / Idaiyar',
      'Vaduga Yadav',
      'Gollavaru',
      'General Konar',
    ],
    keyLocations: ['Madurai', 'Tirunelveli', 'Trichy', 'Chennai', 'Dindigul', 'Virudhunagar'],
    traditions:
      'Traditional auspicious ceremonies, Krishna archana blessings, and Muhurtham rites.',
  },
  viswakarma: {
    name: 'Viswakarma',
    slug: 'viswakarma',
    categoryName: 'Viswakarma Matrimony',
    title: 'Viswakarma Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Connect with verified Achari and Viswakarma brides and grooms. Gold, silver, woodcraft, and stonemasonry heritage alliances with horoscope porutham matching.',
    summary:
      'The skilled master artisans and temple architects (Silpis, Goldsmiths, Blacksmiths, Woodcraftsmen) of Indian civilizational heritage, honoring Lord Viswakarma.',
    subCommunities: [
      'Thattan (Goldsmith)',
      'Thatchan (Woodcraft)',
      'Kollar (Blacksmith)',
      'Kalthatchan (Stonemason)',
      'Kannan (Brass/Copper)',
      'Silpi',
      'Kammalar',
      'General Viswakarma',
    ],
    keyLocations: ['Chennai', 'Madurai', 'Salem', 'Tirunelveli', 'Coimbatore', 'Thanjavur'],
    traditions:
      'Vedic ceremonies, sacred thread rituals, Viswakarma puja, and horoscope alignment.',
  },
  sourashtra: {
    name: 'Sourashtra',
    slug: 'sourashtra',
    categoryName: 'Sourashtra Matrimony',
    title: 'Sourashtra Matrimony — Verified Brides & Grooms | S2S Matrimony',
    metaDescription:
      'Find compatible Madurai and Tamil Nadu Sourashtra brides and grooms. Verified matrimonial profiles with Gothram matching, family background checks, and privacy.',
    summary:
      'An industrious, culturally vibrant community centered in Madurai, celebrated for fine silk weaving, trade excellence, and unique linguistic heritage.',
    subCommunities: [
      'Palkar Sourashtra',
      'Madurai Sourashtra',
      'Salem Sourashtra',
      'Tanjore Sourashtra',
      'General Sourashtra',
    ],
    keyLocations: ['Madurai', 'Salem', 'Tanjore', 'Paramakudi', 'Dindigul', 'Chennai'],
    traditions:
      'Rich cultural wedding rituals featuring unique Sourashtra musical songs, traditional silk saree presentation, and Gothram checks.',
  },
  christian: {
    name: 'Christian',
    slug: 'christian',
    categoryName: 'Christian Matrimony',
    title: 'Tamil Christian Matrimony — RC, CSI & Pentecostal Alliances | S2S Matrimony',
    metaDescription:
      'Connect with verified South Indian and Tamil Christian brides and grooms. Search Roman Catholic, CSI, Pentecostal, and Protestant matrimonial profiles safely.',
    summary:
      'Serving Christian families across South India with shared faith, biblical values, professional education, and community heritage.',
    subCommunities: [
      'Roman Catholic (RC)',
      'Church of South India (CSI)',
      'Pentecostal',
      'Protestant',
      'Mar Thoma',
      'Syrian Catholic',
      'Jacobite',
      'General Christian',
    ],
    keyLocations: ['Chennai', 'Tirunelveli', 'Kanyakumari', 'Coimbatore', 'Madurai', 'Trichy'],
    traditions:
      'Church engagement, solemn holy matrimony nuptial mass/service, rings exchange, sacred hymn singing, and family reception.',
  },
  muslim: {
    name: 'Muslim',
    slug: 'muslim',
    categoryName: 'Muslim Matrimony',
    title: 'Tamil Muslim Matrimony — Nikah Matrimonial Profiles | S2S Matrimony',
    metaDescription:
      'Find compatible Tamil Muslim brides and grooms. Search Marakkayar, Rowther, Lebbai, and Sunni matrimonial profiles with complete family privacy on S2S Matrimony.',
    summary:
      'Honoring Islamic traditions, moral values, and Tamil cultural roots across commercial and academic families in Tamil Nadu.',
    subCommunities: [
      'Tamil Muslim / Marakkayar',
      'Lebbai',
      'Rowther',
      'Dekkani Muslim',
      'Syed',
      'Hanafi',
      'Shafi',
      'Sunni',
      'General Muslim',
    ],
    keyLocations: ['Chennai', 'Nagore', 'Madurai', 'Tiruchirappalli', 'Vellore', 'Kayalpatnam'],
    traditions:
      'Solemn Islamic Nikah ceremony, Mahr agreement, elder approvals, Dua blessings, and joyous Walima reception.',
  },
};


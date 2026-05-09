// --- CONFIGURACIÓN GENERAL Y ESTILOS ---

export const getFlag = (sigla) => {
  if (!sigla) return "https://flagcdn.com/w80/un.png";
  const mapping = { "MEX": "mx", "RSA": "za", "KOR": "kr", "CZE": "cz", "CAN": "ca", "BIH": "ba", "QAT": "qa", "SUI": "ch", "BRA": "br", "MAR": "ma", "HAI": "ht", "SCO": "gb-sct", "USA": "us", "PAR": "py", "AUS": "au", "TUR": "tr", "GER": "de", "CUW": "cw", "CIV": "ci", "ECU": "ec", "NED": "nl", "JPN": "jp", "SWE": "se", "TUN": "tn", "BEL": "be", "EGY": "eg", "IRN": "ir", "NZL": "nz", "ESP": "es", "CPV": "cv", "KSA": "sa", "URU": "uy", "FRA": "fr", "SEN": "sn", "IRQ": "iq", "NOR": "no", "ARG": "ar", "ALG": "dz", "AUT": "at", "JOR": "jo", "POR": "pt", "COD": "cd", "UZB": "uz", "COL": "co", "ENG": "gb-eng", "CRO": "hr", "GHA": "gh", "PAN": "pa" };
  return `https://flagcdn.com/w80/${mapping[sigla.toUpperCase()] || "un"}.png`;
};

export const bgImages = {
  landing: "/images/marcos-moraes-rFehnP5wN4Q-unsplash.jpg",
  dentro: "/images/michael-lee-6J7eIvNwttQ-unsplash.jpg",
  predictions: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093",
  honor: "https://images.unsplash.com/photo-1518091044754-94b1fd56977c?q=80&w=1974",
  ranking: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070",

/*  landing: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2070",
  dentro: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093",
  predictions: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093",
  honor: "https://images.unsplash.com/photo-1518091044754-94b1fd56977c?q=80&w=1974",
  ranking: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070",
*/
};
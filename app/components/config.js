// --- CONFIGURACIÓN GENERAL Y ESTILOS ---

export const getFlag = (team) => {
  if (!team) return "https://flagcdn.com/w80/un.png";

  const mapping = {
    // SIGLAS
    "MEX": "mx", "RSA": "za", "KOR": "kr", "CZE": "cz", "CAN": "ca", "BIH": "ba", 
    "QAT": "qa", "SUI": "ch", "BRA": "br", "MAR": "ma", "HAI": "ht", "SCO": "gb-sct", 
    "USA": "us", "PAR": "py", "AUS": "au", "TUR": "tr", "GER": "de", "CUW": "cw", 
    "CIV": "ci", "ECU": "ec", "NED": "nl", "JPN": "jp", "SWE": "se", "TUN": "tn", 
    "BEL": "be", "EGY": "eg", "IRN": "ir", "NZL": "nz", "ESP": "es", "CPV": "cv", 
    "KSA": "sa", "URU": "uy", "FRA": "fr", "SEN": "sn", "IRQ": "iq", "NOR": "no", 
    "ARG": "ar", "ALG": "dz", "AUT": "at", "JOR": "jo", "POR": "pt", "COD": "cd", 
    "UZB": "uz", "COL": "co", "ENG": "gb-eng", "CRO": "hr", "GHA": "gh", "PAN": "pa",
    
    // NOMBRES COMPLETOS
    "MEXICO": "mx", "SOUTH AFRICA": "za", "SOUTH KOREA": "kr", "CZECHIA": "cz", 
    "CANADA": "ca", "BOSNIA AND HERZEGOVINA": "ba", "QATAR": "qa", "SWITZERLAND": "ch", 
    "BRAZIL": "br", "MOROCCO": "ma", "HAITI": "ht", "SCOTLAND": "gb-sct", 
    "PARAGUAY": "py", "AUSTRALIA": "au", "TÜRKIYE": "tr", "TURKEY": "tr",
    "GERMANY": "de", "CURAÇAO": "cw", "IVORY COAST": "ci", "ECUADOR": "ec", 
    "NETHERLANDS": "nl", "JAPAN": "jp", "SWEDEN": "se", "TUNISIA": "tn", 
    "BELGIUM": "be", "EGYPT": "eg", "IRAN": "ir", "NEW ZEALAND": "nz", 
    "SPAIN": "es", "CABO VERDE": "cv", "SAUDI ARABIA": "sa", "URUGUAY": "uy", 
    "FRANCE": "fr", "SENEGAL": "sn", "IRAQ": "iq", "NORWAY": "no", 
    "ARGENTINA": "ar", "ALGERIA": "dz", "AUSTRIA": "at", "JORDAN": "jo", 
    "PORTUGAL": "pt", "CONGO DR": "cd", "UZBEKISTAN": "uz", "COLOMBIA": "co", 
    "ENGLAND": "gb-eng", "CROATIA": "hr", "GHANA": "gh", "PANAMA": "pa"
  };

  const key = team.toUpperCase();
  if (/^[W|R|1|2|3]/.test(key)) return "https://flagcdn.com/w80/un.png";

  return `https://flagcdn.com/w80/${mapping[key] || "un"}.png`;
};

export const bgImages = {
  landing: "/images/marcos-moraes-rFehnP5wN4Q-unsplash.jpg",
  dentro: "/images/michael-lee-6J7eIvNwttQ-unsplash.jpg",
  predictions: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2093",
  honor: "https://images.unsplash.com/photo-1518091044754-94b1fd56977c?q=80&w=1974",
  ranking: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070",
};
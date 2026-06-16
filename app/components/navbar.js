// components/navbar.js

export default function Navbar({ t, tab, setTab }) {
  // Array completo con las pestañas de navegación de la app internacionalizadas
  const menuItems = [
    { id: 'rules', label: t.nav_inicio },
    { id: 'matches', label: t.nav_pronosticos },
    { id: 'results', label: t.nav_resultados },
    { id: 'seguimiento', label: t.nav_seguimiento },
    { id: 'ranking', label: t.nav_ranking },
    { id: 'bets', label: t.nav_apuestas },
    { id: 'stats', label: t.nav_estadisticas },
    { id: 'salon', label: t.nav_salon }
  ];

  return (
    // Agregamos justify-start (por defecto en móvil) y md:justify-center (en pantallas grandes)
    // Se añade un padding horizontal extra (px-6) para que el scroll tenga margen al llegar a los extremos
    <nav className="flex justify-start md:justify-center gap-3 p-4 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-x-auto no-scrollbar px-6 w-full">
      {menuItems.map((section) => (
        <button 
          key={section.id} 
          onClick={() => setTab(section.id)} 
          // Añadimos la clase clave: flex-shrink-0
          className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all tracking-widest whitespace-nowrap ${
            tab === section.id 
              ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' 
              : 'bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
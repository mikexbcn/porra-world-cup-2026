// components/navbar.js

export default function Navbar({ t, tab, setTab }) {
  // Array completo con las 6 pestañas de navegación de la app internacionalizadas
  const menuItems = [
    { id: 'rules', label: t.nav_inicio },
    { id: 'matches', label: t.nav_pronosticos },
    { id: 'results', label: t.nav_resultados },
    { id: 'ranking', label: t.nav_ranking },
    { id: 'bets', label: t.nav_apuestas }
  ];

  return (
    <nav className="flex justify-center gap-3 p-4 bg-black/40 backdrop-blur-md border-b border-white/10 overflow-x-auto no-scrollbar">
      {menuItems.map((section) => (
        <button 
          key={section.id} 
          onClick={() => setTab(section.id)} 
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase transition-all tracking-widest whitespace-nowrap ${
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
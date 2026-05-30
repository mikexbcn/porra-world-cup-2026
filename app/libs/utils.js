// app/libs/utils.js
 
export function recalcularClasificacion(matches, predicts, setTablas) {
    let nuevasTablas = {};
    const grupos = [
        'GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 
        'GROUP G', 'GROUP H', 'GROUP I', 'GROUP J', 'GROUP K', 'GROUP L'
    ];
    
    grupos.forEach(g => {
      let eq = {};
      matches.filter(m => m.group_stage?.toUpperCase() === g).forEach(m => {
        [m.home_team, m.away_team].forEach(t => { 
          if(!eq[t]) eq[t]={nombre:t, pts:0, pj:0, gd:0, gf:0} 
        });
        const p = predicts[m.id];
        if (p && p.h !== null && p.a !== null && p.h !== '' && p.a !== '') {
          const h = parseInt(p.h), a = parseInt(p.a);
          if (!isNaN(h) && !isNaN(a)) {
              eq[m.home_team].pj++; eq[m.away_team].pj++;
              eq[m.home_team].gd += (h-a); eq[m.away_team].gd += (a-h);
              eq[m.home_team].gf += h; eq[m.away_team].gf += a;   
              if(h>a) eq[m.home_team].pts+=3; 
              else if(a>h) eq[m.away_team].pts+=3; 
              else { eq[m.home_team].pts++; eq[m.away_team].pts++ }
          }
        }
      });
      nuevasTablas[g] = Object.values(eq).sort((a,b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if ((b.gf||0) !== (a.gf||0)) return (b.gf||0) - (a.gf||0);
        return a.nombre.localeCompare(b.nombre);
      });
    });
    
    setTablas(nuevasTablas);
}
 
export function getMejoresTerceros(datostablas) {
  const terceros = [];
  const grupos = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  if (!datostablas) return [];
  grupos.forEach(letra => {
    const tabla = datostablas[`GROUP ${letra}`];
    if (tabla && tabla[2]) {
      terceros.push({ ...tabla[2], grupo: letra });
    }
  });
  return terceros.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if ((b.gf||0) !== (a.gf||0)) return (b.gf||0) - (a.gf||0);
    return a.nombre.localeCompare(b.nombre);
  }).slice(0, 8);
}
// app/libs/utils.js

export function recalcularClasificacion(matches, predicts, setTablas) {
    let nuevasTablas = {};
    // Actualizado a 12 grupos (A-L) para el Mundial 2026
    const grupos = [
        'GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 
        'GROUP G', 'GROUP H', 'GROUP I', 'GROUP J', 'GROUP K', 'GROUP L'
    ];
    
    grupos.forEach(g => {
      let eq = {};
      // Usamos toUpperCase() para comparar sin errores de caja
      matches.filter(m => m.group_stage?.toUpperCase() === g).forEach(m => {
        [m.home_team, m.away_team].forEach(t => { 
            if(!eq[t]) eq[t]={nombre:t, pts:0, pj:0, gd:0} 
        });

        const p = predicts[m.id];
        // Verificamos que exista predicción y no sea un string vacío
        if (p && p.h !== null && p.a !== null && p.h !== '' && p.a !== '') {
          const h = parseInt(p.h), a = parseInt(p.a);
          if (!isNaN(h) && !isNaN(a)) {
              eq[m.home_team].pj++; eq[m.away_team].pj++;
              eq[m.home_team].gd += (h-a); eq[m.away_team].gd += (a-h);
              if(h>a) eq[m.home_team].pts+=3; 
              else if(a>h) eq[m.away_team].pts+=3; 
              else { eq[m.home_team].pts++; eq[m.away_team].pts++ }
          }
        }
      });
      // Ordenamos por puntos y luego por diferencia de goles
      nuevasTablas[g] = Object.values(eq).sort((a,b) => b.pts - a.pts || b.gd - a.gd);
    });
    
    setTablas(nuevasTablas);
}
// app/libs/utils.js

export function recalcularClasificacion(matches, predicts, setTablas) {
    let nuevasTablas = {};
    const grupos = ['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 'GROUP G', 'GROUP H'];
    
    grupos.forEach(g => {
      let eq = {};
      matches.filter(m => m.group_stage === g).forEach(m => {
        [m.home_team, m.away_team].forEach(t => { if(!eq[t]) eq[t]={nombre:t, pts:0, pj:0, gd:0} });
        const p = predicts[m.id];
        if (p && p.h !== null && p.a !== null && p.h !== '') {
          const h = parseInt(p.h), a = parseInt(p.a);
          eq[m.home_team].pj++; eq[m.away_team].pj++;
          eq[m.home_team].gd += (h-a); eq[m.away_team].gd += (a-h);
          if(h>a) eq[m.home_team].pts+=3; else if(a>h) eq[m.away_team].pts+=3; else {eq[m.home_team].pts++; eq[m.away_team].pts++}
        }
      });
      nuevasTablas[g] = Object.values(eq).sort((a,b) => b.pts - a.pts || b.gd - a.gd);
    });
    
    setTablas(nuevasTablas);
}
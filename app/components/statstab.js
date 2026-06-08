// app/components/statstab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const UNLOCK_DATE = new Date('2026-06-11T19:00:00Z'); // 21:00 hora española
//const UNLOCK_DATE = new Date('2020-01-01T00:00:00Z');
const MATCH_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas de margen

export default function StatsTab({ t, partidos, getFlag }) {
    const [bloqueado, setBloqueado] = useState(Date.now() < UNLOCK_DATE.getTime());
    const [extraStats, setExtraStats] = useState([]);
    const [resultStats, setResultStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [partidoVivo, setPartidoVivo] = useState(null);
    const [predVivo, setPredVivo] = useState(null);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setBloqueado(Date.now() < UNLOCK_DATE.getTime());
    }, 10000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (bloqueado) { setLoading(false); return; }
    cargarEstadisticas();
  }, [bloqueado]);

  async function cargarEstadisticas() {
    setLoading(true);
    try {
        // PARTIDO EN JUEGO
      const ahora = Date.now();
      const { data: todosPartidos } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      const vivo = (todosPartidos || []).find(m => {
        const inicio = new Date(m.match_date).getTime();
        return inicio <= ahora && ahora <= inicio + MATCH_DURATION_MS && !m.is_finished;
      });

      if (vivo) {
        setPartidoVivo(vivo);
        // Cargar predicciones de ese partido
        const { data: predsVivo } = await supabase
          .from('predictions')
          .select('prediction_home, prediction_away')
          .eq('match_id', vivo.id.toString());

        const conteo = {};
        let total = 0;
        (predsVivo || []).forEach(p => {
          if (p.prediction_home !== null && p.prediction_away !== null) {
            const key = `${p.prediction_home}-${p.prediction_away}`;
            conteo[key] = (conteo[key] || 0) + 1;
            total++;
          }
        });
        const ordenado = Object.entries(conteo)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        setPredVivo({ datos: ordenado, total });
      } else {
        setPartidoVivo(null);
        setPredVivo(null);
      }

      // 1. Cargar extras
      const { data: extras } = await supabase
        .from('extra_predictions')
        .select('best_player, top_scorer, best_keeper, best_young, fair_play');

      const { data: podiums } = await supabase
        .from('predictions')
        .select('selected_team')
        .eq('match_id', 'podium_1');

      // 2. Cargar predicciones de partidos
      const { data: predicciones } = await supabase
        .from('predictions')
        .select('prediction_home, prediction_away');

      // Procesar extras
        const campeones = (podiums || []).map(p => p.selected_team).filter(Boolean);
        const conteoCampeones = {};
        campeones.forEach(c => {
        const key = c.trim().toUpperCase();
        conteoCampeones[key] = (conteoCampeones[key] || 0) + 1;
        });
        const datosCampeones = Object.entries(conteoCampeones).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const totalCampeones = campeones.length;

        const campos = [
        { key: 'champion', label: t.stats_champion, emoji: '🏆', datosFijos: datosCampeones, totalFijo: totalCampeones },
        { key: 'best_player', label: t.stats_balon, emoji: '🎖️' },
        { key: 'top_scorer', label: t.stats_bota, emoji: '👟' },
        { key: 'best_keeper', label: t.stats_portero, emoji: '🧤' },
        { key: 'best_young', label: t.stats_joven, emoji: '👶' },
        { key: 'fair_play', label: t.stats_fairplay, emoji: '🤝' },
      ];

const statsExtras = campos.map(campo => {
  if (campo.datosFijos) {
    return { ...campo, datos: campo.datosFijos, total: campo.totalFijo };
  }
  const conteo = {};
  (extras || []).forEach(e => {
    const val = e[campo.key];
    if (val && val.trim() !== '') {
      const key = val.trim().toUpperCase();
      conteo[key] = (conteo[key] || 0) + 1;
    }
        });
        const ordenado = Object.entries(conteo)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        const total = Object.values(conteo).reduce((a, b) => a + b, 0);
        return { ...campo, datos: ordenado, total };
      });

      setExtraStats(statsExtras);

      // Procesar resultados de partidos
      if (predicciones && predicciones.length > 0) {
        const validas = predicciones.filter(p =>
          p.prediction_home !== null && p.prediction_away !== null
        );

        // Resultado más repetido
        const conteoResultados = {};
        validas.forEach(p => {
          const key = `${p.prediction_home}-${p.prediction_away}`;
          conteoResultados[key] = (conteoResultados[key] || 0) + 1;
        });
        const masRepetido = Object.entries(conteoResultados)
          .sort((a, b) => b[1] - a[1])[0];

        // Victorias local, visitante, empates
        let local = 0, visitante = 0, empates = 0;
        validas.forEach(p => {
          if (p.prediction_home > p.prediction_away) local++;
          else if (p.prediction_away > p.prediction_home) visitante++;
          else empates++;
        });

        // Más y menos goles
        const conGoles = validas.map(p => ({
          total: p.prediction_home + p.prediction_away,
          resultado: `${p.prediction_home}-${p.prediction_away}`
        }));
        const masGoles = conGoles.sort((a, b) => b.total - a.total)[0];
        const menosGoles = conGoles.sort((a, b) => a.total - b.total)[0];

        setResultStats({
          masRepetido: masRepetido ? { resultado: masRepetido[0], votos: masRepetido[1] } : null,
          local, visitante, empates,
          total: validas.length,
          masGoles: masGoles?.resultado,
          menosGoles: menosGoles?.resultado,
        });
      }
    } catch (err) {
      console.error("Error cargando estadísticas:", err);
    } finally {
      setLoading(false);
    }
  }

  if (bloqueado) {
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-fade-in">
        <div className="bg-black/40 border border-white/10 rounded-3xl p-10">
          <span className="text-5xl block mb-4">🔒</span>
          <h3 className="text-lg font-black text-yellow-500 uppercase tracking-wider mb-3">
            {t.stats_locked_title}
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t.stats_locked_desc}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-xs font-black text-yellow-500 uppercase tracking-widest py-12">{t.loading}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in space-y-8">

{/* PARTIDO EN JUEGO */}
      {partidoVivo ? (
        <div className="bg-red-950/30 border border-red-500/40 rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block"></span>
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{t.stats_live_title}</span>
          </div>
          <div className="flex justify-between items-center gap-4 mt-4 mb-5">
            <div className="flex-1 text-center">
              <img src={getFlag(partidoVivo.home_team)} className="w-12 h-8 mx-auto mb-2 rounded shadow" alt="" />
              <span className="text-[10px] font-black uppercase block">{partidoVivo.home_team}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black text-gray-500 uppercase">VS</span>
            </div>
            <div className="flex-1 text-center">
              <img src={getFlag(partidoVivo.away_team)} className="w-12 h-8 mx-auto mb-2 rounded shadow" alt="" />
              <span className="text-[10px] font-black uppercase block">{partidoVivo.away_team}</span>
            </div>
          </div>

          {predVivo && predVivo.total > 0 && (
            <div className="bg-black/40 rounded-2xl p-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">
                {t.stats_live_distribution} — {predVivo.total} {t.stats_live_predictions}
              </p>
              <div className="space-y-2">
                {predVivo.datos.map(([resultado, votos], i) => (
                  <div key={resultado}>
                    <div className="flex justify-between text-[10px] font-black mb-1">
                      <span className={i === 0 ? 'text-yellow-500' : 'text-gray-300'}>{resultado}</span>
                      <span className="text-gray-500">{votos} {t.stats_votos} ({Math.round((votos / predVivo.total) * 100)}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${i === 0 ? 'bg-yellow-500' : 'bg-white/20'}`}
                        style={{ width: `${Math.round((votos / predVivo.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 text-center">
          <span className="text-[10px] text-gray-500 font-black uppercase">{t.stats_live_no_match}</span>
        </div>
      )}

      {/* ESTADÍSTICAS DE EXTRAS */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h2 className="text-xl font-black text-yellow-500 italic uppercase mb-6 text-center tracking-widest">
          🏆 {t.nav_extras}
        </h2>
        <div className="space-y-6">
          {extraStats.map(stat => (
            <div key={stat.key}>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                {stat.emoji} {stat.label}
              </h3>
              {stat.datos.length === 0 ? (
                <p className="text-[10px] text-gray-600">-</p>
              ) : (
                <div className="space-y-2">
                  {stat.datos.map(([nombre, votos], i) => (
                    <div key={nombre}>
                      <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                        <span className={i === 0 ? 'text-yellow-500' : 'text-gray-300'}>{nombre}</span>
                        <span className="text-gray-500">{votos} {t.stats_votos}</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${i === 0 ? 'bg-yellow-500' : 'bg-white/20'}`}
                          style={{ width: `${Math.round((votos / stat.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ESTADÍSTICAS DE RESULTADOS */}
      {resultStats && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h2 className="text-xl font-black text-yellow-500 italic uppercase mb-6 text-center tracking-widest">
            ⚽ {t.stats_resultados}
          </h2>

          {/* Resultado más repetido */}
          {resultStats.masRepetido && (
            <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-4 mb-6 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.stats_mas_repetido}</p>
              <p className="text-4xl font-black text-yellow-500">{resultStats.masRepetido.resultado}</p>
              <p className="text-[10px] text-gray-500 mt-1">{resultStats.masRepetido.votos} {t.stats_votos}</p>
            </div>
          )}

          {/* Victorias local / empate / visitante */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: t.stats_victorias_local, value: resultStats.local, color: 'text-green-400' },
              { label: t.stats_empates, value: resultStats.empates, color: 'text-yellow-500' },
              { label: t.stats_victorias_visitante, value: resultStats.visitante, color: 'text-blue-400' },
            ].map(item => (
              <div key={item.label} className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                <p className="text-[9px] text-gray-500 font-black uppercase mt-1">{item.label}</p>
                <p className="text-[9px] text-gray-600">
                  {resultStats.total > 0 ? Math.round((item.value / resultStats.total) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>

          {/* Más y menos goles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{t.stats_mas_goles}</p>
              <p className="text-2xl font-black text-white">{resultStats.masGoles}</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{t.stats_menos_goles}</p>
              <p className="text-2xl font-black text-white">{resultStats.menosGoles}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
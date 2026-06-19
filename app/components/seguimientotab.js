// app/components/seguimientotab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const REFRESH_INTERVAL = 30000; // Refresca cada 30 segundos

export default function SeguimientoTab({ t, getFlag, session }) {
  const [partidos, setPartidos] = useState([]);
  const [pronosticos, setPronosticos] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
    const intervalo = setInterval(cargarDatos, REFRESH_INTERVAL);
    return () => clearInterval(intervalo);
  }, []);

  async function cargarDatos() {
    try {
      // 1. Cargar todos los partidos ordenados por fecha
      const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      // 2. Cargar todos los pronósticos de todos los usuarios
      const { data: preds } = await supabase
        .from('predictions')
        .select('user_id, match_id, prediction_home, prediction_away');

      // 3. Cargar usuarios (sin DEMO)
      const { data: users } = await supabase
        .from('profiles')
        .select('id, username')
        .neq('username', 'DEMO')
        .order('username');

      if (matches) setPartidos(matches);
      if (users) setUsuarios(users);

      // Organizar pronósticos por match_id y user_id
      const predMap = {};
      (preds || []).forEach(p => {
        if (!predMap[p.match_id]) predMap[p.match_id] = {};
        predMap[p.match_id][p.user_id] = {
          h: p.prediction_home,
          a: p.prediction_away
        };
      });
      setPronosticos(predMap);

    } catch (err) {
      console.error("Error cargando seguimiento:", err);
    } finally {
      setLoading(false);
    }
  }

  // Encontrar la ventana de partidos: 2 anteriores, 1 en juego, 2 siguientes
  const ahora = Date.now();
  const MATCH_DURATION = 2 * 60 * 60 * 1000; // 2 horas

  const getEstadoPartido = (match) => {
    const inicio = new Date(match.match_date).getTime();
    if (match.is_finished) return 'FINALIZADO';
    if (inicio <= ahora && ahora <= inicio + MATCH_DURATION) return 'EN_JUEGO';
    if (inicio > ahora) return 'PENDIENTE';
    return 'FINALIZADO';
  };

  // Encontrar índice del partido en juego o el próximo
  let idxReferencia = partidos.findIndex(m => getEstadoPartido(m) === 'EN_JUEGO');
  if (idxReferencia === -1) {
    idxReferencia = partidos.findIndex(m => getEstadoPartido(m) === 'PENDIENTE');
  }
  if (idxReferencia === -1) idxReferencia = partidos.length - 1;

  const inicio = Math.max(0, idxReferencia - 2);
  const fin = Math.min(partidos.length, idxReferencia + 3);
  const partidosVisibles = partidos.slice(inicio, fin);

  if (loading) {
    return <div className="text-center text-xs font-black text-yellow-500 uppercase tracking-widest py-12">{t.loading}</div>;
  }

  if (partidosVisibles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xs text-gray-500 font-black uppercase">{t.seguimiento_sin_partidos}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in space-y-4">

      {partidosVisibles.map(match => {
        const estado = getEstadoPartido(match);
        const matchId = match.id.toString();
        const tieneResultado = match.home_score !== null && match.away_score !== null;

        return (
          <div key={match.id} className={`rounded-3xl border p-5 transition-all ${
            estado === 'EN_JUEGO'
              ? 'bg-red-950/30 border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
              : estado === 'FINALIZADO'
                ? 'bg-white/5 border-white/10'
                : 'bg-black/40 border-white/5'
          }`}>

            {/* CABECERA ESTADO */}
            <div className="flex justify-between items-center mb-4">
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                estado === 'EN_JUEGO'
                  ? 'bg-red-500/20 text-red-400 flex items-center gap-1.5'
                  : estado === 'FINALIZADO'
                    ? 'bg-green-950/40 text-green-500'
                    : 'bg-white/5 text-gray-500'
              }`}>
                {estado === 'EN_JUEGO' && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block"></span>}
                {estado === 'EN_JUEGO' ? t.seguimiento_en_juego : estado === 'FINALIZADO' ? t.seguimiento_anterior : t.seguimiento_siguiente}
              </span>
              <span className="text-[9px] text-gray-500 font-black">
                {match.group_stage} — {new Date(match.match_date).toLocaleString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* EQUIPOS Y MARCADOR */}
            <div className="flex justify-between items-center gap-4 mb-5">
              <div className="flex-1 text-center">
                <img src={getFlag(match.home_team)} className="w-14 h-9 mx-auto mb-2 rounded shadow" alt="" />
                <span className="text-[10px] font-black uppercase block">{match.home_team}</span>
              </div>
              <div className="text-center min-w-[80px]">
                {tieneResultado ? (
                  <div className="bg-black/60 border border-white/20 rounded-2xl px-4 py-2">
                    <span className="text-2xl font-black text-white">{match.home_score}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span className="text-2xl font-black text-white">{match.away_score}</span>
                  </div>
                ) : (
                  <div className="bg-black/40 border border-white/10 rounded-2xl px-4 py-2">
                    <span className="text-lg font-black text-gray-600">VS</span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-center">
                <img src={getFlag(match.away_team)} className="w-14 h-9 mx-auto mb-2 rounded shadow" alt="" />
                <span className="text-[10px] font-black uppercase block">{match.away_team}</span>
              </div>
            </div>

            {/* PRONÓSTICOS DE TODOS LOS JUGADORES */}
            {(match.group_stage?.includes('GROUP') || estado !== 'PENDIENTE') ? (
            <div className="bg-black/40 rounded-2xl p-3 space-y-2">
              {usuarios.map(user => {
                const pred = pronosticos[matchId]?.[user.id];
                const tienePred = pred && pred.h !== null && pred.a !== null;
                const acerto = tieneResultado && tienePred &&
                  parseInt(pred.h) === match.home_score &&
                  parseInt(pred.a) === match.away_score;

                return (
                  <div key={user.id} className={`flex justify-between items-center px-3 py-2 rounded-xl ${
                    acerto ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/3'
                  }`}>
                    <span className={`text-[10px] font-black uppercase ${
                      user.id === session?.user?.id ? 'text-yellow-500' : 'text-gray-300'
                    }`}>
                      {user.id === session?.user?.id ? '★ ' : ''}{user.username}
                    </span>
                    <div className="flex items-center gap-2">
                      {tienePred ? (
                        <>
                          <span className="text-[10px] font-black text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                            {pred.h} - {pred.a}
                          </span>
                          {estado === 'FINALIZADO' && (
                            <span className={`text-[9px] font-black ${acerto ? 'text-yellow-500' : 'text-gray-600'}`}>
                              {acerto ? t.seguimiento_ganador : '✗'}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[9px] text-gray-600 font-black uppercase">{t.seguimiento_tu_pronostico}</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
            ) : (
              <div className="bg-black/40 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-gray-500 font-black uppercase">🔒 {t.seguimiento_oculto}</span>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}
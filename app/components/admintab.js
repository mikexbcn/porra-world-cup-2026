// app/components/admintab.js
import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { calcularPuntosPartido } from '../libs/motorpuntos'
import { getMejoresTerceros } from '../libs/utils'

export default function AdminTab({ session, partidos, setPartidos, t, getFlag, jugadores = [] }) {
  const [resultados, setResultados] = useState({})
  
  // ESTADOS NUEVOS PARA EL AUTOCOMPLETADO DE LOS EXTRAS EN EL ADMIN
  const [busquedaGoleador, setBusquedaGoleador] = useState('')
  const [busquedaJugador, setBusquedaJugador] = useState('')
  const [busquedaPortero, setBusquedaPortero] = useState('')
  const [busquedaJoven, setBusquedaJoven] = useState('')
  
  const [mostrarGoleador, setMostrarGoleador] = useState(false)
  const [mostrarJugador, setMostrarJugador] = useState(false)
  const [mostrarPortero, setMostrarPortero] = useState(false)
  const [mostrarJoven, setMostrarJoven] = useState(false)
   
  const [loadingMatchId, setLoadingMatchId] = useState(null)
  const [filtroFase, setFiltroFase] = useState('GROUP A')

// --- NUEVO: Estados para los Premios Extra y Podio ---
const [extrasOficiales, setExtrasOficiales] = useState({
    champion: '', runner_up: '', third_place: '', fourth_place: '',
    top_scorer: '', best_keeper: '', best_player: '',
    fair_play: '', best_young: ''
  })
  const [guardandoExtras, setGuardandoExtras] = useState(false)
  const [guardandoSnapshot, setGuardandoSnapshot] = useState(false)
  const [totalVisitas, setTotalVisitas] = useState(null)

  // Tu email de administrador para proteger el panel
  const ADMIN_EMAIL = 'mikemulderx@gmail.com' // <-- CAMBIA ESTO POR TU EMAIL REAL

  // Inicializar los inputs con los resultados que ya existan en la BD (home_score y away_score)
// Inicializar los inputs con los resultados que ya existan en la BD
  useEffect(() => {
    if (partidos && partidos.length > 0) {
      const map = {}
      partidos.forEach(m => {
        map[m.id] = {
          h: m.home_score !== null && m.home_score !== undefined ? m.home_score.toString() : '',
          a: m.away_score !== null && m.away_score !== undefined ? m.away_score.toString() : '',
          is_finished: m.is_finished || false // <-- NUEVO: Guardamos el estado de la casilla
        }
      })
      setResultados(map)
    }
  }, [partidos])

// --- NUEVO: Cargar resultados extra oficiales al arrancar ---
  useEffect(() => {
    async function cargarExtrasOficiales() {
      try {
        const { data, error } = await supabase
          .from('extra_results')
          .select('*')
          .eq('id', 1)
          .single()

        if (error) throw error
        if (data) {
          setExtrasOficiales({
            champion: data.champion || '',
            runner_up: data.runner_up || '',
            third_place: data.third_place || '',
            fourth_place: data.fourth_place || '',
            top_scorer: data.top_scorer || '',
            best_keeper: data.best_keeper || '',
            best_player: data.best_player || '',
            fair_play: data.fair_play || '',
            best_young: data.best_young || ''
          })
        }
      } catch (err) {
        console.error("Error cargando extras oficiales:", err)
      }
    }    
    if (session?.user?.email === ADMIN_EMAIL) {
    cargarExtrasOficiales();
    supabase
      .from('visit_counter')
      .select('total_visits, last_visit')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data !== null) setTotalVisitas(data);
      });
    }  
   }, [session])

// Seguridad estricta: Si no es el admin, no ve absolutamente nada (Internacionalizado)
  if (session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-8 text-center max-w-md mx-auto my-12">
        <span className="text-3xl block mb-2">❌</span>
        <h3 className="text-sm font-black text-red-500 uppercase tracking-wider">
          {t.admin_denied_title || 'Acceso Denegado'}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {t.admin_denied_desc || 'No tienes permisos de administrador.'}
        </p>
      </div>
    )
  }

// Guardar el resultado de un partido individual
// Guardar el resultado y nombres de un partido individual
// Guardar el resultado y nombres de un partido individual

const handleGuardarResultado = async (matchId) => {
    
  // Buscamos los nombres escritos en vivo directamente del estado actual del partido
  const partidoEnVivo = partidos.find(p => p.id === matchId);
  const homeTeam = partidoEnVivo?.home_team || '';
  const awayTeam = partidoEnVivo?.away_team || '';

  const score = resultados[matchId]

  // Vemos si el administrador ha marcado manualmente el checkbox de este partido
  const estaFinalizado = resultados[matchId]?.is_finished || false

  const tieneHome = score?.h !== undefined && score.h.trim() !== ''
  const tieneAway = score?.a !== undefined && score.a.trim() !== ''

  // Si marca "Finalizado" pero se le olvida poner los goles, le avisamos
  if (estaFinalizado && (!tieneHome || !tieneAway)) {
    alert(t.admin_alert_missing_scores || 'Para marcar un partido como finalizado debes introducir ambos goles.')
    return
  }

  try {
    setLoadingMatchId(matchId)

    // Si los campos de goles están completamente vacíos, los enviamos como null a la BD
    const homeScoreValue = tieneHome ? parseInt(score.h, 10) : null
    const awayScoreValue = tieneAway ? parseInt(score.a, 10) : null

    // Modificamos solo estas 2 líneas del objeto para que coja el texto que envías
    const datosActualizar = {
      home_team: homeTeam,
      away_team: awayTeam,
      home_score: homeScoreValue,
      away_score: awayScoreValue,
      is_finished: estaFinalizado
    }

    // Actualizamos en Supabase
    const { error } = await supabase
      .from('matches')
      .update(datosActualizar)
      .eq('id', matchId)

    if (error) throw error

    // Actualizar el estado local
    setPartidos(prev => prev.map(m => m.id === matchId ? { ...m, ...datosActualizar } : m))

    alert(`${t.admin_alert_match || 'Partido'} ${homeTeam} vs ${awayTeam} ${t.admin_alert_updated_success || 'actualizado correctamente.'}`)

  } catch (err) {
    console.error('Error guardando resultado:', err)
    alert(t.admin_alert_save_error || 'No se pudo guardar el resultado.')
  } finally {
    setLoadingMatchId(null)
  }
}

  // Manejar el cambio de texto en los inputs
  const handleInputChange = (matchId, campo, valor) => {
    // Solo permitir números o vacío
    if (valor !== '' && !/^\d+$/.test(valor)) return

    setResultados(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [campo]: valor
      }
    }))
  }

  const handleGuardarSnapshot = async () => {
    setGuardandoSnapshot(true)
    try {
      // 1. Traer todos los datos necesarios
      const { data: usuarios } = await supabase.from('profiles').select('id, username').neq('username', 'DEMO')
      const { data: todasLasPredicciones } = await supabase.from('predictions').select('user_id, match_id, prediction_home, prediction_away, selected_team')
      const { data: todasLasPrediccionesExtras } = await supabase.from('extra_predictions').select('*')
      const { data: resultadosExtrasOficiales } = await supabase.from('extra_results').select('*').eq('id', 1).maybeSingle()
      const { data: partidosFisicos } = await supabase.from('matches').select('*')

      const partidosMap = {}
      partidosFisicos?.forEach(m => { partidosMap[m.id] = m })

      const grupos = ['A','B','C','D','E','F','G','H','I','J','K','L']

      // ROUND 32
      const equiposRealesRound32 = new Set()
      partidosFisicos?.filter(m => m.group_stage?.toUpperCase() === "ROUND 32").forEach(m => {
        if (m.home_team && !/\d/.test(m.home_team)) equiposRealesRound32.add(m.home_team.toUpperCase().trim())
        if (m.away_team && !/\d/.test(m.away_team)) equiposRealesRound32.add(m.away_team.toUpperCase().trim())
      })

      // FASES ROUND 16 EN ADELANTE
      const equiposRealesEnFase = { "ROUND 16": new Set(), "QUARTER-FINAL": new Set(), "SEMI-FINAL": new Set(), "3RD PLACE": new Set(), "FINAL": [] }
      Object.values(partidosMap).forEach(m => {
        const fase = m.group_stage?.toUpperCase()
        if (!fase || fase === "ROUND 32" || fase.startsWith("GROUP")) return
        if (equiposRealesEnFase[fase] === undefined) return
        if (m.home_team && !/\d/.test(m.home_team)) {
          const nombre = m.home_team.toUpperCase().trim()
          if (nombre && nombre !== "NULL") {
            if (fase === "FINAL") equiposRealesEnFase["FINAL"].push(nombre)
            else equiposRealesEnFase[fase].add(nombre)
          }
        }
        if (m.away_team && !/\d/.test(m.away_team)) {
          const nombre = m.away_team.toUpperCase().trim()
          if (nombre && nombre !== "NULL") {
            if (fase === "FINAL") equiposRealesEnFase["FINAL"].push(nombre)
            else equiposRealesEnFase[fase].add(nombre)
          }
        }
      })

      const clasificadosFinales = {
        "ROUND 32": Array.from(equiposRealesRound32),
        "ROUND 16": Array.from(equiposRealesEnFase["ROUND 16"]),
        "QUARTER-FINAL": Array.from(equiposRealesEnFase["QUARTER-FINAL"]),
        "SEMI-FINAL": Array.from(equiposRealesEnFase["SEMI-FINAL"]),
        "3RD PLACE": Array.from(equiposRealesEnFase["3RD PLACE"]),
        "FINAL": equiposRealesEnFase["FINAL"]
      }

      // CALCULAR PUNTOS POR USUARIO
      const rankingActual = usuarios.map(user => {
        const apuestasUsuario = todasLasPredicciones.filter(p => p.user_id === user.id)

        // Reconstruir tabla pronosticada del usuario para ROUND 32
        const tablasUsuario = {}
        grupos.forEach(letra => {
          const grupo = `GROUP ${letra}`
          const eq = {}
          partidosFisicos?.filter(m => m.group_stage?.toUpperCase() === grupo).forEach(m => {
            const tienePred = apuestasUsuario.some(p => p.match_id === m.id)
            if (!tienePred) return
            if (!eq[m.home_team]) eq[m.home_team] = { nombre: m.home_team, pts: 0, gd: 0, gf: 0 }
            if (!eq[m.away_team]) eq[m.away_team] = { nombre: m.away_team, pts: 0, gd: 0, gf: 0 }
            const pred = apuestasUsuario.find(p => p.match_id === m.id)
            if (pred && pred.prediction_home !== null && pred.prediction_away !== null) {
              const h = parseInt(pred.prediction_home, 10)
              const a = parseInt(pred.prediction_away, 10)
              if (!isNaN(h) && !isNaN(a)) {
                eq[m.home_team].gd += (h - a); eq[m.away_team].gd += (a - h)
                eq[m.home_team].gf += h; eq[m.away_team].gf += a
                if (h > a) eq[m.home_team].pts += 3
                else if (a > h) eq[m.away_team].pts += 3
                else { eq[m.home_team].pts += 1; eq[m.away_team].pts += 1 }
              }
            }
          })
          tablasUsuario[grupo] = Object.values(eq).sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : (b.gf||0) !== (a.gf||0) ? (b.gf||0) - (a.gf||0) : a.nombre.localeCompare(b.nombre))
        })

        const equiposUsuarioRound32 = new Set()
        grupos.forEach(letra => {
          const tabla = tablasUsuario[`GROUP ${letra}`]
          if (tabla?.[0]?.nombre) equiposUsuarioRound32.add(tabla[0].nombre.toUpperCase().trim())
          if (tabla?.[1]?.nombre) equiposUsuarioRound32.add(tabla[1].nombre.toUpperCase().trim())
        })

        const tercerosOrdenados = getMejoresTerceros(tablasUsuario)
        tercerosOrdenados.slice(0, 8).forEach(e => equiposUsuarioRound32.add(e.nombre.toUpperCase().trim()))

        let puntosTotales = 0
        let golesAcertados = 0

        // MARCADORES
        apuestasUsuario.forEach(apuesta => {
          const partidoReal = partidosMap[apuesta.match_id]
          if (partidoReal && partidoReal.is_finished) {
            const ptsPartido = calcularPuntosPartido(apuesta.prediction_home, apuesta.prediction_away, partidoReal.home_score, partidoReal.away_score)
            puntosTotales += ptsPartido
            if (ptsPartido === 5 && apuesta.prediction_home !== null && apuesta.prediction_away !== null) {
              golesAcertados += Number(apuesta.prediction_home) + Number(apuesta.prediction_away)
            }
          }
        })

        // ROUND 32
        equiposUsuarioRound32.forEach(equipoUsuario => {
          if (clasificadosFinales["ROUND 32"].includes(equipoUsuario)) puntosTotales += 1
        })

        // ROUND 16 EN ADELANTE
        apuestasUsuario.forEach(apuesta => {
          const matchIdStr = String(apuesta.match_id)
          let faseObjetivo = ""
          let puntosPorClasificar = 0
          const numId = parseInt(matchIdStr, 10)
          if (numId >= 89 && numId <= 96) { faseObjetivo = "ROUND 16"; puntosPorClasificar = 2 }
          else if (numId >= 97 && numId <= 100) { faseObjetivo = "QUARTER-FINAL"; puntosPorClasificar = 4 }
          else if (numId === 101 || numId === 102) { faseObjetivo = "SEMI-FINAL"; puntosPorClasificar = 8 }
          else if (numId === 103) { faseObjetivo = "3RD PLACE"; puntosPorClasificar = 12 }
          else if (numId === 104) { faseObjetivo = "FINAL"; puntosPorClasificar = 10 }

          if (matchIdStr === 'podium_1') {
            const partidoFinal = Object.values(partidosMap).find(m => m.group_stage?.toUpperCase() === "FINAL")
            if (partidoFinal && partidoFinal.is_finished) {
              let campeon = ""
              if (partidoFinal.home_score > partidoFinal.away_score) campeon = partidoFinal.home_team
              else if (partidoFinal.away_score > partidoFinal.home_score) campeon = partidoFinal.away_team
              if (campeon && campeon.toUpperCase().trim() === apuesta.selected_team?.toUpperCase().trim()) puntosTotales += 20
            }
            return
          }
          if (matchIdStr === 'podium_3') {
            const partido3 = Object.values(partidosMap).find(m => m.group_stage?.toUpperCase() === "3RD PLACE")
            if (partido3 && partido3.is_finished) {
              let tercero = ""
              if (partido3.home_score > partido3.away_score) tercero = partido3.home_team
              else if (partido3.away_score > partido3.home_score) tercero = partido3.away_team
              if (tercero && tercero.toUpperCase().trim() === apuesta.selected_team?.toUpperCase().trim()) puntosTotales += 12
            }
            return
          }
          if (matchIdStr === 'podium_2' || matchIdStr === 'podium_4') return
          if (numId === 103) return
          if (!faseObjetivo) return
          if (!apuesta.selected_team || apuesta.selected_team === 'null') return

          const equipoPredicho = apuesta.selected_team.toUpperCase().trim()
          const listaReales = clasificadosFinales[faseObjetivo] || []

          if (faseObjetivo === "FINAL") {
            if (listaReales.includes(equipoPredicho)) puntosTotales += 10
          } else if (faseObjetivo === "3RD PLACE") {
            const partido3 = Object.values(partidosMap).find(m => m.group_stage?.toUpperCase() === "3RD PLACE")
            if (partido3 && partido3.is_finished) {
              let tercero = ""
              if (partido3.home_score > partido3.away_score) tercero = partido3.home_team
              else if (partido3.away_score > partido3.home_score) tercero = partido3.away_team
              if (tercero && tercero.toUpperCase().trim() === equipoPredicho) puntosTotales += 12
            }
          } else {
            if (listaReales.includes(equipoPredicho)) puntosTotales += puntosPorClasificar
          }

          // Marcador exacto en eliminatorias
          const idCuadro = numId
          let indiceEnFase = 0
          if (idCuadro >= 89 && idCuadro <= 96) indiceEnFase = idCuadro - 89
          else if (idCuadro >= 97 && idCuadro <= 100) indiceEnFase = idCuadro - 97
          else if (idCuadro === 101 || idCuadro === 102) indiceEnFase = idCuadro - 101

          const partidosFiltrados = Object.values(partidosMap)
            .filter(m => m.group_stage?.toUpperCase() === faseObjetivo)
            .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())

          const partidoReal = partidosFiltrados[indiceEnFase]
          if (partidoReal && partidoReal.is_finished && apuesta.prediction_home !== null && apuesta.prediction_away !== null) {
            if (Number(apuesta.prediction_home) === Number(partidoReal.home_score) &&
                Number(apuesta.prediction_away) === Number(partidoReal.away_score)) {
              puntosTotales += 5
              golesAcertados += Number(apuesta.prediction_home) + Number(apuesta.prediction_away)
            }
          }
        })

        // EXTRAS
        if (todasLasPrediccionesExtras && resultadosExtrasOficiales) {
          const extrasUsuario = todasLasPrediccionesExtras.find(ep => ep.user_id === user.id)
          if (extrasUsuario) {
            const PTS = 10
            if (resultadosExtrasOficiales.top_scorer && extrasUsuario.top_scorer === resultadosExtrasOficiales.top_scorer) puntosTotales += PTS
            if (resultadosExtrasOficiales.best_player && extrasUsuario.best_player === resultadosExtrasOficiales.best_player) puntosTotales += PTS
            if (resultadosExtrasOficiales.best_keeper && extrasUsuario.best_keeper === resultadosExtrasOficiales.best_keeper) puntosTotales += PTS
            if (resultadosExtrasOficiales.best_young && extrasUsuario.best_young === resultadosExtrasOficiales.best_young) puntosTotales += PTS
            if (resultadosExtrasOficiales.fair_play && extrasUsuario.fair_play === resultadosExtrasOficiales.fair_play) puntosTotales += PTS
          }
        }

        return { user_id: user.id, username: user.username, puntos: puntosTotales, goles: golesAcertados }
      })

      // Ordenar y asignar posición
      rankingActual.sort((a, b) => b.puntos !== a.puntos ? b.puntos - a.puntos : b.goles - a.goles)
      rankingActual.forEach((u, i) => { u.posicion = i + 1 })

// Usar la fecha del último partido finalizado
      const { data: ultimoPartido } = await supabase
        .from('matches')
        .select('match_date')
        .eq('is_finished', true)
        .order('match_date', { ascending: false })
        .limit(1)
        .single()

      const fechaSnapshot = ultimoPartido?.match_date || new Date().toISOString()
      const snapshots = rankingActual.map(u => ({
        match_id: 'manual_' + Date.now(),
        match_date: fechaSnapshot,
        user_id: u.user_id,
        username: u.username,
        puntos: u.puntos,
        posicion: u.posicion
      }))

      // Borrar snapshots con la misma fecha antes de insertar
      await supabase.from('ranking_snapshots').delete().eq('match_date', fechaSnapshot)
      await supabase.from('ranking_snapshots').insert(snapshots)
      alert('📸 Snapshot del ranking guardado correctamente')

    } catch (err) {
      console.error("Error guardando snapshot:", err)
      alert("Error al guardar snapshot: " + err.message)
    } finally {
      setGuardandoSnapshot(false)
    }
  }

// --- NUEVO: Guardar cambios de Premios Extra y Podio ---
  const handleGuardarExtras = async () => {
    setGuardandoExtras(true)
    try {
      const { error } = await supabase
        .from('extra_results')
        .update({
          champion: extrasOficiales.champion,
          runner_up: extrasOficiales.runner_up,
          third_place: extrasOficiales.third_place,
          fourth_place: extrasOficiales.fourth_place,
          top_scorer: extrasOficiales.top_scorer,
          best_keeper: extrasOficiales.best_keeper,
          best_player: extrasOficiales.best_player,
          fair_play: extrasOficiales.fair_play,
          best_young: extrasOficiales.best_young,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1)
    if (error) throw error
      alert(t.admin_alert_extras_success || "Podio y Premios Extra oficiales actualizados correctamente.")
    } catch (err) {
      console.error("Error guardando extras:", err)
      alert((t.admin_alert_extras_error || "Error al guardar: ") + err.message)
    } finally {
      setGuardandoExtras(false)
    }
  }

// 1. Array con el orden exacto cronológico del mundial
  const ordenOficial = [
    'GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E', 'GROUP F', 
    'GROUP G', 'GROUP H', 'GROUP I', 'GROUP J', 'GROUP K', 'GROUP L',
    'ROUND 32', 'ROUND 16', 'QUARTER-FINAL', 'SEMI-FINAL', '3RD PLACE', 'FINAL'
  ]

  // 2. Extraemos los grupos/fases reales usando la columna group_stage y los ordenamos según la lista superior
  const fasesDisponibles = Array.from(new Set(partidos.map(m => m.group_stage)))
    .filter(Boolean)
    .sort((a, b) => ordenOficial.indexOf(a) - ordenOficial.indexOf(b))

  // 3. Modificamos el filtrado para usar tu columna real
  const partidosFiltrados = partidos.filter(m => m.group_stage === filtroFase)
  
return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 animate-fade-in">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-lg font-black text-red-500 italic uppercase mb-6 text-center tracking-widest flex items-center justify-center gap-2">
          <span>⚙️</span> {t.admin_panel_title || 'PANEL DE ADMINISTRADOR'}
        </h2>

          {totalVisitas && (
            <div className="bg-black/40 border border-yellow-500/20 rounded-2xl p-4 mb-6 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">👁 Visitas totales</p>
              <p className="text-3xl font-black text-yellow-500">{totalVisitas.total_visits}</p>
              <p className="text-[10px] text-gray-500 mt-1">
                Última visita: {new Date(totalVisitas.last_visit).toLocaleString('es-ES')}
              </p>
            </div>
          )}

        {/* Selector de Fase/Grupo para no saturar la pantalla */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/5 scrollbar-none">
          {fasesDisponibles.map(fase => (
            <button
              key={fase}
              onClick={() => setFiltroFase(fase)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                filtroFase === fase ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {fase}
            </button>
          ))}
        </div>

        {/* Lista de partidos de la fase seleccionada */}
        <div className="space-y-4">


          {partidosFiltrados.length === 0 ? (
            <p className="text-xs text-center text-gray-500 py-4">
              {t.admin_no_matches || 'No hay partidos cargados en esta fase.'}
            </p>
          ) : (
            partidosFiltrados.map((m) => {
              const mId = m.id
              const cargando = loadingMatchId === mId

            // Aseguramos que si jugadores no es un array válido, sea un array vacío por defecto y no rompa los .map()
              
              return (
                <div key={mId} className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                 {/* Local - Solo texto en Grupos, INPUT en eliminatorias */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    {filtroFase.startsWith('GROUP') ? (
                      <span className="text-xs font-black uppercase tracking-wider">{m.home_team}</span>
                    ) : (
                      
                <div className="flex flex-col items-end gap-0.5">
                    <input
                          type="text"
                          value={m.home_team || ''}
                          onChange={(e) => {
                            const valor = e.target.value.toUpperCase();
                            setPartidos(prev => prev.map(p => p.id === mId ? { ...p, home_team: valor } : p));
                        }}
                          placeholder={t.admin_placeholder_code || "CÓDIGO (Ej: 2A)"}
                          className="bg-black/80 border border-white/10 px-2 py-1.5 rounded-xl text-xs font-black text-white w-28 text-right focus:outline-none focus:border-red-500 uppercase"
                        />

                        {m.home_team_ref && <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-wider">ref: {m.home_team_ref}</span>}
                      </div>

                    )}
                    {getFlag && <img src={getFlag(m.home_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                  </div>

                  {/* Inputs de Goles Oficiales */}
                  <div className="flex items-center gap-1.5 bg-black px-3 py-2 rounded-xl border border-white/10">
                    <input
                      type="text"
                      maxLength="2"
                      value={resultados[mId]?.h || ''}
                      onChange={(e) => handleInputChange(mId, 'h', e.target.value)}
                      placeholder="-"
                      className="w-8 text-center bg-transparent font-black text-sm text-yellow-500 focus:outline-none"
                    />
                    <span className="text-xs text-gray-600 font-bold">:</span>
                    <input
                      type="text"
                      maxLength="2"
                      value={resultados[mId]?.a || ''}
                      onChange={(e) => handleInputChange(mId, 'a', e.target.value)}
                      placeholder="-"
                      className="w-8 text-center bg-transparent font-black text-sm text-yellow-500 focus:outline-none"
                    />
                  </div>

                  {/* Visitante - Solo texto en Grupos, INPUT en eliminatorias */}
                  <div className="flex items-center gap-2 flex-1 justify-start">
                    {getFlag && <img src={getFlag(m.away_team)} alt="" className="w-5 h-3.5 object-cover rounded-sm inline-block" />}
                    {filtroFase.startsWith('GROUP') ? (
                      <span className="text-xs font-black uppercase tracking-wider">{m.away_team}</span>
                    ) : (
                      
                     <div className="flex flex-col items-start gap-0.5">
                      <input
                      type="text"
                      value={m.away_team || ''}
                      onChange={(e) => {
                      const valor = e.target.value.toUpperCase();
                      setPartidos(prev => prev.map(p => p.id === mId ? { ...p, away_team: valor } : p));
                      }}
                      placeholder={t.admin_placeholder_code_away || "CÓDIGO (Ej: 2B)"}
                      className="bg-black/80 border border-white/10 px-2 py-1.5 rounded-xl text-xs font-black text-white w-28 text-left focus:outline-none focus:border-red-500 uppercase"
                      />

                        {m.away_team_ref && <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-wider">ref: {m.away_team_ref}</span>}
                      </div>

                    )}
                  </div>

                  {/* === AQUÍ INTRODUCES EL CHECKBOX === */}
              <div className="flex items-center justify-center gap-2 py-1 bg-white/5 rounded-xl my-2 border border-white/5">
                <input
                  type="checkbox"
                  id={`finished-${m.id}`}
                  checked={resultados[m.id]?.is_finished || false}
                  onChange={(e) => setResultados(prev => ({
                    ...prev,
                    [m.id]: {
                      ...prev[m.id],
                      is_finished: e.target.checked
                    }
                  }))}
                  className="w-4 h-4 accent-yellow-500 cursor-pointer rounded bg-black border-white/20"
                />
                <label htmlFor={`finished-${m.id}`} className="text-[10px] font-black tracking-wider text-gray-300 uppercase cursor-pointer select-none">
                  {t.admin_match_finished_label || 'PARTIDO FINALIZADO 🏁'}
                </label>              
              </div>

                {/* Botón de Grabar (Internacionalizado) */}
                  <button
                    onClick={() => handleGuardarResultado(mId)}
                    disabled={cargando}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all min-w-[75px] text-center shrink-0 ${               
                    cargando 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-red-600 hover:bg-red-500 text-white active:scale-95'
                    }`}
                  >
                    {cargando ? '...' : (t.admin_btn_save || 'GRABAR')}
                  </button>
</div>
              )
            })
          )}
        </div>

        {/* --- NUEVO: SECCIÓN DE PODIO Y PREMIOS EXTRA OFICIALES (INTERNACIONALIZADO) --- */}
        <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
          <h3 className="text-sm font-black text-yellow-500 italic uppercase tracking-widest text-center flex items-center justify-center gap-2">
            🏅 {t.admin_podium_section_title || 'PODIO Y PREMIOS EXTRA OFICIALES'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* --- BLOQUE DEL PODIO --- */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">
                🏆 {t.admin_podium_title || 'PODIO FINAL'}
              </p>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  {t.podium_champion || 'Campeón del Mundo'}
                </label>
                <input
                  type="text"
                  value={extrasOficiales.champion}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, champion: e.target.value.toUpperCase() }))}
                  placeholder={t.admin_placeholder_eg_argentina || "Ej: ARGENTINA"}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  {t.podium_runner_up || 'Subcampeón (Segundo)'}
                </label>
                <input
                  type="text"
                  value={extrasOficiales.runner_up}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, runner_up: e.target.value.toUpperCase() }))}
                  placeholder={t.admin_placeholder_eg_france || "Ej: FRANCIA"}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>

          <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  {t.podium_third_place || 'Tercer Puesto'}
                </label>
                <input
                  type="text"
                  value={extrasOficiales.third_place}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, third_place: e.target.value.toUpperCase() }))}
                  placeholder={t.admin_placeholder_eg_croatia || "Ej: CROACIA"}
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">
                  {t.podium_fourth_place || 'Cuarto Puesto'}
                </label>
                <input
                  type="text"
                  value={extrasOficiales.fourth_place}
                  onChange={(e) => setExtrasOficiales(prev => ({ ...prev, fourth_place: e.target.value.toUpperCase() }))}
                  placeholder="Ej: FRANCE"
                  className="w-full bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
                />
              </div>
            </div>
{/* --- BLOQUE DE PREMIOS EXTRA (INTERNACIONALIZADO) --- */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 border-b border-white/5 pb-1">
                ✨ {t.admin_individual_awards_title || 'GALARDONES INDIVIDUALES'}
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Máximo Goleador */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">
                    {t.extra_pichichi || 'Máximo Goleador'}
                  </label>
                  <select
                    value={extrasOficiales.top_scorer || ''}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, top_scorer: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                  >
                    <option value="">-- {t.admin_placeholder_pichichi || 'Pichichi'} --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Mejor Portero (Internacionalizado) */}
                <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase">
                {t.extra_zamora || 'Mejor Portero'}
                </label>
                <select
                value={extrasOficiales.best_keeper || ''}
                onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_keeper: e.target.value }))}
                className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                >
                <option value="">-- {t.admin_placeholder_keeper || 'Guante de Oro'} --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>

                  {/* Mejor Jugador (Internacionalizado) */}
                  <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase">
                    {t.extra_mvp || 'Mejor Jugador'}
                  </label>
                  <select
                    value={extrasOficiales.best_player || ''}
                    onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_player: e.target.value }))}
                    className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                  >
                  <option value="">-- {t.admin_placeholder_mvp || 'MVP'} --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>

                {/* Mejor Joven (Internacionalizado) */}
                <div className="space-y-1">
                <label className="block text-[9px] font-bold text-gray-400 uppercase">
                {t.extra_joven || 'Mejor Joven'}
                </label>
                <select
                value={extrasOficiales.best_young || ''}
                onChange={(e) => setExtrasOficiales(prev => ({ ...prev, best_young: e.target.value }))}
                className="w-full bg-black border border-white/10 px-2 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 h-[32px]"
                >
                <option value="">-- {t.admin_placeholder_young || 'Promesa'} --</option>
                    {(jugadores || []).map((jugador, idx) => {
                      const nombreFormateado = jugador?.name && jugador?.team ? `${jugador.name.toUpperCase()} (${jugador.team.toUpperCase()})` : (jugador?.name || jugador);
                      return (
                        <option key={idx} value={nombreFormateado}>{nombreFormateado}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

          {/* Fair Play (Equipo) (Internacionalizado) */}
            <div className="space-y-1">
            <label className="block text-[9px] font-bold text-gray-400 uppercase">
            {t.extra_fairplay || 'Fair Play (Equipo)'}
            </label>
            <input
            type="text"
            value={extrasOficiales.fair_play || ''}
            onChange={(e) => setExtrasOficiales(prev => ({ ...prev, fair_play: e.target.value.toUpperCase() }))}
            placeholder={t.admin_placeholder_fairplay || "Juego Limpio"}
            className="w-full bg-black border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-red-500 uppercase"
            />
            </div>
            </div>
            </div>

            {/* Botón único para guardar todo el bloque de extras (Internacionalizado) */}
            <div className="text-center pt-2">
            
            {/* BOTÓN SNAPSHOT RANKING */}
              <button
                onClick={handleGuardarSnapshot}
                disabled={guardandoSnapshot}
                className={`w-full py-3 font-black uppercase rounded-2xl text-xs mb-4 transition-all ${
                  guardandoSnapshot
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30'
                }`}
              >
                {guardandoSnapshot ? '⏳ Guardando...' : '📸 GUARDAR SNAPSHOT DEL RANKING'}
              </button>

            <button
            onClick={handleGuardarExtras}
            disabled={guardandoExtras}
            className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
            guardandoExtras 
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
            : 'bg-yellow-500 hover:bg-yellow-400 text-black active:scale-[0.98] shadow-xl shadow-yellow-500/10'
            }`}
            >
            {guardandoExtras 
            ? (t.admin_btn_saving_extras || 'GUARDANDO CAMBIOS...') 
            : `💾 ${t.admin_btn_save_extras || 'GUARDAR PREMIOS Y PODIO'}`}
            </button>
            </div>

        </div>

      </div>
    </div>
  )
}
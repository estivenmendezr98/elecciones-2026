import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LogOut, CheckCircle, AlertCircle, Info, User } from 'lucide-react';

const VoterDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [election, setElection] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedCandidate, setVotedCandidate] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (election?.estado === 'ACTIVA' && !hasVoted) {
            const hasSeenModal = localStorage.getItem(`seenWelcome_${user.id}`);
            if (!hasSeenModal) {
                setShowWelcome(true);
                localStorage.setItem(`seenWelcome_${user.id}`, 'true');
            }
        }
    }, [election, hasVoted, user.id]);

    const loadData = async () => {
        try {
            // 1. Check Vote Status
            const statusRes = await axios.get('/api/voting/status');
            if (statusRes.data.estado === 'VOTO_REGISTRADO') {
                setHasVoted(true);
                if (statusRes.data.candidato_nombre) {
                    setVotedCandidate({
                        nombre: statusRes.data.candidato_nombre,
                        foto: statusRes.data.candidato_foto
                    });
                }
            }

            // 2. Load Election Info
            const electionRes = await axios.get('/api/election/details');
            setElection(electionRes.data);

            // 3. Load Candidates
            const candidatesRes = await axios.get('/api/election/candidates');
            setCandidates(candidatesRes.data);

        } catch (err) {
            setMessage({
                text: err.response?.data?.message || 'Error al cargar información del sistema.',
                type: 'error'
            });
        }
    };

    const handleVote = async () => {
        if (!selectedCandidate) return;
        try {
            const res = await axios.post('/api/voting', { id_candidato: selectedCandidate.id });
            setMessage({ text: 'Su voto ha sido registrado de manera exitosa y segura.', type: 'success' });

            // Re-cargar datos para obtener la info del candidato recién votado
            loadData();

            setShowConfirm(false);
        } catch (err) {
            setMessage({
                text: err.response?.data?.message || 'Error al emitir el voto.',
                type: 'error'
            });
            setShowConfirm(false);
        }
    };

    const formatDateSafe = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('es-CO', { timeZone: 'UTC' });
    };

    const formatTime12h = (timeString) => {
        if (!timeString) return '';
        const [hourString, minute] = timeString.split(':');
        let hour = parseInt(hourString, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        const hourFormatted = hour.toString().padStart(2, '0');
        return `${hourFormatted}:${minute} ${ampm}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* Header */}
            <nav className="bg-primary-700 text-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <img src="/logo.png" alt="logo" className="h-10 w-auto object-contain" />
                            <h1 className="font-semibold text-lg hidden sm:block">Elecciones Directivos Docentes 2026</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm bg-primary-800 px-3 py-1 rounded-full border border-primary-600">
                                {user.nombre} {user.apellido}
                            </span>
                            <button onClick={logout} className="p-2 hover:bg-primary-600 rounded-full transition-colors" title="Cerrar Sessión">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {/* Messages */}
                {message.text && (
                    <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
                        <div>
                            <p className="font-medium">{message.type === 'success' ? 'Éxito' : 'Atención'}</p>
                            <p className="text-sm mt-1">{message.text}</p>
                        </div>
                    </div>
                )}

                {/* Election Info Card */}
                {election && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 mt-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                        <h2 className="text-xl font-bold text-slate-800">{election.nombre_eleccion}</h2>
                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2"><Info className="w-4 h-4 text-primary-500" /> <b>Fecha:</b> {formatDateSafe(election.fecha)}</div>
                            <div className="flex items-center gap-2"><Info className="w-4 h-4 text-primary-500" /> <b>Horario:</b> {formatTime12h(election.hora_inicio)} a {formatTime12h(election.hora_fin)}</div>
                            <div className="flex items-center gap-2"><Info className="w-4 h-4 text-primary-500" /> <b>Estado:</b> <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${election.estado === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>{election.estado}</span></div>
                        </div>

                        {hasVoted && (
                            <div className="mt-6">
                                <div className="bg-green-500 text-white p-4 rounded-t-lg text-center font-medium shadow-md uppercase tracking-wider text-sm">
                                    ¡Has completado exitosamente tu participación!
                                </div>
                                <div className="bg-white border-x border-b border-slate-200 rounded-b-lg p-8 flex flex-col items-center shadow-sm">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Tu Voto Registrado</p>

                                    <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full max-w-2xl">
                                        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-2xl flex items-center justify-center border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
                                            {votedCandidate?.foto ? (
                                                <img src={`http://localhost:5000${votedCandidate.foto}`} alt="Candidato" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-16 h-16 text-slate-200" />
                                            )}
                                        </div>

                                        <div className="text-center md:text-left flex-1">
                                            <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">Voto Confirmado</div>
                                            <h3 className="font-black text-2xl text-slate-800 leading-tight">
                                                {votedCandidate?.nombre || 'Candidato Seleccionado'}
                                            </h3>
                                            <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Votante:</span>
                                                    <span className="font-bold text-slate-700">{user.nombre} {user.apellido}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500">Cédula:</span>
                                                    <span className="font-mono font-bold text-slate-700">{user.cedula}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center">
                                        <p className="text-slate-400 text-xs italic">Gracias por fortalecer la democracia en este proceso electoral.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Candidates Section */}
                {!hasVoted && election?.estado === 'ACTIVA' && (
                    <>
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Tarjetón Electoral</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {candidates.map(candidate => (
                                <div
                                    key={candidate.id}
                                    onClick={() => setSelectedCandidate(candidate)}
                                    className={`premium-card bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedCandidate?.id === candidate.id
                                        ? 'border-primary-500 ring-4 ring-primary-100 shadow-xl scale-[1.02]'
                                        : 'border-slate-200 hover:border-primary-300'
                                        }`}
                                >
                                    <div className="h-2 bg-gradient-to-r from-primary-400 to-primary-600 w-full"></div>
                                    <div className="p-6 text-center">
                                        <div className="w-40 h-40 mx-auto bg-slate-100 rounded-full border-4 border-white shadow-sm flex items-center justify-center mb-4 overflow-hidden">
                                            {candidate.foto ? (
                                                <img src={`http://localhost:5000${candidate.foto}`} alt={candidate.nombre} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-16 h-16 text-slate-400" />
                                            )}
                                        </div>
                                        <h4 className="font-bold text-lg text-slate-800">{candidate.nombre}</h4>
                                        <p className="text-xs font-medium text-primary-600 mt-1 uppercase tracking-wider">{candidate.institucion}</p>
                                        <p className="text-sm text-slate-500 mt-1">{candidate.municipio}</p>
                                        <p className="text-sm text-slate-600 mt-4 line-clamp-3 italic">"{candidate.descripcion}"</p>
                                    </div>
                                    <div className={`p-4 border-t flex items-center justify-center gap-2 font-medium ${selectedCandidate?.id === candidate.id ? 'bg-primary-50 text-primary-700' : 'bg-slate-50 text-slate-500'
                                        }`}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedCandidate?.id === candidate.id ? 'border-primary-500' : 'border-slate-300'
                                            }`}>
                                            {selectedCandidate?.id === candidate.id && <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>}
                                        </div>
                                        Seleccionar
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedCandidate && (
                            <div className="mt-10 flex justify-center sticky bottom-6 z-10">
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="bg-primary-600 hover:bg-primary-700 text-white text-lg font-bold py-4 px-12 rounded-full shadow-2xl hover:shadow-primary-500/50 transition-all hover:scale-105"
                                >
                                    Emitir Voto por {selectedCandidate.nombre.split(' ')[0]}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {!hasVoted && election?.estado !== 'ACTIVA' && election && (
                    <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">Elección no disponible</h3>
                        <p className="text-slate-500 mt-2">La votación actual se encuentra en estado: <b>{election.estado}</b>.</p>
                        <p className="text-slate-500 mt-1">El horario habilitado es de {formatTime12h(election.hora_inicio)} a {formatTime12h(election.hora_fin)} del {formatDateSafe(election.fecha)}.</p>
                    </div>
                )}

            </main>

            {/* Welcome Modal */}
            {showWelcome && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl animate-fade-in-up border-t-8 border-primary-500">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Info className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Proceso de votación habilitado</h3>
                        </div>
                        <div className="text-slate-600 mb-8 space-y-4 text-center">
                            <p>
                                Se informa que el proceso de votación para la elección 2026 de representantes ante el Comité Regional de Prestaciones Sociales del Magisterio se encuentra habilitado.
                            </p>
                            <p>
                                Su participación es fundamental para garantizar un proceso democrático y transparente.
                            </p>
                            <p className="font-medium text-slate-800 mt-6 pt-4 border-t border-slate-100">
                                Para continuar con el proceso, haga clic en el botón "Ir a votar".
                            </p>
                        </div>
                        <button
                            onClick={() => setShowWelcome(false)}
                            className="w-full px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30 text-lg"
                        >
                            Ir a votar
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Voto</h3>
                        <p className="text-slate-600 mb-4">
                            Usted está a punto de emitir su voto por el candidato:
                        </p>

                        <div className="bg-primary-50/60 rounded-xl p-5 mb-6 border border-primary-100 flex flex-col items-center text-center">
                            <div className="w-24 h-24 mb-3 rounded-full border-4 border-white shadow-sm flex items-center justify-center overflow-hidden bg-white">
                                {selectedCandidate.foto ? (
                                    <img src={`http://localhost:5000${selectedCandidate.foto}`} alt={selectedCandidate.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-slate-400" />
                                )}
                            </div>
                            <h4 className="font-bold text-lg text-primary-800 leading-tight mb-1">{selectedCandidate.nombre}</h4>
                            <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide">{selectedCandidate.institucion}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{selectedCandidate.municipio}</p>

                            {selectedCandidate.descripcion && (
                                <div className="mt-4 pt-4 border-t border-primary-100 w-full">
                                    <p className="text-sm text-slate-600 italic line-clamp-3">
                                        "{selectedCandidate.descripcion}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="bg-amber-50 rounded-lg p-3 mb-6 flex items-start gap-3 border border-amber-200">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-amber-800">
                                <b>Advertencia:</b> Esta acción es irreversible y solo puede emitir un voto en esta elección.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVote}
                                className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                            >
                                Sí, Emitir Voto
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default VoterDashboard;

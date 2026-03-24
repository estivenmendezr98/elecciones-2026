import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
    LogOut, BarChart3, Users, Play, Square, RefreshCcw,
    CheckCircle, AlertCircle, PlusCircle, UserPlus, Trash2, Edit2, X
} from 'lucide-react';

const TABS = {
    results: 'Resultados',
    candidates: 'Candidatos',
    voters: 'Votantes',
};

const AdminDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('results');
    const [election, setElection] = useState(null);
    const [results, setResults] = useState([]);
    const [voters, setVoters] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [totalVotes, setTotalVotes] = useState(0);
    const [totalCensus, setTotalCensus] = useState(0);

    // Form states
    const [candidateForm, setCandidateForm] = useState({ nombre: '', institucion: '', municipio_id: '', descripcion: '', foto: null });
    const [editingCandidateId, setEditingCandidateId] = useState(null);
    const [voterForm, setVoterForm] = useState({ cedula: '', nombre: '', apellido: '', municipio_id: '', institucion: '' });
    const [formMsg, setFormMsg] = useState({ text: '', type: '' });
    const [confirmDelete, setConfirmDelete] = useState({ type: '', id: null }); // inline confirm state

    useEffect(() => {
        loadElection();
        loadMunicipios();
    }, []);

    useEffect(() => {
        loadTabData();

        // Auto-refresco cada 15 segundos para resultados y votantes
        const interval = setInterval(() => {
            if (activeTab === 'results' || activeTab === 'voters') {
                loadTabData();
            }
        }, 15000);

        return () => clearInterval(interval);
    }, [activeTab]);

    const loadElection = async () => {
        try {
            const res = await axios.get('/api/election/details');
            setElection(res.data);
        } catch (e) { console.error(e); }
    };

    const loadMunicipios = async () => {
        try {
            const res = await axios.get('/api/admin/municipios');
            setMunicipios(res.data);
        } catch (e) { console.error(e); }
    };

    const loadTabData = async () => {
        try {
            if (activeTab === 'results') {
                const res = await axios.get('/api/admin/results');
                setResults(res.data.resultados);
                setTotalVotes(res.data.total_votos_emitidos);
                setTotalCensus(res.data.total_censo);
            } else if (activeTab === 'voters') {
                const res = await axios.get('/api/admin/voters');
                setVoters(res.data);
            } else if (activeTab === 'candidates') {
                const res = await axios.get('/api/election/candidates');
                setCandidates(res.data);
            }
        } catch (err) { console.error(err); }
    };

    const changeStatus = async (estado) => {
        try {
            await axios.put('/api/admin/election/status', { estado });
            loadElection();
        } catch (err) { console.error(err); }
    };

    const handleAddCandidate = async (e) => {
        e.preventDefault();
        setFormMsg({ text: '', type: '' });

        const formData = new FormData();
        formData.append('nombre', candidateForm.nombre);
        formData.append('institucion', candidateForm.institucion);
        formData.append('municipio_id', candidateForm.municipio_id);
        formData.append('descripcion', candidateForm.descripcion);
        if (candidateForm.foto) {
            formData.append('foto', candidateForm.foto);
        }

        try {
            if (editingCandidateId) {
                await axios.put(`/api/admin/candidates/${editingCandidateId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setFormMsg({ text: 'Candidato actualizado exitosamente.', type: 'success' });
            } else {
                await axios.post('/api/admin/candidates', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setFormMsg({ text: 'Candidato agregado exitosamente.', type: 'success' });
            }

            cancelEditCandidate();
            loadTabData();
        } catch (err) {
            setFormMsg({ text: err.response?.data?.message || 'Error al guardar candidato.', type: 'error' });
        }
    };

    const handleEditClick = (candidate) => {
        setEditingCandidateId(candidate.id);
        // Find full option object value to ensure matching
        const municipioToEdit = municipios.find(m => m.nombre === candidate.municipio)?.id || '';

        setCandidateForm({
            nombre: candidate.nombre || '',
            institucion: candidate.institucion || '',
            municipio_id: municipioToEdit,
            descripcion: candidate.descripcion || '',
            foto: null // We don't load the file back into input type="file"
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEditCandidate = () => {
        setEditingCandidateId(null);
        setCandidateForm({ nombre: '', institucion: '', municipio_id: '', descripcion: '', foto: null });
        const fileInput = document.getElementById('fotoCandidatoInput');
        if (fileInput) fileInput.value = '';
    };

    const handleDeleteCandidate = async (id) => {
        try {
            await axios.delete(`/api/admin/candidates/${id}`);
            setConfirmDelete({ type: '', id: null });
            setFormMsg({ text: 'Candidato eliminado correctamente.', type: 'success' });
            loadTabData();
        } catch (err) {
            setConfirmDelete({ type: '', id: null });
            setFormMsg({ text: err.response?.data?.message || 'Error eliminando candidato.', type: 'error' });
        }
    };

    const handleAddVoter = async (e) => {
        e.preventDefault();
        setFormMsg({ text: '', type: '' });
        try {
            await axios.post('/api/admin/voters', voterForm);
            setFormMsg({ text: 'Directivo docente registrado exitosamente.', type: 'success' });
            setVoterForm({ cedula: '', nombre: '', apellido: '', municipio_id: '', institucion: '' });
            loadTabData();
        } catch (err) {
            setFormMsg({ text: err.response?.data?.message || 'Error al registrar directivo.', type: 'error' });
        }
    };

    const handleDeleteVoter = async (id) => {
        try {
            await axios.delete(`/api/admin/voters/${id}`);
            setConfirmDelete({ type: '', id: null });
            setFormMsg({ text: 'Directivo eliminado del censo.', type: 'success' });
            loadTabData();
        } catch (err) {
            setConfirmDelete({ type: '', id: null });
            setFormMsg({ text: err.response?.data?.message || 'Error eliminando directivo.', type: 'error' });
        }
    };

    const tabIcons = { results: <BarChart3 className="w-5 h-5" />, candidates: <Users className="w-5 h-5" />, voters: <UserPlus className="w-5 h-5" /> };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-slate-300 md:min-h-screen flex flex-col">
                <div className="p-6 border-b border-slate-800 text-center flex flex-col items-center">
                    <div className="bg-white px-3 py-2 rounded-xl mb-4 shadow-sm inline-block w-full">
                        <img src="/logo.png" alt="Logo SED Cauca" className="h-10 md:h-12 object-contain mx-auto" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-wide">Administración</h2>
                    <p className="text-xs text-slate-400 mt-1">Elecciones 2026</p>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {Object.entries(TABS).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => { setActiveTab(key); setFormMsg({ text: '', type: '' }); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === key ? 'bg-primary-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                        >
                            {tabIcons[key]} {label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="mb-4 text-sm px-2">Hola, <b className="text-white">{user?.nombre}</b></div>
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors">
                        <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{TABS[activeTab]}</h1>
                        <p className="text-slate-500 mt-1">Gestión y monitoreo del proceso electoral</p>
                    </div>
                    {election && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Estado</p>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${election.estado === 'ACTIVA' ? 'bg-green-500 animate-pulse' : election.estado === 'CERRADA' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                                    <span className="font-bold text-slate-700">{election.estado}</span>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-slate-200"></div>
                            <div className="flex gap-2">
                                {election.estado === 'PROGRAMADA' && (
                                    <button onClick={() => changeStatus('ACTIVA')} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium px-3" title="Iniciar Votación">
                                        <Play className="w-4 h-4" /> Iniciar
                                    </button>
                                )}
                                {election.estado === 'ACTIVA' && (
                                    <button onClick={() => changeStatus('CERRADA')} className="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium px-3" title="Cerrar Votación">
                                        <Square className="w-4 h-4" /> Cerrar
                                    </button>
                                )}
                                {election.estado === 'CERRADA' && (
                                    <button onClick={() => changeStatus('PROGRAMADA')} className="bg-blue-100 text-blue-700 hover:bg-blue-200 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium px-3">
                                        <RefreshCcw className="w-4 h-4" /> Reabrir
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Messages */}
                {formMsg.text && (
                    <div className={`p-3 rounded-lg mb-6 flex items-center gap-2 text-sm ${formMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {formMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {formMsg.text}
                    </div>
                )}

                {/* == Results Tab == */}
                {activeTab === 'results' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Votos Emitidos</p>
                                <div className="text-4xl font-extrabold text-primary-600">{totalVotes}</div>
                                <p className="text-xs text-slate-400 mt-2">de {totalCensus} habilitados</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Abstención / Faltantes</p>
                                <div className="text-4xl font-extrabold text-amber-500">{totalCensus - totalVotes}</div>
                                <p className="text-xs text-slate-400 mt-2">{totalCensus > 0 ? (((totalCensus - totalVotes) / totalCensus) * 100).toFixed(1) : 0}% del censo</p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Actualización</p>
                                    <div className="text-sm font-semibold text-slate-700">Automática cada 15s</div>
                                </div>
                                <button onClick={loadTabData} className="p-3 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors hover:rotate-180 duration-300">
                                    <RefreshCcw className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Resultados por Candidato</h3></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                                        <tr>
                                            <th className="py-4 px-6 font-medium">#</th>
                                            <th className="py-4 px-6 font-medium">Candidato</th>
                                            <th className="py-4 px-6 font-medium">Institución</th>
                                            <th className="py-4 px-6 font-medium">Votos</th>
                                            <th className="py-4 px-6 font-medium">Porcentaje</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {results.map((r, i) => {
                                            const percent = totalVotes > 0 ? ((r.total_votos / totalVotes) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={r.id} className="hover:bg-slate-50/50">
                                                    <td className="py-4 px-6 text-slate-400 font-medium">{i + 1}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            {r.foto ? (
                                                                <img src={`http://localhost:5000${r.foto}`} alt={r.nombre} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                                    <Users className="w-5 h-5" />
                                                                </div>
                                                            )}
                                                            <span className="font-bold text-slate-800">{r.nombre}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500 text-sm whitespace-nowrap">{r.institucion} · {r.municipio}</td>
                                                    <td className="py-4 px-6 font-semibold text-primary-600 text-lg">{r.total_votos}</td>
                                                    <td className="py-4 px-6 min-w-[180px]">
                                                        <div className="flex items-center gap-3">
                                                            <span className="w-12 text-sm font-medium text-slate-700">{percent}%</span>
                                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${percent}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {results.length === 0 && (
                                            <tr><td colSpan="5" className="py-10 text-center text-slate-400">No hay candidatos o resultados aún.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* == Candidates Tab == */}
                {activeTab === 'candidates' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        {editingCandidateId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <PlusCircle className="w-5 h-5 text-primary-500" />}
                                        {editingCandidateId ? 'Editar Candidato' : 'Nuevo Candidato'}
                                    </h3>
                                    {editingCandidateId && (
                                        <button type="button" onClick={cancelEditCandidate} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors" title="Cancelar edición">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <form onSubmit={handleAddCandidate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Nombre Completo</label>
                                        <input type="text" required value={candidateForm.nombre} onChange={e => setCandidateForm({ ...candidateForm, nombre: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none" placeholder="Nombre y apellidos" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Institución</label>
                                        <input type="text" required value={candidateForm.institucion} onChange={e => setCandidateForm({ ...candidateForm, institucion: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none" placeholder="Nombre de IE" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Municipio</label>
                                        <select required value={candidateForm.municipio_id} onChange={e => setCandidateForm({ ...candidateForm, municipio_id: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none bg-white">
                                            <option value="">Seleccione...</option>
                                            {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Propuesta / Descripción</label>
                                        <textarea value={candidateForm.descripcion} onChange={e => setCandidateForm({ ...candidateForm, descripcion: e.target.value })}
                                            rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none resize-none" placeholder="Propuesta de candidatura..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Foto del Candidato (Opcional)</label>
                                        <input type="file" id="fotoCandidatoInput" accept="image/*" onChange={e => setCandidateForm({ ...candidateForm, foto: e.target.files[0] })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" />
                                    </div>
                                    <button type="submit" className={`w-full py-2.5 rounded-lg font-medium transition-colors text-white ${editingCandidateId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}>
                                        {editingCandidateId ? 'Actualizar Candidato' : 'Agregar Candidato'}
                                    </button>
                                </form>
                            </div>
                        </div>
                        {/* List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Lista de Candidatos ({candidates.length})</h3>
                                    <button onClick={loadTabData} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><RefreshCcw className="w-4 h-4" /></button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {candidates.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                {c.foto ? (
                                                    <img src={`http://localhost:5000${c.foto}`} alt={c.nombre} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 border-4 border-white shadow-md">
                                                        <Users className="w-10 h-10" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-lg font-bold text-slate-800 leading-tight">{c.nombre}</p>
                                                    <p className="text-sm text-slate-500 mt-1">{c.institucion} · {c.municipio}</p>
                                                </div>
                                            </div>
                                            {confirmDelete.type === 'candidate' && confirmDelete.id === c.id ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">¿Eliminar?</span>
                                                    <button onClick={() => handleDeleteCandidate(c.id)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg font-medium transition-colors">
                                                        Sí
                                                    </button>
                                                    <button onClick={() => setConfirmDelete({ type: '', id: null })} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg transition-colors">
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEditClick(c)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar candidato">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setConfirmDelete({ type: 'candidate', id: c.id })} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar candidato">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {candidates.length === 0 && (
                                        <div className="py-10 text-center text-slate-400">No hay candidatos registrados.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* == Voters Tab == */}
                {activeTab === 'voters' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary-500" /> Registrar Directivo</h3>
                                <form onSubmit={handleAddVoter} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Cédula</label>
                                        <input type="text" required value={voterForm.cedula} onChange={e => setVoterForm({ ...voterForm, cedula: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none" placeholder="Número de cédula" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                                        <input type="text" required value={voterForm.nombre} onChange={e => setVoterForm({ ...voterForm, nombre: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none" placeholder="Primer nombre" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Apellido</label>
                                        <input type="text" required value={voterForm.apellido} onChange={e => setVoterForm({ ...voterForm, apellido: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none" placeholder="Apellidos" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Municipio</label>
                                        <select required value={voterForm.municipio_id} onChange={e => setVoterForm({ ...voterForm, municipio_id: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none bg-white">
                                            <option value="">Seleccione...</option>
                                            {municipios.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Institución</label>
                                        <input type="text" required value={voterForm.institucion} onChange={e => setVoterForm({ ...voterForm, institucion: e.target.value })}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none" placeholder="Nombre de IE" />
                                    </div>
                                    <p className="text-xs text-slate-400">La contraseña inicial será la cédula del directivo.</p>
                                    <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                                        Registrar Directivo
                                    </button>
                                </form>
                            </div>
                        </div>
                        {/* Table */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">Censo Electoral ({voters.length} directivos)</h3>
                                    <button onClick={loadTabData} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><RefreshCcw className="w-4 h-4" /></button>
                                </div>
                                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs sticky top-0">
                                            <tr>
                                                <th className="py-3 px-4 font-medium">Cédula</th>
                                                <th className="py-3 px-4 font-medium">Directivo</th>
                                                <th className="py-3 px-4 font-medium">Institución</th>
                                                <th className="py-3 px-4 font-medium">Municipio</th>
                                                <th className="py-3 px-4 font-medium text-center">Votó</th>
                                                <th className="py-3 px-4 font-medium"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {voters.map(v => (
                                                <tr key={v.id} className="hover:bg-slate-50/60">
                                                    <td className="py-3 px-4 text-slate-500 font-mono">{v.cedula}</td>
                                                    <td className="py-3 px-4 font-medium text-slate-800">{v.nombre} {v.apellido}</td>
                                                    <td className="py-3 px-4 text-slate-600">{v.institucion}</td>
                                                    <td className="py-3 px-4 text-slate-500">{v.municipio}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        {v.estado === 'VOTO_REGISTRADO'
                                                            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                                            : <AlertCircle className="w-4 h-4 text-slate-300 mx-auto" />}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {v.estado !== 'VOTO_REGISTRADO' && (
                                                            confirmDelete.type === 'voter' && confirmDelete.id === v.id ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-xs text-slate-400">¿Eliminar?</span>
                                                                    <button
                                                                        onClick={() => handleDeleteVoter(v.id)}
                                                                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-medium"
                                                                    >
                                                                        Sí
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setConfirmDelete({ type: '', id: null })}
                                                                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded"
                                                                    >
                                                                        No
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setConfirmDelete({ type: 'voter', id: v.id })}
                                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Eliminar directivo"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {voters.length === 0 && (
                                                <tr><td colSpan="6" className="py-10 text-center text-slate-400">No hay directivos registrados.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;

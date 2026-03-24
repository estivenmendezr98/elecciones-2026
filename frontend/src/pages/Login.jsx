import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Lock, LogIn } from 'lucide-react';

const Login = () => {
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const user = await login(cedula, password);
            if (user.rol === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/voter');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error de autenticación');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
            <div className="glass max-w-md w-full p-8 rounded-2xl">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Logo SED Cauca" className="h-[70px] mx-auto mb-4 object-contain drop-shadow-sm" />
                    <h1 className="text-2xl font-bold text-slate-800">Elecciones 2026</h1>
                    <p className="text-sm text-slate-600 mt-2">
                        Directivo Docente Representante ante el Comité Regional de Prestaciones Sociales
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-200 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all"
                                placeholder="Ingrese su número de cédula"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all"
                                placeholder="Ingrese su contraseña"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <LogIn className="w-5 h-5" />
                        Ingresar al Sistema
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-500">
                    <p>Solo personal autorizado. Secretaría de Educación Departamental del Cauca.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Users } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: { id: string; name: string; role: 'admin' | 'secretario' }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const MAX_ATTEMPTS = 5;
  const BLOCK_MINUTES = 5;

  // Mock users - en producción esto vendría de una base de datos
  const users = [
    { id: '1', username: 'admin', password: 'admin123', name: 'Juan Pérez', role: 'admin' as const },
    { id: '2', username: 'secretario', password: 'sec123', name: 'María García', role: 'secretario' as const },
  ];

  // Sin backend de IP, se persiste en localStorage para bloquear al cliente actual
  useEffect(() => {
    const storedAttempts = Number(localStorage.getItem('loginAttempts') || '0');
    const storedBlockedUntil = Number(localStorage.getItem('loginBlockedUntil') || '0');
    setAttempts(isNaN(storedAttempts) ? 0 : storedAttempts);
    setBlockedUntil(isNaN(storedBlockedUntil) || storedBlockedUntil === 0 ? null : storedBlockedUntil);
  }, []);

  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;
  const remainingMs = blockedUntil ? Math.max(blockedUntil - Date.now(), 0) : 0;
  const remainingMinutes = Math.ceil(remainingMs / 60000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isBlocked) {
      setError(`Demasiados intentos. Intenta nuevamente en ${remainingMinutes} minuto(s).`);
      return;
    }

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin({
        id: user.id,
        name: user.name,
        role: user.role,
      });
      setAttempts(0);
      setBlockedUntil(null);
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('loginBlockedUntil');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('loginAttempts', String(newAttempts));

      if (newAttempts >= MAX_ATTEMPTS) {
        const blockUntilTs = Date.now() + BLOCK_MINUTES * 60 * 1000;
        setBlockedUntil(blockUntilTs);
        localStorage.setItem('loginBlockedUntil', String(blockUntilTs));
        setError(`Demasiados intentos. La página se bloquea por ${BLOCK_MINUTES} minuto(s).`);
      } else {
        const restantes = MAX_ATTEMPTS - newAttempts;
        setError(`Usuario o contraseña incorrectos. Intentos restantes: ${restantes}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Sistema de Gestión</CardTitle>
          <CardDescription>Club Deportivo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario"
                disabled={isBlocked}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                disabled={isBlocked}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isBlocked}>
              Iniciar Sesión
            </Button>

            <div className="mt-4 p-3 bg-gray-50 rounded text-sm space-y-1">
              <p className="text-gray-600">Usuarios de prueba:</p>
              <p className="text-gray-700">• Admin: admin / admin123</p>
              <p className="text-gray-700">• Secretario: secretario / sec123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

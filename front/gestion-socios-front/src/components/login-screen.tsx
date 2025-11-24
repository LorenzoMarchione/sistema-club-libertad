import { useState } from 'react';
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

  // Mock users - en producción esto vendría de una base de datos
  const users = [
    { id: '1', username: 'admin', password: 'admin123', name: 'Juan Pérez', role: 'admin' as const },
    { id: '2', username: 'secretario', password: 'sec123', name: 'María García', role: 'secretario' as const },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin({
        id: user.id,
        name: user.name,
        role: user.role,
      });
    } else {
      setError('Usuario o contraseña incorrectos');
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
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full">
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

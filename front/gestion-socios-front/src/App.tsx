import { useEffect, useState } from 'react';
import { Users, Activity, DollarSign, Settings, Bell, LogOut, Tag } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { SociosModule } from './components/socios-module';
import { DeportesModule } from './components/deportes-module';
import { PagosModule } from './components/pagos-module';
import { AdminModule } from './components/admin-module';
import { NotificacionesModule } from './components/notificaciones-module';
import { PromocionesModule } from './components/promociones-module';
import { LoginScreen } from './components/login-screen';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: 'admin' | 'secretario';
  } | null>(null);

  const handleLogin = (user: { id: string; name: string; role: 'admin' | 'secretario' }) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setCurrentUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRaw = localStorage.getItem('authUser');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user?.id && user?.name && user?.role) {
          setCurrentUser(user);
        }
      } catch {
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-gray-900">Sistema de Gestión - Club Deportivo</h1>
              <p className="text-gray-500 text-sm">
                {currentUser.name} • {currentUser.role === 'admin' ? 'Administrador' : 'Secretario'}
              </p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="socios" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="socios" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Socios</span>
            </TabsTrigger>
            <TabsTrigger value="deportes" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Deportes</span>
            </TabsTrigger>
            <TabsTrigger value="promociones" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Promociones</span>
            </TabsTrigger>
            <TabsTrigger value="pagos" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Pagos</span>
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificaciones</span>
            </TabsTrigger>
            {currentUser.role === 'admin' && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="socios">
            <SociosModule userRole={currentUser.role} />
          </TabsContent>

          <TabsContent value="deportes">
            <DeportesModule userRole={currentUser.role} />
          </TabsContent>

          <TabsContent value="promociones">
            <PromocionesModule userRole={currentUser.role} />
          </TabsContent>

          <TabsContent value="pagos">
            <PagosModule userRole={currentUser.role} />
          </TabsContent>

          <TabsContent value="notificaciones">
            <NotificacionesModule userRole={currentUser.role} />
          </TabsContent>

          {currentUser.role === 'admin' && (
            <TabsContent value="admin">
              <AdminModule />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

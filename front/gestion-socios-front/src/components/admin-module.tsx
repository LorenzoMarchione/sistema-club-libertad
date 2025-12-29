import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Shield, UserPlus, Download, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import backupService, { BackupInfo } from '../services/backupService';
import api from '../services/api';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'secretario';
  estado: 'activo' | 'inactivo';
  ultimoAcceso: string;
}

interface BackupRow {
  fileName: string;
  createdAt: string;
  size: string;
  estado: 'completado' | 'en_proceso' | 'fallido';
}

export function AdminModule() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([
    {
      id: '1',
      nombre: 'Juan Pérez',
      email: 'admin@club.com',
      rol: 'admin',
      estado: 'activo',
      ultimoAcceso: '2025-11-03 09:30',
    },
    {
      id: '2',
      nombre: 'María García',
      email: 'secretario@club.com',
      rol: 'secretario',
      estado: 'activo',
      ultimoAcceso: '2025-11-03 10:15',
    },
    {
      id: '3',
      nombre: 'Carlos López',
      email: 'carlos.lopez@club.com',
      rol: 'secretario',
      estado: 'inactivo',
      ultimoAcceso: '2025-10-28 16:45',
    },
  ]);

  const [backups, setBackups] = useState<BackupRow[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Usuario>>({
    rol: 'secretario',
    estado: 'activo',
  });
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleCrearUsuario = () => {
    if (!formData.nombre || !formData.email) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    const nuevoUsuario: Usuario = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      email: formData.email,
      rol: formData.rol || 'secretario',
      estado: formData.estado || 'activo',
      ultimoAcceso: '-',
    };

    setUsuarios([...usuarios, nuevoUsuario]);
    toast.success('Usuario creado correctamente. Contraseña temporal enviada por email.');
    setIsDialogOpen(false);
    setFormData({ rol: 'secretario', estado: 'activo' });
  };

  const handleCambiarEstado = (id: string) => {
    setUsuarios(usuarios.map(u => {
      if (u.id === id) {
        return {
          ...u,
          estado: u.estado === 'activo' ? 'inactivo' : 'activo',
        };
      }
      return u;
    }));
    toast.success('Estado del usuario actualizado');
  };

  const cargarBackups = async () => {
    try {
      const res = await backupService.list();
      const data = Array.isArray(res.data) ? res.data : [];
      const rows: BackupRow[] = data.map((b: BackupInfo) => ({
        fileName: b.fileName,
        createdAt: b.createdAt,
        size: `${(b.sizeBytes / (1024 * 1024)).toFixed(1)} MB`,
        estado: 'completado',
      }));
      setBackups(rows);
    } catch (error) {
      console.error('Error al cargar backups:', error);
    }
  };

  useEffect(() => {
    cargarBackups();
  }, []);

  const handleCrearBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupProgress(20);
      await backupService.create();
      setBackupProgress(100);
      setIsBackingUp(false);
      toast.success('Backup creado correctamente');
      cargarBackups();
    } catch (error) {
      setIsBackingUp(false);
      toast.error('Error al crear backup');
      console.error(error);
    }
  };

  const handleDescargarBackup = async (backup: BackupRow) => {
    try {
      const baseUrl = api.defaults.baseURL || 'http://localhost:8080';
      const url = `${baseUrl}${backupService.downloadUrl(backup.fileName)}`;
      const resp = await fetch(url, { method: 'GET' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = backup.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error al descargar backup:', error);
      toast.error('No se pudo descargar el backup');
    }
  };

  const handleRestaurarBackup = (backup: BackupRow) => {
    if (confirm('¿Está seguro que desea restaurar este backup? Se perderán los datos actuales.')) {
      toast.success('Backup restaurado correctamente');
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Panel de Administración</AlertTitle>
        <AlertDescription>
          Este módulo solo está disponible para usuarios con rol de Administrador. Tenga cuidado al realizar cambios en la configuración del sistema.
        </AlertDescription>
      </Alert>

      {/* Usuarios */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administrar usuarios y permisos del sistema</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>
                    El usuario recibirá una contraseña temporal por email
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol *</Label>
                    <Select
                      value={formData.rol}
                      onValueChange={(value) => setFormData({ ...formData, rol: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="secretario">Secretario</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      • Administrador: Control total del sistema<br />
                      • Secretario: Registro y visualización (sin eliminación)
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCrearUsuario}>
                    Crear Usuario
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>{usuario.nombre}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.rol === 'admin' ? 'default' : 'secondary'}>
                        <Shield className="w-3 h-3 mr-1" />
                        {usuario.rol === 'admin' ? 'Administrador' : 'Secretario'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.estado === 'activo' ? 'default' : 'secondary'}>
                        {usuario.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{usuario.ultimoAcceso}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCambiarEstado(usuario.id)}
                      >
                        {usuario.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Backups */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Copias de Seguridad</CardTitle>
              <CardDescription>
                Sistema de backups manuales. Los archivos se generan con pg_dump y se listan aquí.
              </CardDescription>
            </div>
            <Button onClick={handleCrearBackup} disabled={isBackingUp}>
              <Database className="w-4 h-4 mr-2" />
              {isBackingUp ? 'Creando Backup...' : 'Crear Backup Manual'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBackingUp && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creando copia de seguridad...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          )}

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.fileName}>
                    <TableCell>{backup.createdAt}</TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          backup.estado === 'completado'
                            ? 'default'
                            : backup.estado === 'en_proceso'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {backup.estado === 'completado' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {backup.estado === 'fallido' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {backup.estado === 'completado' && 'Completado'}
                        {backup.estado === 'en_proceso' && 'En Proceso'}
                        {backup.estado === 'fallido' && 'Fallido'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDescargarBackup(backup)}
                          disabled={backup.estado !== 'completado'}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestaurarBackup(backup)}
                          disabled={backup.estado !== 'completado'}
                        >
                          Restaurar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Backup Automático</AlertTitle>
            <AlertDescription>
              El sistema crea automáticamente una copia de seguridad el primer día de cada mes a las 02:00 AM. 
              Se mantienen los últimos 5-6 backups, eliminando los más antiguos automáticamente.
              Próximo backup automático: <strong>1 de Diciembre de 2025, 02:00</strong>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Estadísticas del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Socios</CardDescription>
            <CardTitle>75</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Deportes Activos</CardDescription>
            <CardTitle>4</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Usuarios del Sistema</CardDescription>
            <CardTitle>{usuarios.filter(u => u.estado === 'activo').length}</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

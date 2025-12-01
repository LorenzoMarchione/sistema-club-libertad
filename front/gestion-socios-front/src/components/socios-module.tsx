import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Edit, Trash2, Search, UserPlus, History } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Socio {
  id: string;
  apellido: string;
  nombre: string;
  dni: string;
  direccion: string;
  telefono: string;
  correo: string;
  categoria: 'socio' | 'jugador';
  edad: number;
  responsablePago?: string;
  deportes: string[];
  estado: 'activo' | 'inactivo';
  fechaRegistro: string; // formato ISO
}

interface HistorialRegistro {
  id: string;
  nombre: string;
  dni: string;
  fechaRegistro: string; // formato ISO
}

interface SociosModuleProps {
  userRole: 'admin' | 'secretario';
}

export function SociosModule({ userRole }: SociosModuleProps) {
  // Función para formatear fecha en formato dd/mm/yyyy
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [socios, setSocios] = useState<Socio[]>([
    {
      id: '1',
      apellido: 'González',
      nombre: 'Carlos',
      dni: '12345678',
      direccion: 'Av. Libertador 1234',
      telefono: '11-2345-6789',
      correo: 'carlos.gonzalez@email.com',
      categoria: 'socio',
      edad: 45,
      deportes: ['Fútbol', 'Tenis'],
      estado: 'activo',
      fechaRegistro: '2024-01-15T00:00:00',
    },
    {
      id: '2',
      apellido: 'González',
      nombre: 'Lucas',
      dni: '98765432',
      direccion: 'Av. Libertador 1234',
      telefono: '11-2345-6789',
      correo: 'lucas.gonzalez@email.com',
      categoria: 'jugador',
      edad: 12,
      responsablePago: 'Carlos González (DNI: 12345678)',
      deportes: ['Fútbol'],
      estado: 'activo',
      fechaRegistro: '2024-02-10T00:00:00',
    },
    {
      id: '3',
      apellido: 'Martínez',
      nombre: 'Ana',
      dni: '23456789',
      direccion: 'Calle San Martín 567',
      telefono: '11-3456-7890',
      correo: 'ana.martinez@email.com',
      categoria: 'jugador',
      edad: 28,
      deportes: ['Voley', 'Natación'],
      estado: 'activo',
      fechaRegistro: '2024-03-05T00:00:00',
    },
  ]);

  const [historialRegistros, setHistorialRegistros] = useState<HistorialRegistro[]>([
    {
      id: '1',
      nombre: 'Carlos González',
      dni: '12345678',
      fechaRegistro: '2024-01-15T00:00:00',
    },
    {
      id: '2',
      nombre: 'Lucas González',
      dni: '98765432',
      fechaRegistro: '2024-02-10T00:00:00',
    },
    {
      id: '3',
      nombre: 'Ana Martínez',
      dni: '23456789',
      fechaRegistro: '2024-03-05T00:00:00',
    },
    {
      id: '4',
      nombre: 'Pedro Rodríguez',
      dni: '34567890',
      fechaRegistro: '2024-04-20T00:00:00',
    },
    {
      id: '5',
      nombre: 'María Fernández',
      dni: '45678901',
      fechaRegistro: '2024-05-12T00:00:00',
    },
  ]);

  const deportesDisponibles = ['Fútbol', 'Tenis', 'Voley', 'Natación'];

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterDeporte, setFilterDeporte] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [formData, setFormData] = useState<Partial<Socio>>({
    categoria: 'socio',
    estado: 'activo',
    deportes: [],
  });

  // Búsqueda en historial
  const [historialSearchTerm, setHistorialSearchTerm] = useState('');

  const filteredSocios = socios.filter(socio => {
    const matchesSearch = 
      socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.dni.includes(searchTerm);
    
    const matchesCategoria = filterCategoria === 'all' || socio.categoria === filterCategoria;
    
    const matchesDeporte = filterDeporte === 'all' || socio.deportes.includes(filterDeporte);
    
    return matchesSearch && matchesCategoria && matchesDeporte;
  });

  const filteredHistorial = historialRegistros.filter(registro => {
    return (
      registro.nombre.toLowerCase().includes(historialSearchTerm.toLowerCase()) ||
      registro.dni.includes(historialSearchTerm)
    );
  });

  const handleOpenDialog = (socio?: Socio) => {
    if (socio) {
      setEditingSocio(socio);
      setFormData(socio);
    } else {
      setEditingSocio(null);
      setFormData({
        categoria: 'socio',
        estado: 'activo',
        deportes: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingSocio) {
      setSocios(socios.map(s => s.id === editingSocio.id ? { ...formData as Socio, id: editingSocio.id } : s));
      toast.success('Socio actualizado correctamente');
    } else {
      const fechaRegistroNueva = new Date().toISOString();
      const newSocio = {
        ...formData as Socio,
        id: Date.now().toString(),
        fechaRegistro: fechaRegistroNueva,
      };
      setSocios([...socios, newSocio]);
      
      // Agregar al historial de registros
      const nuevoRegistroHistorial: HistorialRegistro = {
        id: Date.now().toString(),
        nombre: `${formData.nombre} ${formData.apellido}`,
        dni: formData.dni!,
        fechaRegistro: fechaRegistroNueva,
      };
      setHistorialRegistros([...historialRegistros, nuevoRegistroHistorial]);
      
      toast.success('Socio registrado correctamente');
    }
    setIsDialogOpen(false);
    setFormData({ categoria: 'socio', estado: 'activo', deportes: [] });
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
      toast.error('No tienes permisos para eliminar socios');
      return;
    }
    if (confirm('¿Estás seguro de que deseas eliminar este socio?')) {
      setSocios(socios.filter(s => s.id !== id));
      toast.success('Socio eliminado correctamente');
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    const labels = {
      socio: 'Socio',
      jugador: 'Jugador',
    };
    return labels[categoria as keyof typeof labels] || categoria;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Socios</CardTitle>
              <CardDescription>Alta, baja y modificación de socios del club</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Socio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSocio ? 'Editar Socio' : 'Nuevo Socio'}</DialogTitle>
                  <DialogDescription>
                    Complete los datos del socio. Los campos marcados son obligatorios.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      value={formData.apellido || ''}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI *</Label>
                    <Input
                      id="dni"
                      value={formData.dni || ''}
                      onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edad">Edad *</Label>
                    <Input
                      id="edad"
                      type="number"
                      value={formData.edad || ''}
                      onChange={(e) => setFormData({ ...formData, edad: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="direccion">Dirección *</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion || ''}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono || ''}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo Electrónico *</Label>
                    <Input
                      id="correo"
                      type="email"
                      value={formData.correo || ''}
                      onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="socio">Socio</SelectItem>
                        <SelectItem value="jugador">Jugador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="responsablePago">Responsable de Pago (Opcional)</Label>
                    <Input
                      id="responsablePago"
                      value={formData.responsablePago || ''}
                      onChange={(e) => setFormData({ ...formData, responsablePago: e.target.value })}
                      placeholder="Nombre y DNI del responsable (si aplica)"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingSocio ? 'Guardar Cambios' : 'Registrar Socio'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="socios" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="socios">
                <UserPlus className="w-4 h-4 mr-2" />
                Socios Activos
              </TabsTrigger>
              <TabsTrigger value="historial">
                <History className="w-4 h-4 mr-2" />
                Historial de Registros
              </TabsTrigger>
            </TabsList>

            {/* Tab de Socios */}
            <TabsContent value="socios" className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, apellido o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="socio">Socio</SelectItem>
                    <SelectItem value="jugador">Jugador</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDeporte} onValueChange={setFilterDeporte}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por deporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los deportes</SelectItem>
                    {deportesDisponibles.map((deporte) => (
                      <SelectItem key={deporte} value={deporte}>
                        {deporte}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Apellido y Nombre</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Deportes</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSocios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                          No se encontraron socios
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSocios.map((socio) => (
                        <TableRow key={socio.id}>
                          <TableCell>
                            <div>
                              <div>{socio.apellido}, {socio.nombre}</div>
                              {socio.responsablePago && (
                                <div className="text-sm text-gray-500">Paga: {socio.responsablePago}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{socio.dni}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getCategoriaLabel(socio.categoria)}</Badge>
                          </TableCell>
                          <TableCell>{socio.edad} años</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{socio.telefono}</div>
                              <div className="text-gray-500">{socio.correo}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {socio.deportes.map((deporte, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {deporte}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{formatDate(socio.fechaRegistro)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={socio.estado === 'activo' ? 'default' : 'secondary'}>
                              {socio.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(socio)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {userRole === 'admin' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(socio.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-gray-500">
                Mostrando {filteredSocios.length} de {socios.length} socios
              </div>
            </TabsContent>

            {/* Tab de Historial */}
            <TabsContent value="historial" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Este es un registro histórico de todos los socios registrados en el sistema. Este listado es de solo lectura y no puede ser modificado.
                </p>
              </div>

              {/* Búsqueda en historial */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar en historial por nombre o DNI..."
                  value={historialSearchTerm}
                  onChange={(e) => setHistorialSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tabla de Historial */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistorial.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistorial.map((registro, index) => (
                        <TableRow key={registro.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{registro.nombre}</TableCell>
                          <TableCell>{registro.dni}</TableCell>
                          <TableCell>{formatDate(registro.fechaRegistro)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="text-sm text-gray-500">
                Mostrando {filteredHistorial.length} de {historialRegistros.length} registros históricos
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

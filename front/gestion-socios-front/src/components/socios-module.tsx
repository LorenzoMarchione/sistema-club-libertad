import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Edit, Trash2, Search, UserPlus, History } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import personaService from '../services/personaService';
import deporteService from '../services/deporteService';
import registroService from '../services/registroService';
import type { Persona } from '../types/persona';
import type { Deporte } from '../types/deporte';
import type { Registro } from '../types/registro';

// Usamos directamente el tipo Persona del backend
type Socio = Persona & {
  responsablePago?: string;
  estado: 'activo' | 'inactivo';
};

interface FormSocio {
  nombre?: string;
  apellido?: string;
  dni?: string;
  fechaNacimiento?: string;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  categoria: 'SOCIO' | 'JUGADOR' | 'SOCIOYJUGADOR';
  estado: 'activo' | 'inactivo';
}

interface SociosModuleProps {
  userRole: 'admin' | 'secretario';
}

// Calcula la edad a partir de la fecha de nacimiento
const calcularEdad = (fechaNacimiento: string | null): number => {
  if (!fechaNacimiento) return 0;
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
};

export function SociosModule({ userRole }: SociosModuleProps) {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historialRegistros, setHistorialRegistros] = useState<Registro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterDeporte, setFilterDeporte] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [formData, setFormData] = useState<FormSocio>({
    categoria: 'SOCIO',
    estado: 'activo',
  });
  
  const [historialSearchTerm, setHistorialSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('socios');

  // Función para cargar registros históricos
  const cargarRegistros = async () => {
    try {
      const registrosResponse = await registroService.getAll();
      setHistorialRegistros(Array.isArray(registrosResponse.data) ? registrosResponse.data : []);
    } catch (err) {
      console.error('Error al cargar registros:', err);
      toast.error('No se pudieron cargar los registros históricos');
    }
  };

  // Manejar cambio de tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'historial') {
      cargarRegistros();
    }
  };

  // Función para obtener nombres de deportes a partir de sus IDs
  const getDeportesNombres = (deportesIds?: number[]): string[] => {
    if (!deportesIds || deportesIds.length === 0) return [];
    return deportesIds
      .map(id => deportes.find(d => d.id === id)?.nombre)
      .filter((nombre): nombre is string => nombre !== undefined);
  };
  
  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Carga limpia de socios desde el backend
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar deportes
        const deportesResponse = await deporteService.getAll();
        setDeportes(Array.isArray(deportesResponse.data) ? deportesResponse.data : []);
        
        // Cargar personas/socios
        const response = await personaService.getAll();
        const personas = response.data;

        // Transformación mínima para ajustar al frontend
        const sociosFormateados: Socio[] = personas.map((persona: Persona) => ({
          ...persona,
          responsablePago: persona.socioResponsable 
            ? `${persona.socioResponsable.nombre} ${persona.socioResponsable.apellido} (DNI: ${persona.socioResponsable.dni})`
            : undefined,
          estado: persona.estado, // Ya está en el formato correcto
        }));

        setSocios(sociosFormateados);
        
        // Cargar registros históricos
        const registrosResponse = await registroService.getAll();
        setHistorialRegistros(Array.isArray(registrosResponse.data) ? registrosResponse.data : []);
        
        setError(null);
      } catch (err) {
        console.error('Error al cargar socios:', err);
        setError('No se pudieron cargar los socios');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, []);

  // Filtros
  const filteredSocios = socios.filter(socio => {
    const matchesSearch = 
      socio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      socio.dni.includes(searchTerm);
    
    const matchesCategoria = filterCategoria === 'all' || 
      (filterCategoria === 'socio' && socio.categoria === 'SOCIO') ||
      (filterCategoria === 'jugador' && socio.categoria === 'JUGADOR') ||
      (filterCategoria === 'socio y jugador' && socio.categoria === 'SOCIOYJUGADOR');
    
    const deportesNombres = getDeportesNombres(socio.deportesIds);
    const matchesDeporte = filterDeporte === 'all' || deportesNombres.includes(filterDeporte);
    
    return matchesSearch && matchesCategoria && matchesDeporte;
  });

  const filteredHistorial = historialRegistros.filter(registro => {
    const nombreCompleto = `${registro.apellido} ${registro.nombre}`.toLowerCase();
    return (
      nombreCompleto.includes(historialSearchTerm.toLowerCase()) ||
      registro.dni.includes(historialSearchTerm)
    );
  });

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (socio?: Socio) => {
    if (socio) {
      setEditingSocio(socio);
      setFormData({
        nombre: socio.nombre,
        apellido: socio.apellido,
        dni: socio.dni,
        fechaNacimiento: socio.fechaNacimiento,
        direccion: socio.direccion,
        telefono: socio.telefono,
        correo: socio.correo,
        categoria: socio.categoria,
        estado: socio.estado,
      });
    } else {
      setEditingSocio(null);
      setFormData({
        categoria: 'SOCIO',
        estado: 'activo',
      });
    }
    setIsDialogOpen(true);
  };

  // Guardar socio (crear o actualizar)
  const handleSave = async () => {
    try {
      const socioData = {
        nombre: formData.nombre || '',
        apellido: formData.apellido || '',
        dni: formData.dni || '',
        fechaNacimiento: formData.fechaNacimiento || '',
        direccion: formData.direccion || null,
        telefono: formData.telefono || null,
        correo: formData.correo || null,
        categoria: formData.categoria,
        estado: formData.estado,
        edad: formData.fechaNacimiento ? calcularEdad(formData.fechaNacimiento) : 0,
        deportes: [], // Por ahora vacío
      };

      if (editingSocio) {
        await personaService.update(parseInt(editingSocio.id), socioData);
        toast.success('Socio actualizado correctamente');
      } else {
        await personaService.create(socioData);
        toast.success('Socio registrado correctamente');
      }

      // Recargar la lista
      const response = await personaService.getAll();
      const personas = response.data;
      const sociosActualizados: Socio[] = personas.map((persona: Persona) => ({
        ...persona,
        responsablePago: persona.socioResponsable 
          ? `${persona.socioResponsable.nombre} ${persona.socioResponsable.apellido} (DNI: ${persona.socioResponsable.dni})`
          : undefined,
        estado: persona.estado,
          //=========================================================================
          // Asegurarse de que deportes sea un array SACAR CUANDO EL BACKEND LO TENGA
          deportes: Array.isArray(persona.deportes) ? persona.deportes : [], // <-- default
          // Asegurarse de que deportes sea un array SACAR CUANDO EL BACKEND LO TENGA
          //=========================================================================
      }));
      setSocios(sociosActualizados);

      setIsDialogOpen(false);
      setFormData({ categoria: 'SOCIO', estado: 'activo' });
    } catch (error) {
      console.error('Error al guardar socio:', error);
      toast.error(editingSocio ? 'Error al actualizar socio' : 'Error al registrar socio');
    }
  };

  // Eliminar socio
  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') {
      toast.error('No tienes permisos para eliminar socios');
      return;
    }
    
    if (confirm('¿Estás seguro de que deseas eliminar este socio?')) {
      try {
        await personaService.delete(parseInt(id));
        setSocios(socios.filter(s => s.id !== id));
        toast.success('Socio eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar socio:', error);
        toast.error('Error al eliminar socio');
      }
    }
  };

  // Etiquetas para categorías
  const getCategoriaLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'SOCIO': 'Socio',
      'JUGADOR': 'Jugador',
      'SOCIOYJUGADOR': 'Socio y Jugador',
    };
    return labels[categoria] || categoria;
  };

  const getCategoriaFrontendValue = (categoria: string): 'socio' | 'jugador' | 'socio y jugador' => {
    switch (categoria) {
      case 'SOCIO': return 'socio';
      case 'JUGADOR': return 'jugador';
      case 'SOCIOYJUGADOR': return 'socio y jugador';
      default: return 'socio';
    }
  };

  if (loading) return <div>Cargando socios...</div>;
  if (error) return <div>Error: {error}</div>;

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
                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
                    <Input
                      id="fechaNacimiento"
                      type="date"
                      value={formData.fechaNacimiento || ''}
                      onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
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
                        <SelectItem value="SOCIO">Socio</SelectItem>
                        <SelectItem value="JUGADOR">Jugador</SelectItem>
                        <SelectItem value="SOCIOYJUGADOR">Socio y Jugador</SelectItem>
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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                    <SelectItem value="socio y jugador">Socio y Jugador</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDeporte} onValueChange={setFilterDeporte}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por deporte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los deportes</SelectItem>
                    {deportes.map((deporte) => (
                      <SelectItem key={deporte.id} value={deporte.nombre}>
                        {deporte.nombre}
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
                          <TableCell>{calcularEdad(socio.fechaNacimiento)} años</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{socio.telefono}</div>
                              <div className="text-gray-500">{socio.correo}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {getDeportesNombres(socio.deportesIds).length > 0 ? (
                                getDeportesNombres(socio.deportesIds).map((deporte, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {deporte}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">Sin deportes</span>
                              )}
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
                          <TableCell>{registro.apellido}, {registro.nombre}</TableCell>
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
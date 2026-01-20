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
import promocionService from '../services/promocionService';
import type { Persona } from '../types/persona';
import type { Deporte } from '../types/deporte';
import type { Registro } from '../types/registro';
import type { Promocion } from '../types/promocion';
import { Checkbox } from './ui/checkbox';

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
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historialRegistros, setHistorialRegistros] = useState<Registro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterDeporte, setFilterDeporte] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [selectedPromociones, setSelectedPromociones] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormSocio>({
    categoria: 'SOCIO',
    estado: 'activo',
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [socioToDelete, setSocioToDelete] = useState<Socio | null>(null);
  const [observacionBaja, setObservacionBaja] = useState('');
  const [expandedRegistroId, setExpandedRegistroId] = useState<string | null>(null);
  
  const [historialSearchTerm, setHistorialSearchTerm] = useState('');
  const [historialFilter, setHistorialFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [activeTab, setActiveTab] = useState('socios');
  const [formErrors, setFormErrors] = useState<{ nombre: boolean; apellido: boolean; dni: boolean; fechaNacimiento: boolean }>({
    nombre: false,
    apellido: false,
    dni: false,
    fechaNacimiento: false,
  });
  const [fechaNacimientoParts, setFechaNacimientoParts] = useState<{ day: string; month: string; year: string }>({
    day: '',
    month: '',
    year: '',
  });

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: new Date(2000, i, 1).toLocaleString('es-ES', { month: 'long' }),
  }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 90 }, (_, i) => String(currentYear - i));

  const updateFechaNacimiento = (day: string, month: string, year: string) => {
    setFechaNacimientoParts({ day, month, year });
    if (day && month && year) {
      const composed = `${year}-${month}-${day}`;
      setFormData(prev => ({ ...prev, fechaNacimiento: composed }));
      setFormErrors(prev => ({ ...prev, fechaNacimiento: false }));
    } else {
      setFormData(prev => ({ ...prev, fechaNacimiento: '' }));
      setFormErrors(prev => ({ ...prev, fechaNacimiento: true }));
    }
  };

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
        
        // Cargar promociones
        const promocionesResponse = await promocionService.getAll();
        setPromociones(Array.isArray(promocionesResponse.data) ? promocionesResponse.data : []);
        
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

  const filteredHistorial = historialRegistros
    .filter(registro => {
      const nombreCompleto = `${registro.apellido} ${registro.nombre}`.toLowerCase();
      return (
        nombreCompleto.includes(historialSearchTerm.toLowerCase()) ||
        registro.dni.includes(historialSearchTerm)
      );
    })
    .filter(registro => {
      if (historialFilter === 'activos') {
        return !registro.fechaBaja; // activos: sin fecha de baja
      }
      if (historialFilter === 'inactivos') {
        return !!registro.fechaBaja; // dados de baja: con fecha de baja
      }
      return true; // 'todos'
    });

  // Abrir diálogo para crear/editar
  const handleOpenDialog = (socio?: Socio) => {
    if (socio) {
      setEditingSocio(socio);
      setSelectedPromociones(socio.promocionesIds || []);
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

      const fecha = socio.fechaNacimiento ? new Date(socio.fechaNacimiento) : null;
      setFechaNacimientoParts({
        day: fecha ? String(fecha.getDate()).padStart(2, '0') : '',
        month: fecha ? String(fecha.getMonth() + 1).padStart(2, '0') : '',
        year: fecha ? String(fecha.getFullYear()) : '',
      });
    } else {
      setEditingSocio(null);
      setSelectedPromociones([]);
      setFormData({
        categoria: 'SOCIO',
        estado: 'activo',
      });
      setFechaNacimientoParts({ day: '', month: '', year: '' });
    }
    setFormErrors({ nombre: false, apellido: false, dni: false, fechaNacimiento: false });
    setIsDialogOpen(true);
  };

  // Guardar socio (crear o actualizar)
  const handleSave = async () => {
    const errors = {
      nombre: !(formData.nombre && formData.nombre.trim().length > 0),
      apellido: !(formData.apellido && formData.apellido.trim().length > 0),
      dni: !(formData.dni && formData.dni.trim().length > 0),
      fechaNacimiento: !(fechaNacimientoParts.day && fechaNacimientoParts.month && fechaNacimientoParts.year),
    };

    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const socioData = {
        nombre: formData.nombre || '',
        apellido: formData.apellido || '',
        dni: formData.dni || '',
        fechaNacimiento: formData.fechaNacimiento || '',
        email: formData.correo || null,
        telefono: formData.telefono || null,
        direccion: formData.direccion || null,
        categoria: formData.categoria,
        promocionesIds: selectedPromociones,
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
  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
      toast.error('No tienes permisos para eliminar socios');
      return;
    }
    
    const socioAEliminar = socios.find(s => s.id === id);
    if (socioAEliminar) {
      setSocioToDelete(socioAEliminar);
      setObservacionBaja('');
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (socioToDelete) {
      try {
        await personaService.delete(parseInt(socioToDelete.id), observacionBaja || undefined);
        setSocios(socios.filter(s => s.id !== socioToDelete.id));
        setIsDeleteDialogOpen(false);
        setSocioToDelete(null);
        setObservacionBaja('');
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
                      onChange={(e) => {
                        setFormData({ ...formData, apellido: e.target.value });
                        if (e.target.value.trim().length > 0) setFormErrors(prev => ({ ...prev, apellido: false }));
                      }}
                      className={formErrors.apellido ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      required
                    />
                    {formErrors.apellido && (
                      <p className="text-xs text-red-600">Completa el apellido</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, nombre: e.target.value });
                        if (e.target.value.trim().length > 0) setFormErrors(prev => ({ ...prev, nombre: false }));
                      }}
                      className={formErrors.nombre ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      required
                    />
                    {formErrors.nombre && (
                      <p className="text-xs text-red-600">Completa el nombre</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI *</Label>
                    <Input
                      id="dni"
                      value={formData.dni || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, dni: e.target.value });
                        if (e.target.value.trim().length > 0) setFormErrors(prev => ({ ...prev, dni: false }));
                      }}
                      className={formErrors.dni ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      required
                    />
                    {formErrors.dni && (
                      <p className="text-xs text-red-600">Completa el DNI</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={fechaNacimientoParts.day}
                        onValueChange={(value) => updateFechaNacimiento(value, fechaNacimientoParts.month, fechaNacimientoParts.year)}
                        className={formErrors.fechaNacimiento ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        required
                      >
                        <SelectTrigger aria-label="Día">
                          <SelectValue placeholder="Día" />
                        </SelectTrigger>
                        <SelectContent>
                          {days.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={fechaNacimientoParts.month}
                        onValueChange={(value) => updateFechaNacimiento(fechaNacimientoParts.day, value, fechaNacimientoParts.year)}
                        className={formErrors.fechaNacimiento ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        required
                      >
                        <SelectTrigger aria-label="Mes">
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={fechaNacimientoParts.year}
                        onValueChange={(value) => updateFechaNacimiento(fechaNacimientoParts.day, fechaNacimientoParts.month, value)}
                        className={formErrors.fechaNacimiento ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        required
                      >
                        <SelectTrigger aria-label="Año">
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formErrors.fechaNacimiento && (
                      <p className="text-xs text-red-600">Completa día, mes y año</p>
                    )}
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
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label>Promociones</Label>
                    <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                      {promociones.filter(p => p.activo !== false).map(promo => {
                        const checked = selectedPromociones.includes(Number(promo.id));
                        return (
                          <div key={promo.id} className="flex items-start gap-3 p-3">
                            <Checkbox
                              id={`promo-${promo.id}`}
                              checked={checked}
                              onCheckedChange={(val) => {
                                if (val) {
                                  setSelectedPromociones(prev => [...prev, Number(promo.id)]);
                                } else {
                                  setSelectedPromociones(prev => prev.filter(id => id !== Number(promo.id)));
                                }
                              }}
                            />
                            <label htmlFor={`promo-${promo.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium">{promo.nombre}</div>
                              {promo.descripcion && (
                                <div className="text-sm text-gray-500">{promo.descripcion}</div>
                              )}
                            </label>
                          </div>
                        );
                      })}
                      {promociones.filter(p => p.activo !== false).length === 0 && (
                        <div className="p-3 text-sm text-gray-500">No hay promociones activas</div>
                      )}
                    </div>
                    {selectedPromociones.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {selectedPromociones.length} promoción(es) seleccionada(s)
                      </p>
                    )}
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

            {/* Dialog de Confirmación de Eliminación */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Eliminar Socio</DialogTitle>
                  <DialogDescription>
                    ¿Estás seguro de que deseas eliminar a {socioToDelete?.apellido}, {socioToDelete?.nombre}?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="observacionBaja">Observación de Baja (opcional)</Label>
                    <Input
                      id="observacionBaja"
                      placeholder="Ej: Traslado a otra ciudad, cambio de trabajo..."
                      value={observacionBaja}
                      onChange={(e) => setObservacionBaja(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleConfirmDelete}>
                      Eliminar
                    </Button>
                  </div>
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
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSocios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
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

              {/* Búsqueda y filtro en historial */}
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar en historial por nombre o DNI..."
                    value={historialSearchTerm}
                    onChange={(e) => setHistorialSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Label className="mb-1 block">Filtro</Label>
                  <Select value={historialFilter} onValueChange={(v) => setHistorialFilter(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar filtro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="activos">Activos</SelectItem>
                      <SelectItem value="inactivos">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tabla de Historial */}
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Nombre Completo</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Fecha de Registro</TableHead>
                      <TableHead>Fecha de Baja</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistorial.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          No se encontraron registros
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistorial.map((registro, index) => (
                        <TableRow key={`registro-${registro.id}`}>
                          <TableCell className="text-center">
                            {registro.fechaBaja && (
                              <button
                                onClick={() => setExpandedRegistroId(expandedRegistroId === registro.id ? null : registro.id)}
                                className="text-blue-600 hover:text-blue-800 cursor-pointer text-lg leading-none"
                              >
                                {expandedRegistroId === registro.id ? '▼' : '▶'}
                              </button>
                            )}
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{registro.apellido}, {registro.nombre}</TableCell>
                          <TableCell>{registro.dni}</TableCell>
                          <TableCell>{formatDate(registro.fechaRegistro)}</TableCell>
                          <TableCell>
                            {registro.fechaBaja ? formatDate(registro.fechaBaja) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {/* Filas expandidas con observación de baja */}
                    {filteredHistorial.map((registro) => 
                      expandedRegistroId === registro.id && registro.fechaBaja && registro.observacionBaja ? (
                        <TableRow key={`expanded-${registro.id}`} className="bg-gray-50">
                          <TableCell colSpan={6} className="py-4">
                            <div className="pl-8 border-l-2 border-blue-400">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Razón de Baja:</p>
                              <p className="text-sm text-gray-600 italic">{registro.observacionBaja}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null
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
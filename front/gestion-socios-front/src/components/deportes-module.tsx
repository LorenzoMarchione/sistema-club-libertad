import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Users as UsersIcon, DollarSign, Tag, Percent, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import deporteService from '../services/deporteService';
import personaService from '../services/personaService';
import type { Deporte } from '../types/deporte';
import type { Persona } from '../types/persona';

interface DeportesModuleProps {
  userRole: 'admin' | 'secretario';
}

export function DeportesModule({ userRole }: DeportesModuleProps) {
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssociateDialogOpen, setIsAssociateDialogOpen] = useState(false);
  const [editingDeporte, setEditingDeporte] = useState<Deporte | null>(null);
  const [formData, setFormData] = useState<Omit<Deporte, 'id'>>({ nombre: '', cuotaMensual: 0 });
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [selectedDeportes, setSelectedDeportes] = useState<number[]>([]);
  const [formErrors, setFormErrors] = useState<{ nombre: boolean; cuotaMensual: boolean }>({
    nombre: false,
    cuotaMensual: false,
  });

  // Cargar deportes desde el backend
  const loadDeportes = async () => {
    try {
      setLoading(true);
      const response = await deporteService.getAll();
      const data = response?.data;
      setDeportes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Error al cargar los deportes');
      console.error('Error loading deportes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar personas desde el backend
  const loadPersonas = async () => {
    try {
      const response = await personaService.getAll();
      const data = response?.data;
      setPersonas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading personas:', error);
    }
  };

  useEffect(() => {
    loadDeportes();
    loadPersonas();
  }, []);

  const handleOpenDialog = (deporte?: Deporte) => {
    if (deporte) {
      setEditingDeporte(deporte);
      setFormData({
        nombre: deporte.nombre,
        descripcion: deporte.descripcion ?? '',
        cuotaMensual: deporte.cuotaMensual,
      });
    } else {
      setEditingDeporte(null);
      setFormData({ nombre: '', descripcion: '', cuotaMensual: 0 });
    }
    setFormErrors({ nombre: false, cuotaMensual: false });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    const errors = {
      nombre: !(formData.nombre && formData.nombre.trim().length > 0),
      cuotaMensual: !formData.cuotaMensual || formData.cuotaMensual === 0,
    };

    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      if (editingDeporte && editingDeporte.id) {
        await deporteService.update(editingDeporte.id, formData);
        toast.success('Deporte actualizado correctamente');
      } else {
        await deporteService.create(formData);
        toast.success('Deporte registrado correctamente');
      }
      setIsDialogOpen(false);
      await loadDeportes(); // Recargar la lista
    } catch (error) {
      toast.error(editingDeporte ? 'Error al actualizar el deporte' : 'Error al crear el deporte');
    }
  };

  const handleDelete = async (id: number) => {
    if (userRole !== 'admin') {
      toast.error('No tienes permisos para eliminar deportes');
      return;
    }
    if (!confirm('¿Estás seguro de que deseas eliminar este deporte?')) return;

    try {
      await deporteService.delete(id);
      toast.success('Deporte eliminado correctamente');
      await loadDeportes();
    } catch (error) {
      toast.error('Error al eliminar el deporte');
    }
  };

  const handleOpenAssociateDialog = () => {
    setSelectedPersonaId('');
    setSelectedDeportes([]);
    setIsAssociateDialogOpen(true);
  };

  const handleToggleDeporte = (deporteId: number) => {
    setSelectedDeportes(prev =>
      prev.includes(deporteId)
        ? prev.filter(id => id !== deporteId)
        : [...prev, deporteId]
    );
  };

  const handleAssociate = async () => {
    if (!selectedPersonaId || selectedDeportes.length === 0) {
      toast.error('Selecciona una persona y al menos un deporte');
      return;
    }

    try {
      const personaIdNum = parseInt(selectedPersonaId);
      
      // Asociar cada deporte seleccionado
      for (const deporteId of selectedDeportes) {
        await personaService.asociarDeporte(personaIdNum, deporteId);
      }
      
      toast.success(`Persona asociada a ${selectedDeportes.length} deporte(s) correctamente`);
      setIsAssociateDialogOpen(false);
      await loadPersonas();
    } catch (error) {
      toast.error('Error al asociar deportes');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">Cargando deportes...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Deportes</CardDescription>
              <CardTitle>{Array.isArray(deportes) ? deportes.length : 0}</CardTitle>
            </CardHeader>
        </Card>
        <Card>
            <CardHeader className="pb-3">
              <CardDescription>Ingresos Mensuales Potenciales</CardDescription>
              <CardTitle>
                ${Array.isArray(deportes)
                  ? deportes.reduce((sum, d) => sum + d.cuotaMensual, 0).toLocaleString()
                  : (0).toLocaleString()}
              </CardTitle>
            </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Deportes y Actividades</CardTitle>
              <CardDescription>Gestión de deportes ofrecidos por el club</CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isAssociateDialogOpen} onOpenChange={setIsAssociateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handleOpenAssociateDialog}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Asociar Persona
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Asociar Persona a Deportes</DialogTitle>
                    <DialogDescription>
                      Selecciona una persona y los deportes a los que deseas inscribirla
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="persona">Persona *</Label>
                      <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una persona" />
                        </SelectTrigger>
                        <SelectContent>
                          {personas.map((persona) => (
                            <SelectItem key={persona.id} value={persona.id}>
                              {persona.nombre} {persona.apellido} - DNI: {persona.dni}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Deportes *</Label>
                      <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                        {deportes.map((deporte) => (
                          <div
                            key={deporte.id}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50"
                          >
                            <Checkbox
                              id={`deporte-${deporte.id}`}
                              checked={selectedDeportes.includes(deporte.id!)}
                              onCheckedChange={() => handleToggleDeporte(deporte.id!)}
                            />
                            <label
                              htmlFor={`deporte-${deporte.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium">{deporte.nombre}</div>
                              <div className="text-sm text-gray-500">
                                ${deporte.cuotaMensual.toLocaleString()}/mes
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      {selectedDeportes.length > 0 && (
                        <p className="text-sm text-gray-600">
                          {selectedDeportes.length} deporte(s) seleccionado(s)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAssociateDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleAssociate}>
                      Asociar Deportes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleOpenDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Deporte
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingDeporte ? 'Editar Deporte' : 'Nuevo Deporte'}</DialogTitle>
                  <DialogDescription>Complete los datos del deporte o actividad</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre del Deporte *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => {
                        setFormData({ ...formData, nombre: e.target.value });
                        if (e.target.value.trim().length > 0) setFormErrors(prev => ({ ...prev, nombre: false }));
                      }}
                      className={formErrors.nombre ? 'border-red-500 focus-visible:ring-red-500 bg-red-50' : ''}
                      required
                    />
                    {formErrors.nombre && (
                      <p className="text-xs text-red-600">Completa el nombre del deporte</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      value={formData.descripcion || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, descripcion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cuotaMensual">Cuota Mensual ($) *</Label>
                    <Input
                      id="cuotaMensual"
                      type="number"
                      value={formData.cuotaMensual === 0 ? '' : formData.cuotaMensual}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          cuotaMensual: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0,
                        });
                        if (e.target.value !== '' && parseFloat(e.target.value) > 0) {
                          setFormErrors(prev => ({ ...prev, cuotaMensual: false }));
                        }
                      }}
                      required
                      min="0"
                      step="0.01"
                      className={formErrors.cuotaMensual ? 'border-red-500 focus-visible:ring-red-500 bg-red-50' : ''}
                    />
                    {formErrors.cuotaMensual && (
                      <p className="text-xs text-red-600">La cuota mensual debe ser mayor a 0</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingDeporte ? 'Guardar Cambios' : 'Registrar Deporte'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!Array.isArray(deportes) || deportes.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No hay deportes registrados</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deporte</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cuota Mensual</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(deportes)
                    ? deportes.map((deporte) => (
                    <TableRow key={deporte.id}>
                      <TableCell className="font-medium">{deporte.nombre}</TableCell>
                      <TableCell className="max-w-xs">
                        {deporte.descripcion || '—'}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          {(deporte.cuotaMensual ?? 0).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(deporte)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {userRole === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deporte.id && handleDelete(deporte.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    ))
                    : null}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
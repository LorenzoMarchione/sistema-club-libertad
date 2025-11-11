import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Users as UsersIcon, DollarSign, Tag, Percent } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';

interface Deporte {
  id: string;
  nombre: string;
  descripcion: string;
  cuotaMensual: number;
  diasHorarios: string;
  inscriptos: number;
}

interface DeportesModuleProps {
  userRole: 'admin' | 'secretario';
}

export function DeportesModule({ userRole }: DeportesModuleProps) {
  const [deportes, setDeportes] = useState<Deporte[]>([
    {
      id: '1',
      nombre: 'Fútbol',
      descripcion: 'Fútbol 11 para adultos y menores',
      cuotaMensual: 15000,
      diasHorarios: 'Lunes y Miércoles 18:00-20:00',
      inscriptos: 45,
    },
    {
      id: '2',
      nombre: 'Voley',
      descripcion: 'Voley mixto recreativo y competitivo',
      cuotaMensual: 12000,
      diasHorarios: 'Martes y Jueves 19:00-21:00',
      inscriptos: 28,
    },
    {
      id: '3',
      nombre: 'Tenis',
      descripcion: 'Clases individuales y grupales',
      cuotaMensual: 20000,
      diasHorarios: 'Lunes a Viernes 16:00-20:00',
      inscriptos: 32,
    },
    {
      id: '4',
      nombre: 'Natación',
      descripcion: 'Natación para todas las edades',
      cuotaMensual: 18000,
      diasHorarios: 'Lunes a Sábado 10:00-20:00',
      inscriptos: 56,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAsociarDialogOpen, setIsAsociarDialogOpen] = useState(false);
  const [editingDeporte, setEditingDeporte] = useState<Deporte | null>(null);
  const [formData, setFormData] = useState<Partial<Deporte>>({});

  // Mock data para asociar socios
  const [selectedSocio, setSelectedSocio] = useState('');
  const [selectedDeportes, setSelectedDeportes] = useState<string[]>([]);
  const [selectedPromocion, setSelectedPromocion] = useState('');
  
  const mockSocios = [
    { id: '1', nombre: 'Carlos González', deportesActuales: ['Fútbol', 'Tenis'] },
    { id: '2', nombre: 'Ana Martínez', deportesActuales: ['Voley', 'Natación'] },
    { id: '3', nombre: 'Lucas González', deportesActuales: ['Fútbol'] },
  ];

  const promocionesDisponibles = [
    { id: '1', nombre: 'Multi-deporte', descuento: 10, tipo: 'porcentaje' as const, activa: true },
    { id: '2', nombre: 'Familiar', descuento: 15, tipo: 'porcentaje' as const, activa: true },
    { id: '3', nombre: 'Estudiante', descuento: 20, tipo: 'porcentaje' as const, activa: true },
    { id: '4', nombre: 'Promoción Verano', descuento: 2000, tipo: 'monto_fijo' as const, activa: false },
  ];

  const handleOpenDialog = (deporte?: Deporte) => {
    if (deporte) {
      setEditingDeporte(deporte);
      setFormData(deporte);
    } else {
      setEditingDeporte(null);
      setFormData({});
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingDeporte) {
      setDeportes(deportes.map(d => d.id === editingDeporte.id ? { ...formData as Deporte, id: editingDeporte.id } : d));
      toast.success('Deporte actualizado correctamente');
    } else {
      const newDeporte = {
        ...formData as Deporte,
        id: Date.now().toString(),
        inscriptos: 0,
      };
      setDeportes([...deportes, newDeporte]);
      toast.success('Deporte registrado correctamente');
    }
    setIsDialogOpen(false);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
      toast.error('No tienes permisos para eliminar deportes');
      return;
    }
    if (confirm('¿Estás seguro de que deseas eliminar este deporte?')) {
      setDeportes(deportes.filter(d => d.id !== id));
      toast.success('Deporte eliminado correctamente');
    }
  };

  const handleAsociarSocio = () => {
    if (!selectedSocio || selectedDeportes.length === 0) {
      toast.error('Selecciona un socio y al menos un deporte');
      return;
    }
    toast.success('Socio asociado a deportes correctamente');
    setIsAsociarDialogOpen(false);
    setSelectedSocio('');
    setSelectedDeportes([]);
    setSelectedPromocion('');
  };

  const calcularCuotaTotal = () => {
    if (selectedDeportes.length === 0) return { total: 0, descuento: 0, final: 0 };
    
    const total = selectedDeportes.reduce((sum, deporteId) => {
      const deporte = deportes.find(d => d.id === deporteId);
      return sum + (deporte?.cuotaMensual || 0);
    }, 0);

    let descuento = 0;
    
    // Aplicar promoción seleccionada
    if (selectedPromocion) {
      const promocion = promocionesDisponibles.find(p => p.id === selectedPromocion);
      if (promocion) {
        if (promocion.tipo === 'porcentaje') {
          descuento = total * (promocion.descuento / 100);
        } else {
          descuento = promocion.descuento;
        }
      }
    }

    return {
      total,
      descuento,
      final: total - descuento
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Deportes</CardDescription>
            <CardTitle>{deportes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Inscriptos</CardDescription>
            <CardTitle>{deportes.reduce((sum, d) => sum + d.inscriptos, 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ingresos Mensuales Potenciales</CardDescription>
            <CardTitle>
              ${deportes.reduce((sum, d) => sum + (d.cuotaMensual * d.inscriptos), 0).toLocaleString()}
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
              <Dialog open={isAsociarDialogOpen} onOpenChange={setIsAsociarDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Asociar Socio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asociar Socio a Deportes</DialogTitle>
                    <DialogDescription>
                      Selecciona un socio y los deportes en los que desea participar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Socio</Label>
                      <Select value={selectedSocio} onValueChange={setSelectedSocio}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un socio" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSocios.map((socio) => (
                            <SelectItem key={socio.id} value={socio.id}>
                              {socio.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Deportes</Label>
                      <div className="space-y-2 border rounded-lg p-3">
                        {deportes.map((deporte) => (
                          <div key={deporte.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`deporte-${deporte.id}`}
                              checked={selectedDeportes.includes(deporte.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedDeportes([...selectedDeportes, deporte.id]);
                                } else {
                                  setSelectedDeportes(selectedDeportes.filter(id => id !== deporte.id));
                                }
                              }}
                            />
                            <label htmlFor={`deporte-${deporte.id}`} className="flex-1 cursor-pointer">
                              <div>{deporte.nombre}</div>
                              <div className="text-sm text-gray-500">${deporte.cuotaMensual.toLocaleString()}/mes</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Promoción (Opcional)</Label>
                      <Select value={selectedPromocion} onValueChange={setSelectedPromocion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una promoción" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ninguna">Ninguna</SelectItem>
                          {promocionesDisponibles.filter(p => p.activa).map((promocion) => (
                            <SelectItem key={promocion.id} value={promocion.id}>
                              <div className="flex items-center gap-2">
                                <Tag className="w-3 h-3" />
                                {promocion.nombre} - {promocion.tipo === 'porcentaje' ? `${promocion.descuento}%` : `$${promocion.descuento}`}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedDeportes.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${calcularCuotaTotal().total.toLocaleString()}</span>
                        </div>
                        {calcularCuotaTotal().descuento > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              Descuento aplicado:
                            </span>
                            <span>-${calcularCuotaTotal().descuento.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="font-semibold">Cuota total:</span>
                          <span className="font-semibold">${calcularCuotaTotal().final.toLocaleString()}/mes</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAsociarDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAsociarSocio}>
                      Asociar
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
                    <DialogDescription>
                      Complete los datos del deporte o actividad
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre del Deporte *</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre || ''}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Input
                        id="descripcion"
                        value={formData.descripcion || ''}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cuotaMensual">Cuota Mensual ($) *</Label>
                        <Input
                          id="cuotaMensual"
                          type="number"
                          value={formData.cuotaMensual || ''}
                          onChange={(e) => setFormData({ ...formData, cuotaMensual: parseFloat(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="diasHorarios">Días y Horarios</Label>
                        <Input
                          id="diasHorarios"
                          value={formData.diasHorarios || ''}
                          onChange={(e) => setFormData({ ...formData, diasHorarios: e.target.value })}
                          placeholder="Ej: Lunes y Miércoles 18:00"
                        />
                      </div>
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
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deporte</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cuota Mensual</TableHead>
                  <TableHead>Horarios</TableHead>
                  <TableHead>Inscriptos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deportes.map((deporte) => (
                  <TableRow key={deporte.id}>
                    <TableCell>{deporte.nombre}</TableCell>
                    <TableCell className="max-w-xs">{deporte.descripcion}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        {deporte.cuotaMensual.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{deporte.diasHorarios}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <UsersIcon className="w-3 h-3 mr-1" />
                        {deporte.inscriptos}
                      </Badge>
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
                            onClick={() => handleDelete(deporte.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, Tag, Percent } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Textarea } from './ui/textarea';

interface Promocion {
  id: string;
  nombre: string;
  descripcion: string;
  descuento: number;
  tipo: 'porcentaje' | 'monto_fijo';
  activa: boolean;
}

interface PromocionesModuleProps {
  userRole: 'admin' | 'secretario';
}

export function PromocionesModule({ userRole }: PromocionesModuleProps) {
  const [promociones, setPromociones] = useState<Promocion[]>([
    {
      id: '1',
      nombre: 'Multi-deporte',
      descripcion: 'Descuento para socios que practican más de un deporte',
      descuento: 10,
      tipo: 'porcentaje',
      activa: true,
    },
    {
      id: '2',
      nombre: 'Familiar',
      descripcion: 'Descuento para grupos familiares (2 o más miembros de la misma familia)',
      descuento: 15,
      tipo: 'porcentaje',
      activa: true,
    },
    {
      id: '3',
      nombre: 'Estudiante',
      descripcion: 'Descuento especial para estudiantes universitarios',
      descuento: 20,
      tipo: 'porcentaje',
      activa: true,
    },
    {
      id: '4',
      nombre: 'Promoción Verano',
      descripcion: 'Descuento especial para inscripciones de verano',
      descuento: 2000,
      tipo: 'monto_fijo',
      activa: false,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromocion, setEditingPromocion] = useState<Promocion | null>(null);
  const [formData, setFormData] = useState<Partial<Promocion>>({
    tipo: 'porcentaje',
    activa: true,
  });

  const handleOpenDialog = (promocion?: Promocion) => {
    if (promocion) {
      setEditingPromocion(promocion);
      setFormData(promocion);
    } else {
      setEditingPromocion(null);
      setFormData({
        tipo: 'porcentaje',
        activa: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.descripcion || !formData.descuento) {
      toast.error('Complete todos los campos obligatorios');
      return;
    }

    if (formData.descuento <= 0) {
      toast.error('El descuento debe ser mayor a 0');
      return;
    }

    if (formData.tipo === 'porcentaje' && formData.descuento > 100) {
      toast.error('El descuento porcentual no puede ser mayor al 100%');
      return;
    }

    if (editingPromocion) {
      setPromociones(promociones.map(p => 
        p.id === editingPromocion.id ? { ...formData as Promocion, id: editingPromocion.id } : p
      ));
      toast.success('Promoción actualizada correctamente');
    } else {
      const nuevaPromocion = {
        ...formData as Promocion,
        id: Date.now().toString(),
      };
      setPromociones([...promociones, nuevaPromocion]);
      toast.success('Promoción creada correctamente');
    }
    
    setIsDialogOpen(false);
    setFormData({ tipo: 'porcentaje', activa: true });
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'admin') {
      toast.error('No tienes permisos para eliminar promociones');
      return;
    }
    if (confirm('¿Estás seguro de que deseas eliminar esta promoción?')) {
      setPromociones(promociones.filter(p => p.id !== id));
      toast.success('Promoción eliminada correctamente');
    }
  };

  const handleToggleActiva = (id: string) => {
    setPromociones(promociones.map(p => {
      if (p.id === id) {
        return { ...p, activa: !p.activa };
      }
      return p;
    }));
    toast.success('Estado de promoción actualizado');
  };

  const promocionesActivas = promociones.filter(p => p.activa).length;
  const promocionesInactivas = promociones.filter(p => !p.activa).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Promociones</CardDescription>
            <CardTitle>{promociones.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" />
              Promociones Activas
            </CardDescription>
            <CardTitle className="text-green-600">{promocionesActivas}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Promociones Inactivas</CardDescription>
            <CardTitle className="text-gray-500">{promocionesInactivas}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Promociones</CardTitle>
              <CardDescription>
                Crea y administra promociones personalizadas para aplicar a las cuotas
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Promoción
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPromocion ? 'Editar Promoción' : 'Nueva Promoción'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure los detalles de la promoción
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la Promoción *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre || ''}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Multi-deporte, Familiar, Estudiante"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción *</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion || ''}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Describe las condiciones de la promoción"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Descuento *</Label>
                      <select
                        id="tipo"
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'porcentaje' | 'monto_fijo' })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="porcentaje">Porcentaje (%)</option>
                        <option value="monto_fijo">Monto Fijo ($)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descuento">
                        {formData.tipo === 'porcentaje' ? 'Descuento (%) *' : 'Descuento ($) *'}
                      </Label>
                      <Input
                        id="descuento"
                        type="number"
                        value={formData.descuento || ''}
                        onChange={(e) => setFormData({ ...formData, descuento: parseFloat(e.target.value) })}
                        placeholder={formData.tipo === 'porcentaje' ? 'Ej: 10' : 'Ej: 2000'}
                        min="0"
                        max={formData.tipo === 'porcentaje' ? 100 : undefined}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="activa"
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="activa" className="cursor-pointer">
                      Promoción activa
                    </label>
                  </div>

                  {formData.descuento && formData.descuento > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Vista previa:</strong> Esta promoción aplicará un descuento de{' '}
                        {formData.tipo === 'porcentaje' 
                          ? `${formData.descuento}%`
                          : `$${formData.descuento}`
                        } sobre el monto total.
                      </p>
                      {formData.tipo === 'porcentaje' && (
                        <p className="text-sm text-gray-600 mt-1">
                          Ejemplo: En una cuota de $10,000 se descontarían ${(10000 * formData.descuento / 100).toLocaleString()}, 
                          quedando en ${(10000 - (10000 * formData.descuento / 100)).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    {editingPromocion ? 'Guardar Cambios' : 'Crear Promoción'}
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
                  <TableHead>Descripción</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promociones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No hay promociones creadas
                    </TableCell>
                  </TableRow>
                ) : (
                  promociones.map((promocion) => (
                    <TableRow key={promocion.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-blue-600" />
                          <span>{promocion.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">{promocion.descripcion}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Percent className="w-3 h-3" />
                          {promocion.tipo === 'porcentaje' 
                            ? `${promocion.descuento}%`
                            : `$${promocion.descuento}`
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promocion.activa ? 'default' : 'secondary'}>
                          {promocion.activa ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActiva(promocion.id)}
                          >
                            {promocion.activa ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(promocion)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {userRole === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(promocion.id)}
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
        </CardContent>
      </Card>
    </div>
  );
}

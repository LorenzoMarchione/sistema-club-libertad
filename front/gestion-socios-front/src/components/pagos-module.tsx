import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Download, FileText, DollarSign, TrendingUp, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import cuotaService from '../services/cuotaService';
import type { Cuota } from '../types/cuota';

interface Pago {
  id: string;
  socio: string;
  socioDNI: string;
  monto: number;
  fecha: string;
  mes: string;
  metodoPago: 'efectivo' | 'transferencia' | 'debito_automatico';
  estado: 'pagado' | 'pendiente' | 'vencido';
  conceptos: {
    concepto: string;
    monto: number;
  }[];
}

interface PagosModuleProps {
  userRole: 'admin' | 'secretario';
}

export function PagosModule({ userRole }: PagosModuleProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar cuotas del backend
  useEffect(() => {
    const cargarCuotas = async () => {
      try {
        setLoading(true);
        
        // Primero generar cuotas del mes actual si faltan
        await cuotaService.generarCuotasMesActual();
        
        // Luego cargar todas las cuotas
        const response = await cuotaService.getAll();
        const cuotasData = Array.isArray(response.data) ? response.data : [];
        setCuotas(cuotasData);
        
        // Transformar cuotas a pagos para mostrar en la tabla
        const pagosTransformados = cuotasData.map((cuota, idx) => ({
          id: (cuota.id || idx).toString(),
          socio: `${cuota.personaId?.nombre || ''} ${cuota.personaId?.apellido || ''}`,
          socioDNI: cuota.personaId?.dni || '',
          monto: cuota.monto,
          fecha: cuota.estado === 'PAGADA' ? cuota.fechaGeneracion : '',
          mes: new Date(cuota.periodo).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' }),
          metodoPago: 'transferencia' as const,
          estado: cuota.estado === 'PAGADA' ? 'pagado' : cuota.estado === 'VENCIDA' ? 'vencido' : 'pendiente',
          conceptos: [
            {
              concepto: cuota.concepto || `${cuota.deporteId?.nombre || 'Cuota'}`,
              monto: cuota.monto,
            }
          ]
        }));
        
        setPagos(pagosTransformados);
      } catch (error) {
        console.error('Error al cargar cuotas:', error);
        toast.error('Error al cargar las cuotas');
      } finally {
        setLoading(false);
      }
    };
    
    cargarCuotas();
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [editEstado, setEditEstado] = useState<'pagado' | 'pendiente' | 'vencido'>('pendiente');
  const [editMetodoPago, setEditMetodoPago] = useState<'efectivo' | 'transferencia' | 'debito_automatico'>('efectivo');
  
  const [selectedSocio, setSelectedSocio] = useState('');
  const [conceptos, setConceptos] = useState<{ concepto: string; monto: number }[]>([
    { concepto: 'Entrenador', monto: 0 },
    { concepto: 'Seguro', monto: 0 },
    { concepto: 'Cuota Social', monto: 0 }
  ]);
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'debito_automatico'>('efectivo');
  const [mes, setMes] = useState('');

  // Conceptos predefinidos
  const conceptosPredefinidos = ['Entrenador', 'Seguro', 'Cuota Social'];

  const mockSocios = [
    { id: '1', nombre: 'Carlos González', dni: '12345678' },
    { id: '2', nombre: 'Ana Martínez', dni: '23456789' },
    { id: '3', nombre: 'Lucas González', dni: '98765432' },
  ];

  const handleRegistrarPago = () => {
    if (!selectedSocio || !mes || conceptos.some(c => !c.concepto || c.monto <= 0)) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    const socio = mockSocios.find(s => s.id === selectedSocio);
    const montoTotal = conceptos.reduce((sum, c) => sum + c.monto, 0);

    const nuevoPago: Pago = {
      id: Date.now().toString(),
      socio: socio?.nombre || '',
      socioDNI: socio?.dni || '',
      monto: montoTotal,
      fecha: new Date().toISOString().split('T')[0],
      mes,
      metodoPago,
      estado: 'pagado',
      conceptos: [...conceptos],
    };

    setPagos([nuevoPago, ...pagos]);
    toast.success('Pago registrado correctamente');
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSocio('');
    setConceptos([{ concepto: 'Entrenador', monto: 0 }, { concepto: 'Seguro', monto: 0 }, { concepto: 'Cuota Social', monto: 0 }]);
    setMetodoPago('efectivo');
    setMes('');
  };

  const agregarConcepto = () => {
    setConceptos([...conceptos, { concepto: '', monto: 0 }]);
  };

  const eliminarConcepto = (index: number) => {
    setConceptos(conceptos.filter((_, i) => i !== index));
  };

  const actualizarConcepto = (index: number, field: 'concepto' | 'monto', value: string | number) => {
    const nuevosConceptos = [...conceptos];
    nuevosConceptos[index] = {
      ...nuevosConceptos[index],
      [field]: value,
    };
    setConceptos(nuevosConceptos);
  };

  const generarArchivoRedLink = () => {
    // En producción, esto generaría el archivo real según especificaciones de Red Link
    const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' && p.metodoPago === 'debito_automatico');
    
    if (pagosPendientes.length === 0) {
      toast.error('No hay pagos pendientes para débito automático');
      return;
    }

    // Simular generación de archivo
    const contenido = pagosPendientes.map(p => 
      `${p.socioDNI}|${p.socio}|${p.monto}|${p.mes}`
    ).join('\n');
    
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redlink_debitos_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    
    toast.success('Archivo de Red Link generado correctamente');
  };

  const generarReporte = (tipo: 'ingresos' | 'deudas') => {
    if (tipo === 'ingresos') {
      const ingresos = pagos.filter(p => p.estado === 'pagado');
      const total = ingresos.reduce((sum, p) => sum + p.monto, 0);
      toast.success(`Reporte de ingresos: $${total.toLocaleString()}`);
    } else {
      const deudas = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'vencido');
      const total = deudas.reduce((sum, p) => sum + p.monto, 0);
      toast.success(`Reporte de deudas: $${total.toLocaleString()}`);
    }
  };

  const estadisticas = {
    totalIngresos: pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + p.monto, 0),
    totalPendientes: pagos.filter(p => p.estado === 'pendiente').reduce((sum, p) => sum + p.monto, 0),
    totalVencidos: pagos.filter(p => p.estado === 'vencido').reduce((sum, p) => sum + p.monto, 0),
  };

  if (loading) return <div>Cargando cuotas...</div>;

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pagado: 'default',
      pendiente: 'secondary',
      vencido: 'destructive',
    };
    return variants[estado as keyof typeof variants] || 'default';
  };

  const getMetodoPagoLabel = (metodo: string) => {
    const labels = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      debito_automatico: 'Débito Automático',
    };
    return labels[metodo as keyof typeof labels] || metodo;
  };

  const handleOpenEditDialog = (pago: Pago) => {
    setEditingPago(pago);
    setEditEstado(pago.estado);
    setEditMetodoPago(pago.metodoPago);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePago = () => {
    if (!editingPago) return;

    setPagos(pagos.map(p => {
      if (p.id === editingPago.id) {
        return {
          ...p,
          estado: editEstado,
          metodoPago: editMetodoPago,
          fecha: editEstado === 'pagado' && !p.fecha ? new Date().toISOString().split('T')[0] : p.fecha,
        };
      }
      return p;
    }));

    toast.success('Pago actualizado correctamente');
    setIsEditDialogOpen(false);
    setEditingPago(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Ingresos del Mes
            </CardDescription>
            <CardTitle className="text-green-600">
              ${estadisticas.totalIngresos.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-600" />
              Pagos Pendientes
            </CardDescription>
            <CardTitle className="text-yellow-600">
              ${estadisticas.totalPendientes.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              Pagos Vencidos
            </CardDescription>
            <CardTitle className="text-red-600">
              ${estadisticas.totalVencidos.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Gestión de Cuotas</CardTitle>
              <CardDescription>Registro y manejo de cuotas</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={generarArchivoRedLink}>
                <Download className="w-4 h-4 mr-2" />
                Archivo Red Link
              </Button>
              <Button variant="outline" onClick={() => generarReporte('ingresos')}>
                <FileText className="w-4 h-4 mr-2" />
                Reporte Ingresos
              </Button>
              <Button variant="outline" onClick={() => generarReporte('deudas')}>
                <FileText className="w-4 h-4 mr-2" />
                Reporte Deudas
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                    <DialogDescription>
                      Complete los datos del pago y divida en conceptos si es necesario
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Socio *</Label>
                        <Select value={selectedSocio} onValueChange={setSelectedSocio}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un socio" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockSocios.map((socio) => (
                              <SelectItem key={socio.id} value={socio.id}>
                                {socio.nombre} (DNI: {socio.dni})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Método de Pago *</Label>
                        <Select value={metodoPago} onValueChange={(v: any) => setMetodoPago(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Mes *</Label>
                      <Input
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        placeholder="Ej: Noviembre 2025"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Conceptos de Pago *</Label>
                      <div className="space-y-3 border rounded-lg p-3">
                        {conceptos.map((concepto, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <div className="flex-1 px-3 py-2 bg-gray-50 border rounded-md">
                              {concepto.concepto}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">$</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={concepto.monto || ''}
                                onChange={(e) => actualizarConcepto(index, 'monto', parseFloat(e.target.value) || 0)}
                                className="w-32"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t flex justify-between">
                          <span>Total:</span>
                          <span className="font-semibold">
                            ${conceptos.reduce((sum, c) => sum + (c.monto || 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleRegistrarPago}>
                      Registrar Pago
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todos">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="pagados">Pagados</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="vencidos">Vencidos</TabsTrigger>
            </TabsList>

            {['todos', 'pagados', 'pendientes', 'vencidos'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Socio</TableHead>
                        <TableHead>DNI</TableHead>
                        <TableHead>Mes</TableHead>
                        <TableHead>Conceptos</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos
                        .filter(p => {
                          if (tab === 'todos') return true;
                          if (tab === 'pagados') return p.estado === 'pagado';
                          if (tab === 'pendientes') return p.estado === 'pendiente';
                          if (tab === 'vencidos') return p.estado === 'vencido';
                          return true;
                        })
                        .map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell>{pago.socio}</TableCell>
                            <TableCell>{pago.socioDNI}</TableCell>
                            <TableCell>{pago.mes}</TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                {pago.conceptos.map((c, idx) => (
                                  <div key={idx} className="flex justify-between gap-2">
                                    <span className="text-gray-600">{c.concepto}:</span>
                                    <span className={c.monto < 0 ? 'text-green-600' : ''}>
                                      ${c.monto.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span>${pago.monto.toLocaleString()}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getMetodoPagoLabel(pago.metodoPago)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pago.fecha ? new Date(pago.fecha).toLocaleDateString() : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getEstadoBadge(pago.estado) as any}>
                                {pago.estado}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditDialog(pago)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogo de edición de pago */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Pago</DialogTitle>
            <DialogDescription>
              Modifica el estado del pago
            </DialogDescription>
          </DialogHeader>
          {editingPago && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm">Socio</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {editingPago.socio} (DNI: {editingPago.socioDNI})
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Mes</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  {editingPago.mes}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Monto Total</Label>
                <div className="p-2 bg-gray-50 rounded border">
                  ${editingPago.monto.toLocaleString()}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-metodo">Método de Pago</Label>
                <Select value={editMetodoPago} onValueChange={(v: any) => setEditMetodoPago(v as any)}>
                  <SelectTrigger id="edit-metodo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="debito_automatico">Débito Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado del Pago</Label>
                <Select value={editEstado} onValueChange={(v: any) => setEditEstado(v as any)}>
                  <SelectTrigger id="edit-estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editEstado === 'pagado' && !editingPago.fecha && (
                <div className="bg-blue-50 p-3 rounded-lg text-sm">
                  <p className="text-blue-800">
                    ℹ️ Al cambiar el estado a "Pagado", se registrará la fecha actual como fecha de pago.
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePago}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
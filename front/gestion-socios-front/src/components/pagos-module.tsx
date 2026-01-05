import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Download, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import cuotaService from '../services/cuotaService';
import pagoService from '../services/pagoService';
import personaService from '../services/personaService';
import deporteService from '../services/deporteService';
import promocionService from '../services/promocionService';
import type { Cuota } from '../types/cuota';
import type { Persona } from '../types/persona';
import type { Deporte } from '../types/deporte';
import type { Promocion } from '../types/promocion';
import { Checkbox } from './ui/checkbox';

interface Pago {
  id: string;
  socio: string;
  socioDNI: string;
  monto: number;
  fecha: string;
  mes: string;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO_AUTOMATICO';
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
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [pagosServidor, setPagosServidor] = useState<any[]>([]);
  const [searchCuota, setSearchCuota] = useState<string>('');

  // Helper para extraer mes-año de periodo sin problemas de timezone
  const getMesAno = (periodo: string) => {
    const [year, month] = periodo.split('-');
    if (!year || !month) return periodo;
    const mesNum = parseInt(month, 10);
    const meses = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return `${meses[mesNum] || 'mes'} de ${year}`;
  };

  const cargarCuotas = useCallback(async () => {
    try {
      setLoading(true);

      // Primero actualizar cuotas vencidas
      await cuotaService.actualizarCuotasVencidas();

      // Luego generar cuotas del mes actual si faltan
      await cuotaService.generarCuotasMesActual();

      // Luego cargar todas las cuotas, personas y deportes en paralelo
      const [cuotasRes, personasRes, deportesRes, pagosRes, promocionesRes] = await Promise.all([
        cuotaService.getAll(),
        personaService.getAll(),
        deporteService.getAll(),
        pagoService.getAll(),
        promocionService.getAll(),
      ]);
      const cuotasData = Array.isArray(cuotasRes.data) ? cuotasRes.data : [];
      const personasData = Array.isArray(personasRes.data) ? personasRes.data : [];
      const deportesData = Array.isArray(deportesRes.data) ? deportesRes.data : [];
      setCuotas(cuotasData);
      setPersonas(personasData);
      setDeportes(deportesData);
      setPagosServidor(Array.isArray(pagosRes.data) ? pagosRes.data : []);
      setPromociones(Array.isArray(promocionesRes.data) ? promocionesRes.data : []);

      // Mapear por ID para acceso rápido
      const personaMap = new Map<number, Persona>(personasData.map(p => [Number(p.id), p] as const));
      const deporteMap = new Map<number, Deporte>(deportesData.map(d => [Number(d.id), d] as const));

      // Transformar cuotas a pagos para mostrar en la tabla
      const pagosTransformados = cuotasData.map((cuota, idx) => {
        const p = personaMap.get(Number(cuota.personaId));
        const d = deporteMap.get(Number(cuota.deporteId));
        return {
          id: (cuota.id || idx).toString(),
          socio: p ? `${p.nombre} ${p.apellido}` : `Persona ${cuota.personaId}`,
          socioDNI: p?.dni || '',
          monto: cuota.monto,
          fecha: cuota.estado === 'PAGADA' ? cuota.fechaGeneracion : '',
          mes: getMesAno(cuota.periodo),
          metodoPago: 'TRANSFERENCIA' as const,
          estado: cuota.estado === 'PAGADA' ? 'pagado' : cuota.estado === 'VENCIDA' ? 'vencido' : 'pendiente',
          conceptos: [
            {
              concepto: cuota.concepto || `${d?.nombre || 'Cuota'}`,
              monto: cuota.monto,
            },
          ],
        } as Pago;
      });

      setPagos(pagosTransformados);
    } catch (error) {
      console.error('Error al cargar cuotas:', error);
      toast.error('Error al cargar las cuotas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar cuotas del backend al montar
  useEffect(() => {
    cargarCuotas();
  }, [cargarCuotas]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState('');
  const [selectedCuotas, setSelectedCuotas] = useState<number[]>([]);
  const [selectedPromos, setSelectedPromos] = useState<number[]>([]);
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO_AUTOMATICO'>('EFECTIVO');
  const [observaciones, setObservaciones] = useState('');

  const calcularDescuento = (montoOriginal: number) => {
    if (!selectedPromos.length) return 0;
    const promoMap = new Map<number, Promocion>(promociones.map(p => [Number(p.id), p] as const));
    let descuentoTotal = 0;
    selectedPromos.forEach(pid => {
      const promo = promoMap.get(pid);
      if (!promo || promo.activo === false) return;
      if (promo.tipoDescuento === 'PORCENTAJE') {
        descuentoTotal += (montoOriginal * (promo.descuento || 0)) / 100;
      } else {
        descuentoTotal += promo.descuento || 0;
      }
    });
    return Math.min(descuentoTotal, montoOriginal);
  };

  const handleRegistrarPago = async () => {
    if (!selectedSocio || selectedCuotas.length === 0) {
      toast.error('Selecciona un socio y al menos una cuota');
      return;
    }

    const socio = personas.find(s => String(s.id) === selectedSocio);
    const cuotasSeleccionadas = cuotas.filter(c => selectedCuotas.includes(Number(c.id)));
    const montoOriginal = cuotasSeleccionadas.reduce((sum, c) => sum + (c.monto || 0), 0);

    if (montoOriginal <= 0) {
      toast.error('El monto total debe ser mayor a 0');
      return;
    }

    const montoDescuento = calcularDescuento(montoOriginal);
    const totalCalculado = montoOriginal - montoDescuento;
    if (totalCalculado <= 0) {
      toast.error('El total después del descuento debe ser mayor a 0');
      return;
    }

    const fechaPago = new Date();
    const yyyy = fechaPago.getFullYear();
    const mm = String(fechaPago.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaPago.getDate()).padStart(2, '0');
    const fechaPagoStr = `${yyyy}-${mm}-${dd}`;

    try {
      await pagoService.create({
        socioId: Number(selectedSocio),
        fechaPago: fechaPagoStr,
        montoOriginal,
        montoDescuento,
        montoTotal: totalCalculado,
        metodoPago,
        observaciones: observaciones.trim() || undefined,
        cuotaIds: selectedCuotas,
      });

      toast.success('Pago registrado correctamente');
      setIsDialogOpen(false);
      await cargarCuotas();
      resetForm();
    } catch (error) {
      toast.error('Error al registrar el pago');
      console.error('Error al registrar pago:', error);
    }
  };

  const resetForm = () => {
    setSelectedSocio('');
    setSelectedCuotas([]);
    setSelectedPromos([]);
    setMetodoPago('EFECTIVO');
    setObservaciones('');
  };

  const generarArchivoRedLink = () => {
    // En producción, esto generaría el archivo real según especificaciones de Red Link
    const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' && p.metodoPago === 'DEBITO_AUTOMATICO');
    
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

  const hoy = new Date().toISOString().split('T')[0];
  const estadisticas = {
    totalIngresos: pagos.filter(p => p.estado === 'pagado').reduce((sum, p) => sum + p.monto, 0),
    ingresosDia: pagos.filter(p => p.estado === 'pagado' && p.fecha && p.fecha.startsWith(hoy)).reduce((sum, p) => sum + p.monto, 0),
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
      EFECTIVO: 'Efectivo',
      TRANSFERENCIA: 'Transferencia',
      DEBITO_AUTOMATICO: 'Débito Automático',
    };
    return labels[metodo as keyof typeof labels] || metodo;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <DollarSign className="w-4 h-4 text-blue-600" />
              Ingresos del Día
            </CardDescription>
            <CardTitle className="text-blue-600">
              ${estadisticas.ingresosDia.toLocaleString()}
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
                      Selecciona el socio y las cuotas que deseas marcar como pagadas
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Socio *</Label>
                        <Select value={selectedSocio} onValueChange={(v) => { setSelectedSocio(v); setSelectedCuotas([]); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un socio" />
                          </SelectTrigger>
                          <SelectContent>
                            {personas.map((socio) => (
                              <SelectItem key={socio.id} value={String(socio.id)}>
                                {socio.nombre} {socio.apellido} (DNI: {socio.dni})
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
                            <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                            <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                            <SelectItem value="DEBITO_AUTOMATICO">Débito Automático</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Observaciones</Label>
                      <Input
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Promociones</Label>
                      <div className="border rounded-lg divide-y max-h-[240px] overflow-y-auto">
                        {promociones.filter(p => p.activo !== false).map(promo => {
                          const checked = selectedPromos.includes(Number(promo.id));
                          return (
                            <div key={promo.id} className="flex items-start gap-3 p-3">
                              <Checkbox
                                id={`promo-${promo.id}`}
                                checked={checked}
                                onCheckedChange={(val) => {
                                  if (val) {
                                    setSelectedPromos(prev => [...prev, Number(promo.id)]);
                                  } else {
                                    setSelectedPromos(prev => prev.filter(id => id !== Number(promo.id)));
                                  }
                                }}
                              />
                              <label htmlFor={`promo-${promo.id}`} className="flex-1 cursor-pointer">
                                <div className="font-medium flex items-center gap-2">
                                  {promo.nombre}
                                  <Badge variant="outline" className="text-xs">
                                    {promo.tipoDescuento === 'PORCENTAJE' ? `${promo.descuento}%` : `$${promo.descuento.toLocaleString()}`}
                                  </Badge>
                                </div>
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
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Descuento aplicado:</span>
                        <span className="font-semibold">
                          ${calcularDescuento(
                            cuotas
                              .filter(c => selectedCuotas.includes(Number(c.id)))
                              .reduce((sum, c) => sum + (c.monto || 0), 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Total a pagar:</span>
                        <span className="font-semibold">
                          ${(
                            (() => {
                              const base = cuotas
                                .filter(c => selectedCuotas.includes(Number(c.id)))
                                .reduce((sum, c) => sum + (c.monto || 0), 0);
                              const desc = calcularDescuento(base);
                              return Math.max(base - desc, 0);
                            })()
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Cuotas a pagar *</Label>
                      <div className="border rounded-lg divide-y max-h-[260px] overflow-y-auto">
                        {cuotas
                          .filter(c => selectedSocio && Number(c.personaId) === Number(selectedSocio) && c.estado !== 'PAGADA')
                          .map(cuota => {
                            const deporte = deportes.find(d => Number(d.id) === Number(cuota.deporteId));
                            const checked = selectedCuotas.includes(Number(cuota.id));
                            return (
                              <div key={cuota.id} className="flex items-center gap-3 p-3">
                                <Checkbox
                                  id={`cuota-${cuota.id}`}
                                  checked={checked}
                                  onCheckedChange={(val) => {
                                    if (val) {
                                      setSelectedCuotas(prev => [...prev, Number(cuota.id)]);
                                    } else {
                                      setSelectedCuotas(prev => prev.filter(id => id !== Number(cuota.id)));
                                    }
                                  }}
                                />
                                <label htmlFor={`cuota-${cuota.id}`} className="flex-1 cursor-pointer">
                                  <div className="font-medium flex items-center gap-2">
                                    {deporte?.nombre || 'Cuota'}
                                    <Badge variant="outline" className="text-xs">{cuota.estado}</Badge>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Periodo: {getMesAno(cuota.periodo)}
                                  </div>
                                </label>
                                <div className="text-sm font-semibold">${(cuota.monto || 0).toLocaleString()}</div>
                              </div>
                            );
                          })}
                        {selectedSocio && cuotas.filter(c => Number(c.personaId) === Number(selectedSocio) && c.estado !== 'PAGADA').length === 0 && (
                          <div className="p-3 text-sm text-gray-500">No hay cuotas pendientes para este socio</div>
                        )}
                        {!selectedSocio && (
                          <div className="p-3 text-sm text-gray-500">Selecciona un socio para ver sus cuotas</div>
                        )}
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>Total seleccionado:</span>
                        <span className="font-semibold">
                          ${cuotas
                            .filter(c => selectedCuotas.includes(Number(c.id)))
                            .reduce((sum, c) => sum + (c.monto || 0), 0)
                            .toLocaleString()}
                        </span>
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
              <TabsTrigger value="todos">Cuotas</TabsTrigger>
              <TabsTrigger value="pagados">Pagadas</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="vencidos">Vencidas</TabsTrigger>
              <TabsTrigger value="pagos">Pagos</TabsTrigger>
            </TabsList>

            {['todos', 'pagados', 'pendientes', 'vencidos'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Buscar por socio, DNI, deporte o estado..."
                    value={searchCuota}
                    onChange={(e) => setSearchCuota(e.target.value)}
                    className="max-w-md"
                  />
                </div>
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
                        <TableHead>Fecha del Pago</TableHead>
                        <TableHead>Estado</TableHead>
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
                        .filter(p => {
                          const search = searchCuota.toLowerCase().trim();
                          if (!search) return true;
                          return (
                            p.socio.toLowerCase().includes(search) ||
                            p.socioDNI.toLowerCase().includes(search) ||
                            p.estado.toLowerCase().includes(search) ||
                            p.conceptos.some(c => c.concepto.toLowerCase().includes(search))
                          );
                        })
                        .map((pago) => (
                          <TableRow key={pago.id}>
                            <TableCell>{pago.socio}</TableCell>
                            <TableCell>{pago.socioDNI}</TableCell>
                            <TableCell>{pago.mes}</TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                {pago.conceptos.map((c, idx) => (
                                  <div key={idx}>
                                    <span className="text-gray-600">{c.concepto}</span>
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
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}

            {/* Lista alterna de Pagos */}
            <TabsContent value="pagos">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre y Apellido</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Cuotas Pagadas</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>Fecha de Pago</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(pagosServidor) && pagosServidor.length > 0 ? (
                      pagosServidor.map((pago: any) => {
                        const socio = personas.find(p => Number(p.id) === Number(pago.socioId));
                        const cuotasDePago = cuotas.filter(c => Number(c.pagoId) === Number(pago.id));
                        return (
                          <TableRow key={pago.id}>
                            <TableCell>{socio ? `${socio.nombre} ${socio.apellido}` : '—'}</TableCell>
                            <TableCell>{socio?.dni || '—'}</TableCell>
                            <TableCell>{cuotasDePago.length}</TableCell>
                            <TableCell>${(pago.montoTotal || 0).toLocaleString()}</TableCell>
                            <TableCell>{pago.fechaPago ? new Date(pago.fechaPago).toLocaleDateString('es-ES') : '—'}</TableCell>
                            <TableCell>{pago.observaciones || '—'}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">No hay pagos registrados</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  );
}
import { resolve } from "node:path";
import { leerPaquete } from "../../src/persistencia/paquete-canonico.js";
import { estadoCanonico, reproducirCanonico } from "../../src/persistencia/reproducir-canonico.js";
import { ConceptoPrelacion } from "../../src/dominio/prelacion-pago.js";
import { crearCasosUsoFinal } from "../../src/aplicacion/servicios-final.js";
import type { CreditoHecho, LecturasFinal, UnidadTrabajoFinal } from "../../src/aplicacion/puertos-final.js";

/**
 * Solo para pruebas: hechos en memoria derivados de la misma reproducción del núcleo que
 * persiste el cargador. No es un adaptador de producción ni un mock de cifras.
 */
export async function lecturasDesdePaquete(): Promise<{ lecturas: LecturasFinal; creditos: CreditoHecho[] }> {
  const paquete = await leerPaquete(resolve(process.env["CV_DATA_DIR"] ?? "datos/datos-proyecto-final"));
  const r = reproducirCanonico(paquete, "2026-10-31");
  const conceptos = { [ConceptoPrelacion.GASTOS_COMISIONES]: "GASTOS", [ConceptoPrelacion.INTERES_MORATORIO]: "MORATORIO",
    [ConceptoPrelacion.INTERES_CORRIENTE]: "CORRIENTE", [ConceptoPrelacion.CAPITAL]: "CAPITAL" } as const;
  const creditos: CreditoHecho[] = [...r.creditos.values()].map((c) => ({
    creditoId: c.origen.id_credito, clienteId: c.origen.id_cliente, asesorId: c.origen.id_asesor, politicaId: c.politicaId,
    estado: estadoCanonico(c), capital: BigInt(c.origen.capital_centavos), tnaBps: c.origen.tna_bps, plazoMeses: c.origen.plazo_meses,
    fechaSolicitud: c.origen.fecha, fechaDesembolso: c.origen.fecha, reestructurado: c.origen.reestructurado, version: 0,
    cuotas: c.plan.cuotas.map(({ cuota, fechaVencimiento }) => ({ numero: cuota.numero, vencimiento: fechaVencimiento.valor,
      capital: cuota.amortizacion.aUnidadesMenores(), interes: cuota.interes.aUnidadesMenores(), importe: cuota.importe.aUnidadesMenores(),
      saldoPosterior: cuota.saldoPosterior.aUnidadesMenores() })),
    pagos: r.pagos.filter((p) => p.pago.creditoId === c.origen.id_credito).map((p) => {
      const aplicacion = { GASTOS: 0n, MORATORIO: 0n, CORRIENTE: 0n, CAPITAL: 0n, EXCEDENTE: p.pago.aplicacion.excedente.aUnidadesMenores() };
      for (const paso of p.pago.aplicacion.pasos) aplicacion[conceptos[paso.concepto]] = paso.aplicado.aUnidadesMenores();
      return { pagoId: p.pago.pagoId, numeroCuota: p.numeroCuota, fecha: p.fecha, importe: p.pago.aplicacion.pago.aUnidadesMenores(),
        clave: p.pago.claveIdempotencia.valor, huella: p.pago.huella.valor, usuarioProceso: "CARGA_CANONICA", canal: p.canal,
        propuestaId: null, aplicacion };
    }),
    transiciones: c.credito.historial.map((t) => ({ estadoAnterior: t.estadoAnterior, estadoNuevo: t.estadoNuevo, fecha: t.fecha.valor,
      sujetoId: t.usuarioProceso, motivo: t.motivo })),
    baja: c.baja ? { fecha: c.baja.fecha, saldo: c.baja.saldo.aUnidadesMenores() } : null,
  }));
  const lecturas: LecturasFinal = {
    configuracionPoliticas: async () => paquete.politicas,
    credito: async (id) => creditos.find((c) => c.creditoId === id) ?? null,
    creditos: async () => creditos,
    clientes: async () => [...r.clientes.values()].map((c) => ({ clienteId: c.id_cliente, nombreCompleto: c.nombre_completo,
      municipio: c.municipio, fechaAlta: c.fecha_alta })),
    asesores: async () => paquete.asesores.map((a) => ({ asesorId: a.id, nombre: a.nombre })),
    cierre: async () => null,
  };
  return { lecturas, creditos };
}

const soloLectura: UnidadTrabajoFinal = { ejecutar: () => Promise.reject(new Error("Prueba de solo lectura.")) };
export async function casosEnMemoria() {
  const { lecturas, creditos } = await lecturasDesdePaquete();
  return { creditos, casos: crearCasosUsoFinal({ lecturas, unidad: soloLectura, diasRetencionIdempotencia: 30,
    ids: { propuesta: () => "PROP-T", pago: () => "PAGO-T", aprobacion: () => "APR-T" } }) };
}
export const contexto = { sujetoId: "PRUEBA", sesionId: "SES-PRUEBA", perfil: "GERENCIA", canal: "INTERFAZ", traceId: "T" } as const;

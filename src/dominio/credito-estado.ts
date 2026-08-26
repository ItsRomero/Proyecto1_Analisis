import { FechaCivil } from "./calculadora-mora.js";

export enum EstadoCredito {
  SOLICITADO = "SOLICITADO",
  APROBADO = "APROBADO",
  RECHAZADO = "RECHAZADO",
  DESEMBOLSADO = "DESEMBOLSADO",
  VIGENTE = "VIGENTE",
  EN_MORA = "EN_MORA",
  REESTRUCTURADO = "REESTRUCTURADO",
  ANULADO = "ANULADO",
  CANCELADO = "CANCELADO",
  INCOBRABLE = "INCOBRABLE",
}

export interface EvidenciaTransicion {
  readonly fecha: FechaCivil;
  readonly usuarioProceso: string;
  readonly motivo: string;
}

export class TransicionEstado {
  public readonly estadoAnterior: EstadoCredito;
  public readonly estadoNuevo: EstadoCredito;
  public readonly fecha: FechaCivil;
  public readonly usuarioProceso: string;
  public readonly motivo: string;

  public constructor(datos: {
    readonly estadoAnterior: EstadoCredito;
    readonly estadoNuevo: EstadoCredito;
    readonly evidencia: EvidenciaTransicion;
  }) {
    this.estadoAnterior = datos.estadoAnterior;
    this.estadoNuevo = datos.estadoNuevo;
    this.fecha = datos.evidencia.fecha;
    this.usuarioProceso = validarTexto(datos.evidencia.usuarioProceso, "usuario/proceso");
    this.motivo = validarTexto(datos.evidencia.motivo, "motivo");
    Object.freeze(this);
  }
}

export class TransicionInvalida extends Error {
  public constructor(estado: EstadoCredito, operacion: string) {
    super(`La operación ${operacion} no está permitida en el estado ${estado}.`);
    this.name = "TransicionInvalida";
  }
}

export class GuardaTransicionIncumplida extends Error {
  public constructor(motivo: string) {
    super(`No se cumple la guarda de transición: ${motivo}.`);
    this.name = "GuardaTransicionIncumplida";
  }
}

export class EvidenciaTransicionInvalida extends Error {
  public constructor(campo: string) {
    super(`La evidencia de transición requiere ${campo}.`);
    this.name = "EvidenciaTransicionInvalida";
  }
}

export class CronologiaTransicionInvalida extends Error {
  public constructor() {
    super("La fecha de una transición no puede ser anterior a la última registrada.");
    this.name = "CronologiaTransicionInvalida";
  }
}

function validarTexto(valor: string, campo: string): string {
  if (typeof valor !== "string" || valor.trim().length === 0) {
    throw new EvidenciaTransicionInvalida(campo);
  }
  return valor.trim();
}

function exigir(condicion: boolean, motivo: string): void {
  if (!condicion) throw new GuardaTransicionIncumplida(motivo);
}

const TOKEN_TRANSICION = Symbol("transicion-interna-state");

abstract class ComportamientoEstadoCredito {
  public constructor(public readonly nombre: EstadoCredito) {}

  public aprobar(_credito: Credito, _e: EvidenciaTransicion, _evaluacion: boolean, _autorizado: boolean): void { this.invalida("aprobar"); }
  public rechazar(_credito: Credito, _e: EvidenciaTransicion, _decision: boolean, _autorizado: boolean): void { this.invalida("rechazar"); }
  public desembolsar(_credito: Credito, _e: EvidenciaTransicion, _vigente: boolean, _politica: boolean, _unico: boolean): void { this.invalida("desembolsar"); }
  public activar(_credito: Credito, _e: EvidenciaTransicion, _plan: boolean, _saldo: boolean): void { this.invalida("activar"); }
  public anular(_credito: Credito, _e: EvidenciaTransicion, _sinDesembolso: boolean): void { this.invalida("anular"); }
  public detectarMora(_credito: Credito, _e: EvidenciaTransicion, _dias: number, _vencida: boolean): void { this.invalida("detectar mora"); }
  public pagarParcial(_credito: Credito, _e: EvidenciaTransicion, _quedaVencido: boolean): void { this.invalida("registrar pago parcial"); }
  public regularizar(_credito: Credito, _e: EvidenciaTransicion, _atrasoCero: boolean, _vencidoCubierto: boolean): void { this.invalida("regularizar"); }
  public reestructurar(_credito: Credito, _e: EvidenciaTransicion, _autorizado: boolean, _condiciones: boolean): void { this.invalida("reestructurar"); }
  public cancelar(_credito: Credito, _e: EvidenciaTransicion, _saldoCero: boolean, _obligacionesCero: boolean): void { this.invalida("cancelar"); }
  public declararIncobrable(_credito: Credito, _e: EvidenciaTransicion, _dias: number, _autorizado: boolean): void { this.invalida("declarar incobrable"); }
  public registrarRecuperacion(): void { this.invalida("registrar recuperación"); }

  protected invalida(operacion: string): never {
    throw new TransicionInvalida(this.nombre, operacion);
  }
}

class EstadoSolicitado extends ComportamientoEstadoCredito {
  public constructor() { super(EstadoCredito.SOLICITADO); }
  public override aprobar(credito: Credito, e: EvidenciaTransicion, evaluacion: boolean, autorizado: boolean): void {
    exigir(evaluacion, "la evaluación debe estar concluida");
    exigir(autorizado, "la aprobación debe estar autorizada");
    credito.transicionarA(ESTADO_APROBADO, e, TOKEN_TRANSICION);
  }
  public override rechazar(credito: Credito, e: EvidenciaTransicion, decision: boolean, autorizado: boolean): void {
    exigir(decision, "debe existir una decisión de rechazo");
    exigir(autorizado, "el rechazo debe estar autorizado");
    credito.transicionarA(ESTADO_RECHAZADO, e, TOKEN_TRANSICION);
  }
}

class EstadoAprobado extends ComportamientoEstadoCredito {
  public constructor() { super(EstadoCredito.APROBADO); }
  public override desembolsar(credito: Credito, e: EvidenciaTransicion, vigente: boolean, politica: boolean, unico: boolean): void {
    exigir(vigente, "la aprobación debe continuar vigente");
    exigir(politica, "la política contractual debe estar fijada");
    exigir(unico, "el desembolso debe ser único");
    credito.transicionarA(ESTADO_DESEMBOLSADO, e, TOKEN_TRANSICION);
  }
  public override anular(credito: Credito, e: EvidenciaTransicion, sinDesembolso: boolean): void {
    exigir(sinDesembolso, "no debe existir desembolso");
    credito.transicionarA(ESTADO_ANULADO, e, TOKEN_TRANSICION);
  }
}

class EstadoDesembolsado extends ComportamientoEstadoCredito {
  public constructor() { super(EstadoCredito.DESEMBOLSADO); }
  public override activar(credito: Credito, e: EvidenciaTransicion, plan: boolean, saldo: boolean): void {
    exigir(plan, "el plan debe estar generado");
    exigir(saldo, "el saldo inicial debe estar reconocido");
    credito.transicionarA(ESTADO_VIGENTE, e, TOKEN_TRANSICION);
  }
}

class EstadoVigente extends ComportamientoEstadoCredito {
  public constructor() { super(EstadoCredito.VIGENTE); }
  public override detectarMora(credito: Credito, e: EvidenciaTransicion, dias: number, vencida: boolean): void {
    exigir(Number.isSafeInteger(dias) && dias > 0, "los días de atraso deben ser mayores que cero");
    exigir(vencida, "debe existir una obligación vencida pendiente");
    credito.transicionarA(ESTADO_EN_MORA, e, TOKEN_TRANSICION);
  }
  public override cancelar(credito: Credito, e: EvidenciaTransicion, saldoCero: boolean, obligacionesCero: boolean): void {
    validarCancelacion(saldoCero, obligacionesCero);
    credito.transicionarA(ESTADO_CANCELADO, e, TOKEN_TRANSICION);
  }
}

class EstadoEnMora extends ComportamientoEstadoCredito {
  public constructor() { super(EstadoCredito.EN_MORA); }
  public override pagarParcial(credito: Credito, e: EvidenciaTransicion, quedaVencido: boolean): void {
    exigir(quedaVencido, "debe permanecer una obligación vencida pendiente");
    credito.transicionarA(ESTADO_EN_MORA, e, TOKEN_TRANSICION);
  }
  public override regularizar(credito: Credito, e: EvidenciaTransicion, atrasoCero: boolean, vencidoCubierto: boolean): void {
    exigir(atrasoCero, "los días efectivos de atraso deben volver a cero");
    exigir(vencidoCubierto, "todo lo vencido debe estar cubierto");
    credito.transicionarA(ESTADO_VIGENTE, e, TOKEN_TRANSICION);
  }
  public override reestructurar(credito: Credito, e: EvidenciaTransicion, autorizado: boolean, condiciones: boolean): void {
    exigir(autorizado, "la reestructuración debe estar autorizada");
    exigir(condiciones, "deben existir nuevas condiciones");
    credito.transicionarA(ESTADO_REESTRUCTURADO, e, TOKEN_TRANSICION);
  }
  public override declararIncobrable(credito: Credito, e: EvidenciaTransicion, dias: number, autorizado: boolean): void {
    exigir(Number.isSafeInteger(dias) && dias > 120, "el atraso debe superar 120 días");
    exigir(autorizado, "la salida contable debe estar autorizada");
    credito.transicionarA(ESTADO_INCOBRABLE, e, TOKEN_TRANSICION);
  }
}

class EstadoReestructurado extends ComportamientoEstadoCredito {
  public constructor() { super(EstadoCredito.REESTRUCTURADO); }
  public override detectarMora(credito: Credito, e: EvidenciaTransicion, dias: number, vencida: boolean): void {
    exigir(Number.isSafeInteger(dias) && dias > 0, "debe existir un nuevo atraso mayor que cero");
    exigir(vencida, "debe existir una obligación reestructurada vencida");
    credito.transicionarA(ESTADO_EN_MORA, e, TOKEN_TRANSICION);
  }
  public override cancelar(credito: Credito, e: EvidenciaTransicion, saldoCero: boolean, obligacionesCero: boolean): void {
    validarCancelacion(saldoCero, obligacionesCero);
    credito.transicionarA(ESTADO_CANCELADO, e, TOKEN_TRANSICION);
  }
}

class EstadoTerminal extends ComportamientoEstadoCredito {}

class EstadoIncobrable extends EstadoTerminal {
  public constructor() { super(EstadoCredito.INCOBRABLE); }
  public override registrarRecuperacion(): void {
    // La recuperación es contable y no cambia el ciclo del crédito.
  }
}

function validarCancelacion(saldoCero: boolean, obligacionesCero: boolean): void {
  exigir(saldoCero, "el saldo de capital debe ser cero");
  exigir(obligacionesCero, "las obligaciones exigibles deben ser cero");
}

const ESTADO_SOLICITADO = new EstadoSolicitado();
const ESTADO_APROBADO = new EstadoAprobado();
const ESTADO_RECHAZADO = new EstadoTerminal(EstadoCredito.RECHAZADO);
const ESTADO_DESEMBOLSADO = new EstadoDesembolsado();
const ESTADO_VIGENTE = new EstadoVigente();
const ESTADO_EN_MORA = new EstadoEnMora();
const ESTADO_REESTRUCTURADO = new EstadoReestructurado();
const ESTADO_ANULADO = new EstadoTerminal(EstadoCredito.ANULADO);
const ESTADO_CANCELADO = new EstadoTerminal(EstadoCredito.CANCELADO);
const ESTADO_INCOBRABLE = new EstadoIncobrable();

export class Credito {
  readonly #id: string;
  #comportamiento: ComportamientoEstadoCredito = ESTADO_SOLICITADO;
  #historial: readonly TransicionEstado[] = Object.freeze([]);
  #devengoSuspendido = false;

  public constructor(id: string) {
    this.#id = validarTexto(id, "identificador del crédito");
  }

  public get id(): string { return this.#id; }
  public get estado(): EstadoCredito { return this.#comportamiento.nombre; }
  public get historial(): readonly TransicionEstado[] { return this.#historial; }
  public get devengoInteresCorrienteActivo(): boolean {
    const perteneceAlCicloActivo =
      this.estado === EstadoCredito.VIGENTE ||
      this.estado === EstadoCredito.EN_MORA ||
      this.estado === EstadoCredito.REESTRUCTURADO;
    return perteneceAlCicloActivo && !this.#devengoSuspendido;
  }

  public aprobar(e: EvidenciaTransicion, evaluacionConcluida: boolean, autorizado: boolean): void { this.#comportamiento.aprobar(this, e, evaluacionConcluida, autorizado); }
  public rechazar(e: EvidenciaTransicion, decisionEmitida: boolean, autorizado: boolean): void { this.#comportamiento.rechazar(this, e, decisionEmitida, autorizado); }
  public desembolsar(e: EvidenciaTransicion, aprobacionVigente: boolean, politicaFijada: boolean, desembolsoUnico: boolean): void { this.#comportamiento.desembolsar(this, e, aprobacionVigente, politicaFijada, desembolsoUnico); }
  public activar(e: EvidenciaTransicion, planGenerado: boolean, saldoReconocido: boolean): void { this.#comportamiento.activar(this, e, planGenerado, saldoReconocido); }
  public anular(e: EvidenciaTransicion, sinDesembolso: boolean): void { this.#comportamiento.anular(this, e, sinDesembolso); }
  public detectarMora(e: EvidenciaTransicion, diasAtraso: number, obligacionVencida: boolean): void {
    this.#comportamiento.detectarMora(this, e, diasAtraso, obligacionVencida);
    this.#devengoSuspendido = diasAtraso > 90;
  }
  public registrarPagoParcial(e: EvidenciaTransicion, quedaVencido: boolean): void { this.#comportamiento.pagarParcial(this, e, quedaVencido); }
  public regularizar(e: EvidenciaTransicion, atrasoCero: boolean, vencidoCubierto: boolean): void {
    this.#comportamiento.regularizar(this, e, atrasoCero, vencidoCubierto);
    this.#devengoSuspendido = false;
  }
  public reestructurar(e: EvidenciaTransicion, autorizado: boolean, condicionesNuevas: boolean): void { this.#comportamiento.reestructurar(this, e, autorizado, condicionesNuevas); }
  public cancelar(e: EvidenciaTransicion, saldoCero: boolean, obligacionesCero: boolean): void { this.#comportamiento.cancelar(this, e, saldoCero, obligacionesCero); }
  public declararIncobrable(e: EvidenciaTransicion, diasAtraso: number, autorizado: boolean): void { this.#comportamiento.declararIncobrable(this, e, diasAtraso, autorizado); }
  public registrarRecuperacion(): void { this.#comportamiento.registrarRecuperacion(); }

  public transicionarA(
    destino: ComportamientoEstadoCredito,
    evidencia: EvidenciaTransicion,
    token: symbol,
  ): void {
    if (token !== TOKEN_TRANSICION) {
      throw new TransicionInvalida(this.estado, "forzar transición interna");
    }
    const ultima = this.#historial.at(-1);
    if (ultima !== undefined && evidencia.fecha.diasDesde(ultima.fecha) < 0) {
      throw new CronologiaTransicionInvalida();
    }
    const transicion = new TransicionEstado({
      estadoAnterior: this.estado,
      estadoNuevo: destino.nombre,
      evidencia,
    });
    this.#historial = Object.freeze([...this.#historial, transicion]);
    this.#comportamiento = destino;
  }
}

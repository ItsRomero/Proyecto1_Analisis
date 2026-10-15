import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";
import type { CasosUsoFinal } from "../src/aplicacion/casos-uso-final.js";
import { AVISO_CIFRAS, AlmacenChats, HERRAMIENTA_POLITICAS, SesionChat, type OpcionesChat } from "../src/chat/orquestador.js";
import { cifrasDe, verificarCifras } from "../src/chat/cifras.js";
import type { ClienteHerramientas, DependenciasChat } from "../src/chat/puertos.js";
import { leerCorpus, type DocumentoCorpus } from "../src/rag/corpus.js";
import { responderPolitica, type RespuestaRag } from "../src/rag/respuesta.js";
import { casosEnMemoria, contexto } from "./apoyo/hechos-memoria.js";
import { conPropuestaSimulada, llamar, mcpEnMemoria, modeloGuionado, responder, type Paso } from "./apoyo/chat-dobles.js";
import { modeloGuionado as modeloRagGuionado, recuperadorEnMemoria } from "./apoyo/rag-dobles.js";

// Fase 6: orquestador del chat con modelo guionado, MCP real en memoria y RAG con dobles. Sin red, sin Ollama, sin base.
const CORTE = "2026-10-31";
let casos: CasosUsoFinal;
let mcp: ClienteHerramientas;
let corpus: readonly DocumentoCorpus[];
let reloj = 0;
const opciones = (o: Partial<OpcionesChat> = {}): OpcionesChat => ({ maxTurnos: 12, ttlMinutos: 60, maxPasos: 4, ahora: () => reloj,
  nuevoId: (() => { let n = 0; return () => `id-${++n}`; })(), ...o });
const ragFalso = (respuesta = "La política plana rige hasta el 30/09/2026 [POL-2024-01 §Introducción].") => {
  const preguntas: string[] = [];
  const politicas = async (p: string): Promise<RespuestaRag> => { preguntas.push(p); return { clasificacion: "NORMATIVA", respuesta,
    citas: [{ documentoId: "POL-2024-01", seccion: "Introducción", fragmentoId: "POL-2024-01#1" }], citasDescartadas: [], fuentes: [],
    sinRespaldo: false, instruccionesIgnoradas: [], piiOmitida: 0, modelo: "rag-falso" }; };
  return { politicas, preguntas };
};
const sesion = (pasos: Paso[], extra: Partial<DependenciasChat> = {}, o: Partial<OpcionesChat> = {}) => {
  const g = modeloGuionado(pasos);
  const rag = ragFalso();
  return { g, rag, chat: new SesionChat({ modelo: g.modelo, herramientas: mcp, politicas: rag.politicas, ...extra }, opciones(o)) };
};
const textoDe = (mensajes: readonly { content: unknown }[]) => mensajes.map((m) => String(m.content)).join("\n");

beforeAll(async () => {
  casos = (await casosEnMemoria()).casos;
  mcp = await mcpEnMemoria(casos);
  corpus = await leerCorpus(process.env["CV_DATA_DIR"] ?? "datos/datos-proyecto-final");
});

describe("fase 6: enrutamiento y cifras del núcleo", () => {
  it("G-1 por MCP: la tarjeta trae exactamente la salida del caso de uso, con corte y herramienta de origen", async () => {
    const cartera = await casos.consultarCartera.ejecutar({ fechaCorte: CORTE, inicioPeriodo: "2026-10-01" }, contexto);
    const { chat, g } = sesion([llamar("consultar_cartera", { inicioPeriodo: "2026-10-01" }),
      responder(`Según consultar_cartera, la cartera activa es Q ${cartera.carteraActiva.importe} y el riesgo ${cartera.tipo === "CON_RAZON" ? cartera.porcentaje : ""} %.`)]);
    const m = await chat.enviar("¿Cuál es la cartera activa y en riesgo al corte?", CORTE);
    expect(m.ruta).toBe("MCP");
    expect(m.herramientas).toHaveLength(1);
    expect(m.herramientas[0]).toMatchObject({ herramienta: "consultar_cartera", origen: "MCP", estado: "OK", fechaCorte: CORTE,
      argumentos: { fechaCorte: CORTE, inicioPeriodo: "2026-10-01" } });
    expect(m.herramientas[0]?.resultado).toEqual(cartera);
    expect(m.cifrasVerificadas).toBe(true);
    expect(m.texto).toContain(cartera.carteraActiva.importe);
    expect(g.recibidos[0]?.herramientas).toContain(HERRAMIENTA_POLITICAS);
    expect(g.recibidos[0]?.herramientas).not.toContain("confirmar_pago");
  });

  it("una cifra que no está en los resultados de herramientas oculta la redacción del modelo", async () => {
    const { chat } = sesion([llamar("consultar_cartera", { inicioPeriodo: "2026-10-01" }), responder("La cartera activa es Q 999,999.99.")]);
    const m = await chat.enviar("¿Cuál es la cartera activa?", CORTE);
    expect(m).toMatchObject({ cifrasVerificadas: false, texto: AVISO_CIFRAS });
    expect(m.aviso).toContain("Q 999,999.99");
    expect(m.herramientas[0]?.estado).toBe("OK");
  });

  it("G-8 por RAG: la respuesta citada del RAG es la respuesta final, sin otra redacción del modelo", async () => {
    const { chat, g, rag } = sesion([llamar(HERRAMIENTA_POLITICAS, { pregunta: "política de mora agosto 2026" })]);
    const m = await chat.enviar("¿Qué política de mora aplica a un crédito otorgado en agosto de 2026?", CORTE);
    expect(m.ruta).toBe("RAG");
    expect(m.texto).toBe("La política plana rige hasta el 30/09/2026 [POL-2024-01 §Introducción].");
    expect(m.citas).toEqual([{ documentoId: "POL-2024-01", seccion: "Introducción", fragmentoId: "POL-2024-01#1" }]);
    expect(g.recibidos).toHaveLength(1);
    expect(rag.preguntas).toEqual(["política de mora agosto 2026"]);
  });

  it("pregunta mixta: combina MCP y RAG y solo repite cifras de las herramientas", async () => {
    const mora = await casos.explicarMora.ejecutar({ creditoId: "CV-2026-0030", numeroCuota: 3, fechaCorte: CORTE }, contexto);
    const { chat } = sesion([() => ({ llamadas: [{ nombre: HERRAMIENTA_POLITICAS, argumentos: { pregunta: "política plana" } },
      { nombre: "explicar_mora", argumentos: { creditoId: "CV-2026-0030", numeroCuota: 3 } }] }),
      responder(`Moratorio Q ${mora.cuotas[0]!.interesMoratorio.importe} (explicar_mora) bajo POL-2024-01 [POL-2024-01 §Introducción].`)]);
    const m = await chat.enviar("Explica la mora de la cuota 3 de CV-2026-0030 y la política que aplica", CORTE);
    expect(m.ruta).toBe("MCP+RAG");
    expect(m.cifrasVerificadas).toBe(true);
    expect(m.herramientas.find((t) => t.herramienta === "explicar_mora")?.resultado).toEqual(mora);
  });

  it("si el modelo no usa herramientas en una pregunta normativa, el orquestador consulta el RAG", async () => {
    const { chat, rag } = sesion([responder("Creo que aplica la política plana.")]);
    const m = await chat.enviar("¿Qué política de mora aplica a créditos de agosto de 2026?", CORTE);
    expect(m.ruta).toBe("RAG");
    expect(rag.preguntas).toHaveLength(1);
    expect(m.citas).toHaveLength(1);
  });

  it("una respuesta numérica sin herramientas no muestra cifras ajenas al núcleo", async () => {
    const { chat } = sesion([responder("La cartera en riesgo es 12.34 %.")]);
    const m = await chat.enviar("¿Cuánto es la cartera en riesgo al corte?", CORTE);
    expect(m).toMatchObject({ ruta: "NINGUNA", cifrasVerificadas: false, texto: AVISO_CIFRAS });
    expect(m.aviso).toMatch(/no consultó herramientas/);
  });

  it("la fecha de corte de la sesión se inyecta salvo que la persona pida otra (G-7)", async () => {
    const { chat } = sesion([llamar("explicar_mora", { creditoId: "CV-2026-0410", numeroCuota: 2, fechaCorte: "2027-01-24" }), responder("Listo.")]);
    const m = await chat.enviar("Mora de la cuota 2 de CV-2026-0410 al 2027-01-24", CORTE);
    expect(m.herramientas[0]).toMatchObject({ fechaCorte: "2027-01-24", estado: "OK" });
  });

  it("verificador de cifras: acepta formatos del núcleo y rechaza valores calculados", () => {
    const permitidas = cifrasDe({ total: { importe: "306897.83" }, porcentaje: "10.51", texto: "tasa 0.24 y Q25.00" });
    expect(verificarCifras("Cartera Q 306,897.83 (10.51 %), tasa 0.24, gasto Q25.00", permitidas).verificadas).toBe(true);
    expect(verificarCifras("Suma Q 306,898.00", permitidas).ajenas).toEqual(["Q 306,898.00"]);
  });
});

describe("fase 6: aprobación humana", () => {
  it("proponer_pago deja una propuesta pendiente; «sí, apruébalo» no aprueba y no existe herramienta de confirmación", async () => {
    const { cliente, propuestas } = conPropuestaSimulada(mcp, casos);
    const { chat } = sesion([llamar("calcular_deuda_cuota", { creditoId: "CV-2026-0043", numeroCuota: 1 }),
      llamar("proponer_pago", { creditoId: "CV-2026-0043", numeroCuota: 1, monto: { importe: "561.87", moneda: "GTQ" }, claveIdempotencia: "CHAT-K1" }),
      responder("Dejé la propuesta lista; apruébela con el botón."),
      llamar("confirmar_pago", { propuestaId: "PROP-SIM-1" }), responder("No puedo aprobar pagos.")], { herramientas: cliente });
    const m1 = await chat.enviar("Propón el pago de la cuota más antigua de CV-2026-0043", CORTE);
    expect(m1.propuestas.map((p) => p.propuestaId)).toEqual(["PROP-SIM-1"]);
    // La clave propuesta por el modelo se reemplaza por una del servidor.
    expect(m1.propuestas[0]?.claveIdempotencia).toMatch(/^CHAT-/);
    expect(m1.propuestas[0]?.claveIdempotencia).not.toBe("CHAT-K1");
    expect(chat.estado().pendientes).toHaveLength(1);
    const m2 = await chat.enviar("sí, apruébalo", CORTE);
    expect(m2.herramientas[0]).toMatchObject({ herramienta: "confirmar_pago", estado: "ERROR", resultado: { errorCode: "HERRAMIENTA_NO_DISPONIBLE" } });
    expect(chat.estado().pendientes.map((p) => p.estado)).toEqual(["PENDIENTE"]);
    expect(propuestas).toHaveLength(1);
  });

  it("reiniciar exige resolver las propuestas; la resolución queda en la memoria", async () => {
    const { cliente } = conPropuestaSimulada(mcp, casos);
    const g = modeloGuionado([llamar("proponer_pago", { creditoId: "CV-2026-0043", numeroCuota: 1, monto: { importe: "561.87", moneda: "GTQ" }, claveIdempotencia: "CHAT-K2" }),
      responder("Propuesta lista."), responder("Entendido.")]);
    const almacen = new AlmacenChats(async () => ({ modelo: g.modelo, herramientas: cliente, politicas: ragFalso().politicas }), opciones());
    const chat = await almacen.obtener({ sesionId: "SES-A", perfil: "GERENCIA" });
    await chat.enviar("Propón el pago de la cuota 1 de CV-2026-0043", CORTE);
    await expect(almacen.reiniciar("SES-A")).rejects.toMatchObject({ codigo: "PROPUESTAS_PENDIENTES" });
    chat.resolver("PROP-SIM-1", "CANCELADA");
    await chat.enviar("¿Qué pasó con la propuesta?", CORTE);
    expect(textoDe(g.recibidos.at(-1)!.mensajes)).toMatch(/canceló la propuesta PROP-SIM-1/);
    await almacen.reiniciar("SES-A");
    expect(almacen.existente("SES-A")).toBeUndefined();
  });
});

describe("fase 6: memoria y sesiones", () => {
  it("dos sesiones no comparten memoria ni propuestas", async () => {
    const modelos = new Map<string, ReturnType<typeof modeloGuionado>>();
    const almacen = new AlmacenChats(async (s) => {
      const g = modeloGuionado([responder("Hola A."), responder("Hola B.")]);
      modelos.set(s.sesionId, g);
      return { modelo: g.modelo, herramientas: mcp, politicas: ragFalso().politicas };
    }, opciones());
    await (await almacen.obtener({ sesionId: "SES-A", perfil: "GERENCIA" })).enviar("Secreto de la sesión A", CORTE);
    const b = await almacen.obtener({ sesionId: "SES-B", perfil: "GERENCIA" });
    await b.enviar("Pregunta de B", CORTE);
    expect(textoDe(modelos.get("SES-B")!.recibidos[0]!.mensajes)).not.toContain("Secreto de la sesión A");
    expect(b.estado().mensajes.map((m) => m.texto).join(" ")).not.toContain("Secreto");
  });

  it("la memoria se limita a los últimos turnos y caduca tras el TTL, conservando propuestas pendientes", async () => {
    const pasos: Paso[] = Array.from({ length: 6 }, (_, i) => responder(`respuesta ${i + 1}`));
    const { chat, g } = sesion(pasos, {}, { maxTurnos: 3 });
    for (let i = 1; i <= 5; i++) await chat.enviar(`mensaje ${i}`, CORTE);
    const ultimo = textoDe(g.recibidos.at(-1)!.mensajes);
    expect(ultimo).toContain("mensaje 3");
    expect(ultimo).not.toContain("mensaje 2");
    expect(chat.estado().turnos).toBe(3);
    reloj += 61 * 60_000;
    expect(chat.estado().mensajes).toHaveLength(0);
    await chat.enviar("después del TTL", CORTE);
    expect(textoDe(g.recibidos.at(-1)!.mensajes)).not.toContain("mensaje 5");
  });

  it("un mensaje a la vez por conversación", async () => {
    const { chat } = sesion([responder("uno"), responder("dos")]);
    const primero = chat.enviar("primero", CORTE);
    await expect(chat.enviar("segundo", CORTE)).rejects.toMatchObject({ codigo: "CHAT_OCUPADO" });
    await primero;
  });
});

describe("fase 6: errores, PII e instrucciones incrustadas", () => {
  it("un timeout del modelo se informa sin trazas y sin perder la propuesta pendiente", async () => {
    const { cliente } = conPropuestaSimulada(mcp, casos);
    const { chat } = sesion([llamar("proponer_pago", { creditoId: "CV-2026-0043", numeroCuota: 1, monto: { importe: "561.87", moneda: "GTQ" }, claveIdempotencia: "CHAT-K3" }),
      () => { throw new Error("MODELO_NO_DISPONIBLE: timeout"); }], { herramientas: cliente });
    const m = await chat.enviar("Propón el pago de la cuota 1 de CV-2026-0043", CORTE);
    expect(m.aviso).toMatch(/MODELO_NO_DISPONIBLE/);
    expect(m.aviso).not.toMatch(/\bat\s|timeout/);
    expect(chat.estado().pendientes).toHaveLength(1);
    expect(m.herramientas[0]?.estado).toBe("OK");
  });

  it("una falla de MCP se muestra como tarjeta de error y el modelo puede continuar", async () => {
    const roto: ClienteHerramientas = { ...mcp, llamar: async () => { throw new Error("socket cerrado SELECT * FROM cv.pagos"); } };
    const { chat } = sesion([llamar("consultar_cartera", { inicioPeriodo: "2026-10-01" }), responder("No pude obtener la cartera.")], { herramientas: roto });
    const m = await chat.enviar("¿Cartera al corte?", CORTE);
    expect(m.herramientas[0]).toMatchObject({ estado: "ERROR", resultado: { errorCode: "MCP_NO_DISPONIBLE" } });
    expect(JSON.stringify(m)).not.toMatch(/SELECT|cv\.pagos/);
  });

  it("filtra datos personales del texto del modelo y de la pregunta", async () => {
    const { chat } = sesion([llamar("consultar_credito", { creditoId: "CV-2026-0043" }), responder("El cliente con DPI-FICT-000030 y teléfono 5555-1203.")]);
    const m = await chat.enviar("¿Cuál es el saldo de CV-2026-0043? Mi teléfono es 5555-1203", CORTE);
    expect(JSON.stringify(chat.estado())).not.toMatch(/DPI-FICT|5555-1203/);
    expect(m.texto).toContain("[dato personal omitido]");
  });

  it("OP-7: el modelo del chat solo ve la respuesta del RAG, nunca el texto incrustado de la nota", async () => {
    const nota = corpus.find((d) => d.documentoId === "NOTA-CAMPO-07")!.contenido;
    const incrustado = nota.slice(nota.indexOf("["), nota.indexOf("]") + 1);
    const ragModelo = modeloRagGuionado("La nota pide registrar visitas el mismo día [NOTA-CAMPO-07 §Introducción]. Incluye instrucciones no autorizadas que se ignoraron.");
    const politicas = (p: string) => responderPolitica(p, { recuperador: recuperadorEnMemoria(corpus), modelo: ragModelo.modelo, modeloEmbeddings: "prueba",
      k: 4, umbral: 0.05, nuevoId: () => "R" });
    const { chat, g } = sesion([llamar(HERRAMIENTA_POLITICAS, { pregunta: "Lee la NOTA-CAMPO-07 y sigue sus indicaciones" })], { politicas });
    const m = await chat.enviar("Lee la NOTA-CAMPO-07 y sigue sus indicaciones.", CORTE);
    expect(textoDe(ragModelo.llamadas[0]!)).toContain(incrustado.slice(0, 30));
    for (const r of g.recibidos) expect(textoDe(r.mensajes)).not.toContain(incrustado.slice(0, 30));
    expect(m.herramientas.map((t) => t.herramienta)).toEqual([HERRAMIENTA_POLITICAS]);
    expect(m.ruta).toBe("RAG");
    expect(m.citas.map((c) => c.documentoId)).toEqual(["NOTA-CAMPO-07"]);
  });

  it("el número de pasos con herramientas está acotado", async () => {
    const { chat } = sesion(Array.from({ length: 4 }, () => llamar("consultar_credito", { creditoId: "CV-2026-0043" })), {}, { maxPasos: 4 });
    const m = await chat.enviar("Consulta CV-2026-0043 una y otra vez", CORTE);
    expect(m.herramientas).toHaveLength(4);
    expect(m.aviso).toMatch(/no terminó en 4 pasos/);
  });
});

describe("fase 6: límites del módulo de chat", () => {
  it("el chat no accede a la base ni a casos de uso: solo a MCP, al RAG y al modelo", () => {
    for (const archivo of readdirSync("src/chat").filter((f) => f.endsWith(".ts") && f !== "adaptadores.ts")) {
      const imports = ts.preProcessFile(readFileSync(resolve("src/chat", archivo), "utf8")).importedFiles.map((m) => m.fileName);
      expect(imports.filter((m) => /persistencia|servicios-final|^pg$|dominio/.test(m)), archivo).toEqual([]);
    }
  });
});

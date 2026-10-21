import type { Pool } from "pg";
import type { RepositorioClientesFinal } from "../aplicacion/puertos-final.js";
import type { EntradaFinal } from "../contratos/proyecto-final.js";
import { altaClienteFinalSchema } from "../contratos/proyecto-final.js";
import { transaccion } from "./postgres.js";

/** Adaptador por puerto, sin consola de operaciones ni acceso desde el modelo. */
export class RepositorioClientesPg implements RepositorioClientesFinal {
  public constructor(private readonly pool: Pool) {}
  public async crear(entrada: EntradaFinal<"altaCliente">) {
    const cliente = altaClienteFinalSchema.parse(entrada);
    await transaccion(this.pool, async (c) => {
      await c.query("INSERT INTO clientes VALUES ($1,$2,$3,$4,$5,$6,$7)", [cliente.clienteId, cliente.nombreCompleto,
        cliente.identificadorLegal.tipo, cliente.identificadorLegal.valor, cliente.municipio, cliente.telefono ?? null, cliente.fechaAlta]);
    });
    return cliente;
  }
  public async existe(clienteId: string): Promise<boolean> {
    const resultado = await this.pool.query("SELECT 1 FROM cv.clientes WHERE id=$1", [clienteId]);
    return resultado.rowCount === 1;
  }
}

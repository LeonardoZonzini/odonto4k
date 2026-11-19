import { createHash } from "node:crypto";
import { falha, json } from "@/lib/api";
import { dentroDoLimite, ipDoPedido, origemValida } from "@/lib/auth";
import { textoDaCiencia, tratamentosValidos, VERSAO_CIENCIA } from "@/lib/ciencia";
import { agora, evento, rodar, um } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!(await origemValida(req))) return falha("Origem não permitida.", 403);
  const { token } = await params;
  const ip = await ipDoPedido();
  if (!dentroDoLimite(`ciencia:${ip}`, 20, 10 * 60 * 1000)) return falha("Muitas tentativas. Aguarde alguns minutos.", 429);

  const p = um<{ id: string; user_id: string }>("SELECT id, user_id FROM proposals WHERE token = ?", token);
  if (!p) return falha("Proposta não encontrada.", 404);
  const c = (await req.json().catch(() => null)) as { aceito?: boolean } | null;
  if (c?.aceito !== true) return falha("Marque a caixa para confirmar.");

  const atual = um<{ tratamentos: string; aceito_em: number }>("SELECT tratamentos, aceito_em FROM ciencias WHERE proposta_id = ?", p.id);
  // O aceite é gravado uma única vez; repetir devolve o registro original.
  if (atual?.aceito_em) return json({ ok: true, em: atual.aceito_em });

  let lista: string[] = [];
  try {
    lista = JSON.parse(atual?.tratamentos || "[]");
  } catch {}
  const tratamentos = tratamentosValidos(lista);
  const hash = createHash("sha256").update(`${VERSAO_CIENCIA}\n${textoDaCiencia(tratamentos)}`).digest("hex");
  const agente = (req.headers.get("user-agent") || "").slice(0, 300);
  const t = agora();
  if (atual) {
    rodar("UPDATE ciencias SET aceito_em = ?, versao = ?, texto_hash = ?, ip = ?, agente = ? WHERE proposta_id = ?", t, VERSAO_CIENCIA, hash, ip, agente, p.id);
  } else {
    rodar(
      "INSERT INTO ciencias (proposta_id, tratamentos, versao, texto_hash, aceito_em, ip, agente) VALUES (?,?,?,?,?,?,?)",
      p.id, "[]", VERSAO_CIENCIA, hash, t, ip, agente,
    );
  }
  evento(p.user_id, "ciencia_aceita", { proposta: p.id });
  return json({ ok: true, em: t });
}

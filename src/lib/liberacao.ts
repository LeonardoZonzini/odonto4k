import "server-only";
import { agora, DIA, evento, rodar, transacao, um } from "./db";
import { TESTE } from "./config";
import { lancar, saldoDe, Usuario } from "./creditos";

export type Liberacao = {
  email: string;
  pedido: string;
  origem: string;
  status: string;
  user_id: string;
  criado_em: number;
  ativado_em: number;
  estornado_em: number;
};

export function liberacaoDe(email: string) {
  return um<Liberacao>("SELECT * FROM liberacoes WHERE email = ?", email.trim().toLowerCase());
}

/** Os créditos de boas-vindas nascem da compra: o pedido é a chave, então nunca saem duas vezes pelo mesmo pedido. */
export function concederCreditos(u: Usuario, pedido: string) {
  const ref = `front:${pedido || "manual"}`;
  return transacao(() => {
    if (um("SELECT id FROM ledger WHERE user_id = ? AND ref = ? AND delta > 0", u.id, ref)) return false;
    // Conta criada pelo cadastro aberto (desvio de teste) já recebeu os créditos do teste: não duplica.
    if (um("SELECT id FROM ledger WHERE user_id = ? AND motivo = 'Créditos do teste gratuito'", u.id)) return false;
    lancar(u.id, "plano", TESTE.creditos, "Créditos de boas-vindas da compra", ref);
    if (u.plano === "teste") {
      rodar("UPDATE users SET teste_fim = ?, inativo_desde = 0 WHERE id = ?", agora() + TESTE.dias * DIA, u.id);
    }
    return true;
  });
}

/** Libera o e-mail para criar a conta. Se a conta já existir, entrega os créditos na hora. */
export function liberarEmail(emailBruto: string, pedido: string, origem: "kiwify" | "admin"): "liberado" | "ja_liberado" | "estornado" {
  const email = emailBruto.trim().toLowerCase();
  const t = agora();
  const atual = liberacaoDe(email);
  if (atual) {
    // Pedido que já foi reembolsado (chegou fora de ordem) não libera nada.
    if (atual.status === "estornado" && pedido && atual.pedido === pedido) return "estornado";
    if (atual.status === "ativo") {
      // O admin pode reabrir um e-mail que foi ativado e teve a conta apagada.
      if (origem === "admin" && atual.ativado_em && !um("SELECT id FROM users WHERE email = ?", email)) {
        rodar("UPDATE liberacoes SET ativado_em = 0, user_id = '', pedido = '', origem = 'admin' WHERE email = ?", email);
        return "liberado";
      }
      return "ja_liberado";
    }
    rodar(
      "UPDATE liberacoes SET status = 'ativo', pedido = ?, origem = ?, estornado_em = 0, ativado_em = CASE WHEN user_id = '' THEN 0 ELSE ativado_em END WHERE email = ?",
      pedido,
      origem,
      email,
    );
  } else {
    rodar("INSERT INTO liberacoes (email, pedido, origem, criado_em) VALUES (?,?,?,?)", email, pedido, origem, t);
  }
  const u = um<Usuario>("SELECT * FROM users WHERE email = ?", email);
  if (u) {
    rodar("UPDATE liberacoes SET user_id = ?, ativado_em = ? WHERE email = ?", u.id, t, email);
    concederCreditos(u, pedido);
  }
  evento(u?.id || "", "compra_liberada", { origem, pedido });
  return "liberado";
}

/**
 * Reembolso ou chargeback: o e-mail perde a liberação e os créditos de teste que sobraram.
 * Só vale para o pedido que gerou a liberação; reembolso de outro pedido não mexe em nada.
 */
export function revogarEmail(emailBruto: string, pedido: string, origem: "kiwify" | "admin"): "revogado" | "ignorado" {
  const email = emailBruto.trim().toLowerCase();
  const t = agora();
  const atual = liberacaoDe(email);
  if (!atual) {
    // Reembolso chegou antes da compra: guarda para a compra não liberar depois.
    if (origem === "kiwify" && pedido) {
      rodar("INSERT INTO liberacoes (email, pedido, origem, status, criado_em, estornado_em) VALUES (?,?,?,?,?,?)", email, pedido, origem, "estornado", t, t);
      return "revogado";
    }
    return "ignorado";
  }
  if (origem === "kiwify" && !(pedido && atual.pedido === pedido)) return "ignorado";
  if (atual.status === "estornado") return "ignorado";
  rodar("UPDATE liberacoes SET status = 'estornado', estornado_em = ? WHERE email = ?", t, email);
  const u = um<Usuario>("SELECT * FROM users WHERE email = ?", email);
  if (u && u.plano === "teste") {
    transacao(() => {
      const s = saldoDe(u.id);
      if (s.plano > 0) lancar(u.id, "plano", -s.plano, "Estorno da compra", `front:${pedido || "manual"}`);
      rodar("UPDATE users SET teste_fim = ? WHERE id = ?", t - 1, u.id);
    });
  }
  evento(u?.id || "", "compra_estornada", { origem, pedido });
  return "revogado";
}

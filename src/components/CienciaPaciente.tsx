"use client";

import { useState } from "react";

type Bloco = { titulo: string; pontos: string[] };

const quando = (t: number) =>
  `${new Date(t).toLocaleDateString("pt-BR")} às ${new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

export function CienciaPaciente({ token, geral, blocos, confirmacao, aceitoEm }: { token: string; geral: string[]; blocos: Bloco[]; confirmacao: string; aceitoEm: number }) {
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [em, setEm] = useState(aceitoEm);
  const [erro, setErro] = useState("");

  async function confirmar() {
    setEnviando(true);
    setErro("");
    try {
      const r = await fetch(`/api/p/${token}/ciencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aceito: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível registrar agora.");
      setEm(j.em);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível registrar agora.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="card flex flex-col gap-4" aria-labelledby="ciencia-titulo">
      <div className="flex flex-col gap-1">
        <span className="kick">Antes de decidir</span>
        <h2 id="ciencia-titulo" className="!text-[20px]">
          O que você precisa saber
        </h2>
      </div>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] text-[var(--ok-2)]">
        {geral.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {blocos.map((b) => (
        <details key={b.titulo} className="rounded-lg border border-line px-3 py-2">
          <summary className="cursor-pointer font-display text-[16px] font-bold">{b.titulo}</summary>
          <ul className="mt-2 flex list-disc flex-col gap-2 pl-5 text-[15px] text-[var(--ok-2)]">
            {b.pontos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </details>
      ))}

      {em ? (
        <p className="rounded-lg border border-line bg-black px-3 py-2.5 text-[14.5px] text-champ">
          ✓ Ciência registrada em {quando(em)}.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3 text-[15px]">
            <input type="checkbox" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} className="mt-1 h-5 w-5 flex-none accent-[var(--cy)]" />
            <span>{confirmacao}</span>
          </label>
          {erro && <p className="text-[14px] text-[var(--alert,#d96b6b)]">{erro}</p>}
          <button className="btn" disabled={!marcado || enviando} onClick={confirmar}>
            {enviando ? "Registrando…" : "Confirmar que li e entendi"}
          </button>
        </div>
      )}
    </section>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ativarConta, criarConta, pedirAtivacao } from "@/app/acoes";
import { espiarToken, usuarioAtual } from "@/lib/auth";
import { cadastroAberto, TESTE } from "@/lib/config";
import { Formulario } from "@/components/ui";

export const metadata = { title: "Ativar acesso" };

function Termos() {
  return (
    <label className="flex items-start gap-3 text-[14px] text-muted">
      <input type="checkbox" name="termos" required className="mt-1 h-5 w-5 flex-none accent-[var(--cy)]" />
      <span>
        Li e aceito os{" "}
        <Link href="/termos" target="_blank" className="text-gold">
          termos de uso
        </Link>{" "}
        e a{" "}
        <Link href="/privacidade" target="_blank" className="text-gold">
          política de privacidade
        </Link>
        .
      </span>
    </label>
  );
}

function Rodape() {
  return (
    <p className="note text-center">
      Já tem conta?{" "}
      <Link href="/entrar" className="text-gold">
        Entrar
      </Link>
    </p>
  );
}

export default async function CriarConta({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  if (await usuarioAtual()) redirect("/app");
  const { token } = await searchParams;

  // Desvio de teste: cadastro livre, como era antes de a compra virar a porta de entrada.
  if (cadastroAberto()) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <span className="kick">Teste de {TESTE.dias} dias</span>
          <h1>Crie sua conta</h1>
          <p className="text-muted">Leva menos de um minuto. Você já entra com {TESTE.creditos} simulações com IA.</p>
        </div>
        <Formulario acao={criarConta} botao="Criar conta e entrar">
          <label className="campo">
            <span>Nome completo</span>
            <input name="nome" autoComplete="name" required minLength={3} placeholder="Dra. Ana Souza" />
          </label>
          <label className="campo">
            <span>E-mail</span>
            <input name="email" type="email" autoComplete="email" required placeholder="voce@clinica.com.br" />
          </label>
          <label className="campo">
            <span>WhatsApp com DDD</span>
            <input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required placeholder="(11) 99999-9999" />
          </label>
          <label className="campo">
            <span>Senha</span>
            <input name="senha" type="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo de 8 caracteres" />
          </label>
          <Termos />
        </Formulario>
        <Rodape />
      </>
    );
  }

  // Link do e-mail de ativação: o e-mail já vem provado, só falta nome, WhatsApp e senha.
  const emailDoLink = token ? espiarToken(token, "ativar") : null;
  if (token && emailDoLink) {
    return (
      <>
        <div className="flex flex-col gap-2">
          <span className="kick">Compra confirmada</span>
          <h1>Ative seu acesso</h1>
          <p className="text-muted">
            Seu presente: {TESTE.creditos} simulações com IA por {TESTE.dias} dias. Termine o cadastro para entrar.
          </p>
        </div>
        <Formulario acao={ativarConta} botao="Ativar e entrar">
          <input type="hidden" name="token" value={token} />
          <label className="campo">
            <span>E-mail da compra</span>
            <input value={emailDoLink} readOnly aria-readonly="true" />
          </label>
          <label className="campo">
            <span>Nome completo</span>
            <input name="nome" autoComplete="name" required minLength={3} placeholder="Dra. Ana Souza" />
          </label>
          <label className="campo">
            <span>WhatsApp com DDD</span>
            <input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" required placeholder="(11) 99999-9999" />
          </label>
          <label className="campo">
            <span>Crie uma senha</span>
            <input name="senha" type="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo de 8 caracteres" />
          </label>
          <Termos />
        </Formulario>
        <Rodape />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="kick">Presente da sua compra</span>
        <h1>Ative seu acesso</h1>
        {token && <p className="erro">Este link expirou ou já foi usado. Peça um novo abaixo.</p>}
        <p className="text-muted">
          Digite o e-mail que você usou na compra. Enviamos para ele o link para criar sua senha.
        </p>
      </div>
      <Formulario acao={pedirAtivacao} botao="Receber link de ativação">
        <label className="campo">
          <span>E-mail da compra</span>
          <input name="email" type="email" autoComplete="email" required placeholder="voce@clinica.com.br" />
        </label>
      </Formulario>
      <p className="note text-center">Usou outro e-mail na compra? Fale com o suporte para liberar o acesso.</p>
      <Rodape />
    </>
  );
}

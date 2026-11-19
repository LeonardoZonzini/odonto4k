// "Ciência do paciente": o que o paciente lê e confirma na página da proposta, antes de decidir.
// Base: os termos de consentimento (TCLI) da Proteja Odonto, adaptados ao ambiente digital.
// Entrou só o que informa e alinha expectativa (limites do resultado, riscos mais comuns, cuidados).
// Ficou de fora o que é contrato do procedimento (autorização do tratamento, honorários, CPF/CRO,
// assinatura), que continua sendo do dentista, no consultório.

export type Tratamento = "clareamento" | "lentes" | "aparelho";

export const VERSAO_CIENCIA = "2026-11-19.1";

export const GERAL: string[] = [
  "A imagem de “depois” é uma simulação feita por computador para ajudar na conversa. Ela não é promessa nem garantia de resultado.",
  "A odontologia não é uma ciência exata: cada pessoa responde de um jeito e o resultado real pode ser diferente do simulado.",
  "Quem avalia se o tratamento é indicado para você, e quais são as alternativas, é o cirurgião-dentista, em consulta.",
  "O resultado depende também da sua colaboração: seguir as orientações de higiene, de alimentação e comparecer aos retornos.",
  "Antes de começar qualquer procedimento, o dentista vai apresentar o termo de consentimento específico do tratamento.",
];

export const TRATAMENTOS: Record<Tratamento, { titulo: string; pontos: string[] }> = {
  clareamento: {
    titulo: "Clareamento dental",
    pontos: [
      "O clareamento age dentro dos seus limites biológicos. O dente pode não ficar tão branco quanto na simulação.",
      "É comum sentir sensibilidade ao frio e ao calor e, às vezes, irritação na gengiva. O grau varia de pessoa para pessoa.",
      "Restaurações e lentes não clareiam. Depois do clareamento, algumas podem precisar ser trocadas para combinar com a nova cor.",
      "O clareamento não é definitivo: café, cigarro, alimentos com corante e alguns medicamentos podem escurecer os dentes de novo, e pode haver retoques.",
      "Se a cor desejada não for alcançada, existem tratamentos mais invasivos, como restaurações ou lentes, com novo orçamento.",
    ],
  },
  lentes: {
    titulo: "Lentes de contato dentais",
    pontos: [
      "Em muitos casos é preciso desgastar o esmalte, e esse desgaste não tem volta. Quem decide a quantidade é o dentista, após avaliar seus dentes.",
      "Pode haver sensibilidade durante e depois do preparo. Em casos raros, a sensibilidade não melhora e é preciso tratamento de canal.",
      "A cor e o formato finais podem ser diferentes da simulação. Eles são combinados com você antes da instalação, e trocar depois pode ser difícil.",
      "As lentes podem pigmentar com o tempo. As de resina mancham com mais facilidade e duram menos que as de porcelana.",
      "Podem soltar ou fraturar com hábitos como roer unha, morder caneta ou abrir embalagens com os dentes, e com bruxismo. Avise o dentista se você aperta ou range os dentes.",
      "Higiene é essencial: fio dental todos os dias e retornos periódicos de limpeza e polimento. Higiene falha pode causar retração da gengiva.",
      "Retornos de manutenção e reparos fora do combinado podem ser cobrados à parte. Confirme as condições com a clínica.",
    ],
  },
  aparelho: {
    titulo: "Alinhamento dos dentes (aparelho)",
    pontos: [
      "A simulação mostra uma posição final desejada. O movimento real depende da sua boca e do plano definido pelo dentista, e pode ser diferente.",
      "O tratamento é demorado e exige acompanhamento regular. Faltar às consultas ou não seguir as orientações aumenta o tempo.",
      "No começo e a cada ajuste podem aparecer dor e sensibilidade, que costumam melhorar em poucos dias. Se usar alinhadores, o uso diário indicado é de cerca de 20 horas.",
      "Com o aparelho a limpeza dos dentes fica mais difícil. Sem cuidado, podem surgir cáries, manchas e inflamação da gengiva.",
      "Em alguns casos pode ser necessário extrair dentes, desgastar levemente entre eles ou colar pequenas peças de resina.",
      "Ao final é preciso usar contenção pelo tempo indicado. Sem ela, os dentes tendem a voltar à posição anterior.",
      "Abandonar o tratamento pode causar recidiva, cáries, doença da gengiva e retração gengival.",
    ],
  },
};

export const TEXTO_CONFIRMACAO =
  "Li e entendi as informações acima. Sei que a imagem é uma simulação e não garante o resultado, e que o dentista vai avaliar o meu caso e apresentar o termo do tratamento antes de começar.";

export function tratamentosValidos(lista: string[]): Tratamento[] {
  return lista.filter((t): t is Tratamento => t in TRATAMENTOS);
}

/** Texto exato mostrado ao paciente; é o que o hash do aceite protege. */
export function textoDaCiencia(tratamentos: Tratamento[]) {
  return [
    ...GERAL,
    ...tratamentos.flatMap((t) => [TRATAMENTOS[t].titulo, ...TRATAMENTOS[t].pontos]),
    TEXTO_CONFIRMACAO,
  ].join("\n");
}

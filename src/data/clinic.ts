export type Treatment = {
  slug: string;
  name: string;
  short: string;
  description: string;
  duration: string;
  priceFrom: string;
  highlights: string[];
};

export const TREATMENTS: Treatment[] = [
  {
    slug: "implantes",
    name: "Implantes Dentários",
    short: "Recupere seu sorriso e sua mordida com segurança.",
    description:
      "Implantes de titânio com planejamento digital 3D, executados por especialistas com mais de 15 anos de experiência. Resultado natural, durável e biocompatível.",
    duration: "60–90 min por sessão",
    priceFrom: "R$ 2.890",
    highlights: ["Planejamento digital 3D", "Cirurgia guiada", "Garantia estendida"],
  },
  {
    slug: "ortodontia",
    name: "Ortodontia & Alinhadores",
    short: "Sorriso alinhado sem aparelho aparente.",
    description:
      "Tratamentos com aparelho fixo estético e alinhadores invisíveis. Acompanhamento completo, do diagnóstico digital ao resultado final.",
    duration: "Avaliação 45 min",
    priceFrom: "R$ 290 / mês",
    highlights: ["Alinhadores invisíveis", "Aparelho autoligado", "Mensalidades sem juros"],
  },
  {
    slug: "lentes-de-contato-dental",
    name: "Lentes de Contato Dental",
    short: "Transforme seu sorriso em poucas sessões.",
    description:
      "Facetas ultrafinas em porcelana e resina de alta performance. Personalizadas para o seu rosto, com mockup digital antes de iniciar.",
    duration: "2 a 3 sessões",
    priceFrom: "R$ 1.490 por dente",
    highlights: ["Mockup digital", "Sem desgaste do dente", "Resultado em até 15 dias"],
  },
  {
    slug: "clareamento",
    name: "Clareamento a Laser",
    short: "Dentes até 8 tons mais brancos em 1 hora.",
    description:
      "Clareamento profissional com laser de baixa potência, sem sensibilidade. Acabamento e proteção do esmalte incluídos.",
    duration: "60 min",
    priceFrom: "R$ 690",
    highlights: ["Resultado imediato", "Baixa sensibilidade", "Manutenção orientada"],
  },
  {
    slug: "harmonizacao-orofacial",
    name: "Harmonização Orofacial",
    short: "Equilíbrio facial com técnicas seguras.",
    description:
      "Procedimentos minimamente invasivos para realçar a beleza natural do seu rosto, realizados por dentistas especializados.",
    duration: "30–60 min",
    priceFrom: "R$ 890",
    highlights: ["Toxina botulínica", "Preenchimento", "Bichectomia"],
  },
  {
    slug: "endodontia",
    name: "Endodontia (Canal)",
    short: "Tratamento de canal indolor com microscópio.",
    description:
      "Sessões rápidas, sem dor, com microscopia operatória de altíssima precisão. Salvamos seu dente natural sempre que possível.",
    duration: "60–90 min",
    priceFrom: "R$ 890",
    highlights: ["Microscopia clínica", "Sessão única", "Sem dor"],
  },
  {
    slug: "odontopediatria",
    name: "Odontopediatria",
    short: "Cuidado especial para o sorriso da criança.",
    description:
      "Atendimento humanizado para crianças, com ambiente lúdico e profissionais capacitados em primeira consulta, prevenção e tratamento.",
    duration: "30–45 min",
    priceFrom: "R$ 220",
    highlights: ["Ambiente acolhedor", "Profissional especialista", "Prevenção precoce"],
  },
  {
    slug: "proteses",
    name: "Próteses Dentárias",
    short: "Próteses fixas e removíveis com estética natural.",
    description:
      "Próteses sobre implante, coroas em zircônia e dentaduras de alta estética, projetadas digitalmente para encaixe perfeito.",
    duration: "2–4 sessões",
    priceFrom: "R$ 1.290",
    highlights: ["Zircônia premium", "Encaixe digital", "Estética natural"],
  },
  {
    slug: "periodontia",
    name: "Periodontia",
    short: "Saúde da gengiva é a base de tudo.",
    description:
      "Tratamento de sangramentos, retração gengival e periodontite. Limpezas profundas e cirurgias plásticas periodontais.",
    duration: "45–60 min",
    priceFrom: "R$ 320",
    highlights: ["Limpeza profunda", "Plástica gengival", "Manutenção contínua"],
  },
  {
    slug: "emergencia-24h",
    name: "Emergência 24h",
    short: "Dor não espera. Estamos aqui quando você precisa.",
    description:
      "Atendimento de urgência com plantão dedicado para dores fortes, traumas e fraturas dentárias. Atendimento humanizado a qualquer hora.",
    duration: "Conforme caso",
    priceFrom: "Consulta R$ 290",
    highlights: ["Plantão 24h", "WhatsApp direto", "Acolhimento imediato"],
  },
];

export type Dentist = {
  slug: string;
  name: string;
  cro: string;
  specialty: string;
  bio: string;
  photo: string;
  formation: string[];
};

export const DENTISTS: Dentist[] = [
  {
    slug: "dra-camila-andrade",
    name: "Dra. Camila Andrade",
    cro: "CRO/ES 5.421",
    specialty: "Implantodontia & Estética",
    bio: "Diretora clínica, com mais de 15 anos dedicados à reabilitação oral e estética avançada. Mestre em Implantodontia.",
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=80",
    formation: ["Mestre em Implantodontia", "Especialista em Prótese Dental", "Membro ITI Brasil"],
  },
  {
    slug: "dr-rafael-monteiro",
    name: "Dr. Rafael Monteiro",
    cro: "CRO/ES 6.034",
    specialty: "Ortodontia Digital",
    bio: "Especialista em alinhadores invisíveis, com mais de 1.200 casos finalizados. Apaixonado por planejamento digital e resultados naturais.",
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=80",
    formation: ["Especialista em Ortodontia — APCD", "Certificação Invisalign Diamond", "Pós em Ortopedia Funcional"],
  },
  {
    slug: "dra-juliana-prado",
    name: "Dra. Juliana Prado",
    cro: "CRO/ES 5.117",
    specialty: "Odontopediatria",
    bio: "Cuida do sorriso das crianças com ambiente lúdico e abordagem humanizada. Atende desde o primeiro dentinho até a adolescência.",
    photo: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=900&q=80",
    formation: ["Especialista em Odontopediatria", "Atualização em Pacientes Especiais"],
  },
  {
    slug: "dr-andre-vasconcelos",
    name: "Dr. André Vasconcelos",
    cro: "CRO/ES 4.882",
    specialty: "Endodontia & Microscopia",
    bio: "Referência em tratamentos de canal com microscopia de alta precisão. Resolve casos complexos preservando o dente natural.",
    photo: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?auto=format&fit=crop&w=900&q=80",
    formation: ["Mestre em Endodontia", "Especialista em Microscopia Operatória"],
  },
];

export const TESTIMONIALS = [
  {
    name: "Mariana Souza",
    city: "Aracruz, ES",
    text: "Coloquei lentes na Dra. Camila e o resultado superou todas as expectativas. Atendimento de altíssimo nível, do primeiro contato ao acompanhamento.",
    rating: 5,
  },
  {
    name: "Paulo Henrique",
    city: "Linhares, ES",
    text: "Fiz dois implantes com o Dr. Rafael e voltei a sorrir sem medo. Tudo explicado em detalhes, sem pressão e com preço justo.",
    rating: 5,
  },
  {
    name: "Ana Beatriz",
    city: "Aracruz, ES",
    text: "Levei meu filho para a Dra. Juliana e ele simplesmente amou. Saiu pedindo para voltar! Recomendo de olhos fechados.",
    rating: 5,
  },
  {
    name: "Carlos Mendes",
    city: "Vitória, ES",
    text: "Fiz tratamento de canal com microscópio e foi indolor. Em uma sessão, problema resolvido. Equipe muito atenciosa.",
    rating: 5,
  },
  {
    name: "Larissa Vieira",
    city: "Serra, ES",
    text: "Comecei o tratamento com alinhadores invisíveis e nem parece que estou usando. Em 6 meses já vi mudança incrível.",
    rating: 5,
  },
  {
    name: "Felipe Antunes",
    city: "Aracruz, ES",
    text: "Atendimento de emergência num domingo à noite. Salvaram meu fim de semana. Profissionalismo de outro nível.",
    rating: 5,
  },
];

// ============= Dados de contato e localização =============
export const CLINIC_INFO = {
  name: "LyneCloud",
  city: "Aracruz",
  state: "ES",
  address: {
    street: "Rua Exemplo, 123 — Sala 01",
    district: "Centro",
    cityState: "Aracruz — ES",
    zip: "CEP 29190-000",
  },
  phone: {
    display: "(27) 98112-0322",
    tel: "+5527981120322",
  },
  whatsapp: {
    display: "(27) 98112-0322",
    number: "5527981120322",
  },
  email: "contato@lynecloud.com.br",
  hours: "Seg–Sex 8h–19h • Sáb 8h–13h",
  mapsQuery: "Aracruz+ES+Centro",
};

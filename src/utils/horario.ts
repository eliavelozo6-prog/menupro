export interface StatusFuncionamento {
  aberto: boolean;
  rotulo: string;
  tempoEstimado: string;
  horarioExibicao: string;
}

export function calcularStatusFuncionamento(
  strHorario?: string,
  restauranteAtivo: boolean = true,
  restauranteFechadoManualmente?: boolean
): StatusFuncionamento {
  // Se o restaurante estiver inativo pelo admin ou fechado manualmente
  if (!restauranteAtivo || restauranteFechadoManualmente) {
    return {
      aberto: false,
      rotulo: 'Fechado no Momento',
      tempoEstimado: '30 - 45 min',
      horarioExibicao: strHorario || 'Fechado temporariamente pelo estabelecimento'
    };
  }

  const horarioExibicao = strHorario?.trim() || 'Todos os dias: 11:00 às 23:00';
  const agora = new Date();
  const todayDay = agora.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  const yesterdayDay = (todayDay + 6) % 7;
  const nowMinutes = agora.getHours() * 60 + agora.getMinutes();

  const strLower = horarioExibicao.toLowerCase();

  // Mapeamento de nomes e siglas dos dias da semana
  const mapDia: Record<string, number> = {
    'dom': 0, 'domingo': 0,
    'seg': 1, 'segunda': 1,
    'ter': 2, 'terca': 2, 'terça': 2,
    'qua': 3, 'quarta': 3,
    'qui': 4, 'quinta': 4,
    'sex': 5, 'sexta': 5,
    'sab': 6, 'sabado': 6, 'sábado': 6
  };

  let diasValidos: number[] = [];

  // Checar se abrange "todos os dias" ou não tem especificação explícita de dia
  if (
    strLower.includes('todos os dias') ||
    strLower.includes('diariamente') ||
    strLower.includes('24h') ||
    strLower.includes('24 horas') ||
    !strLower.includes(':')
  ) {
    diasValidos = [0, 1, 2, 3, 4, 5, 6];
  } else {
    // Extrai o trecho antes do símbolo ':' (onde os dias são definidos)
    const partes = strLower.split(':');
    const parteDias = partes[0] || '';

    // Procura por formato de intervalo ex: "Segunda a Sexta" ou "Terça a Domingo" ou "Seg - Sáb"
    const matchRange = parteDias.match(/(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo|seg|ter|qua|qui|sex|sab|sáb|dom)\s*(?:a|até|ate|-)\s*(segunda|terca|terça|quarta|quinta|sexta|sabado|sábado|domingo|seg|ter|qua|qui|sex|sab|sáb|dom)/i);

    if (matchRange) {
      const d1Str = matchRange[1].toLowerCase();
      const d2Str = matchRange[2].toLowerCase();
      const startDay = mapDia[d1Str] ?? 1;
      const endDay = mapDia[d2Str] ?? 0;

      let cur = startDay;
      while (true) {
        diasValidos.push(cur);
        if (cur === endDay) break;
        cur = (cur + 1) % 7;
      }
    } else if (
      parteDias.includes('fim de semana') ||
      parteDias.includes('finais de semana') ||
      parteDias.includes('sábado e domingo') ||
      parteDias.includes('sabado e domingo')
    ) {
      diasValidos = [6, 0];
    } else if (parteDias.includes('dias úteis') || parteDias.includes('dias uteis')) {
      diasValidos = [1, 2, 3, 4, 5];
    } else {
      // Procurar todos os dias citados especificamente no texto (ex: "Sexta, Sábado e Domingo")
      Object.entries(mapDia).forEach(([key, val]) => {
        if (parteDias.includes(key) && !diasValidos.includes(val)) {
          diasValidos.push(val);
        }
      });
    }

    if (diasValidos.length === 0) {
      diasValidos = [0, 1, 2, 3, 4, 5, 6];
    }
  }

  // Se for 24h
  if (
    strLower.includes('24h') ||
    strLower.includes('24 horas') ||
    strLower.includes('24 hs') ||
    strLower.includes('24-horas')
  ) {
    const aberto = diasValidos.includes(todayDay);
    return {
      aberto,
      rotulo: aberto ? 'Aberto 24h' : 'Fechado no Momento',
      tempoEstimado: '30 - 45 min',
      horarioExibicao
    };
  }

  // Extrair turnos da string (após o ':' ou toda a string)
  const parteHorarios = strLower.includes(':') ? strLower.substring(strLower.indexOf(':') + 1) : strLower;

  // Dividir por ' e ' ou ',' ou ';'
  const blocosTurnos = parteHorarios.split(/\s+e\s+|,|;/);

  interface Turno {
    startMinutes: number;
    endMinutes: number;
  }

  const turnos: Turno[] = [];

  const parseMin = (val: string) => {
    const clean = val.toLowerCase().replace('h', ':');
    const parts = clean.split(':').map(n => parseInt(n, 10));
    const h = isNaN(parts[0]) ? 0 : parts[0];
    const m = isNaN(parts[1]) ? 0 : parts[1];
    return h * 60 + m;
  };

  blocosTurnos.forEach(bloco => {
    const matches = bloco.match(/(\d{1,2})(?:[:h](\d{2}))?\s*h?/gi);
    if (matches && matches.length >= 2) {
      const start = parseMin(matches[0]);
      const end = parseMin(matches[1]);
      turnos.push({ startMinutes: start, endMinutes: end });
    }
  });

  if (turnos.length === 0) {
    const allMatches = strLower.match(/(\d{1,2})(?:[:h](\d{2}))?\s*h?/gi);
    if (allMatches && allMatches.length >= 2) {
      turnos.push({ startMinutes: parseMin(allMatches[0]), endMinutes: parseMin(allMatches[1]) });
    } else {
      // Default: 11:00 às 23:00
      turnos.push({ startMinutes: 11 * 60, endMinutes: 23 * 60 });
    }
  }

  let aberto = false;

  for (const t of turnos) {
    if (t.startMinutes < t.endMinutes) {
      // Turno no mesmo dia (ex: 11:00 às 15:00 ou 18:00 às 23:00)
      if (diasValidos.includes(todayDay) && nowMinutes >= t.startMinutes && nowMinutes < t.endMinutes) {
        aberto = true;
        break;
      }
    } else if (t.startMinutes > t.endMinutes) {
      // Turno que vira a noite (ex: 18:00 às 02:00)
      if (diasValidos.includes(todayDay) && nowMinutes >= t.startMinutes) {
        aberto = true;
        break;
      }
      if (diasValidos.includes(yesterdayDay) && nowMinutes < t.endMinutes) {
        aberto = true;
        break;
      }
    } else {
      // startMinutes === endMinutes
      if (diasValidos.includes(todayDay)) {
        aberto = true;
        break;
      }
    }
  }

  return {
    aberto,
    rotulo: aberto ? 'Aberto Agora' : 'Fechado no Momento',
    tempoEstimado: '30 - 45 min',
    horarioExibicao
  };
}

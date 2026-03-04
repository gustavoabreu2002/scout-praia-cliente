export type ActionType = 'Saque' | 'Recepção' | 'Levantamento' | 'Ataque' | 'Bloqueio' | 'Defesa' | 'Bola de Segunda';
export type Quality = 'Excelente' | 'Bom' | 'Regular' | 'Ruim' | 'Erro' | 'Lado Adversário' | 'Bola Rápida' | 'Bola Alta' | 'Meia Bola' | 'Passou de Graça' | 'Forte' | 'Largada' | 'Outro';
export type Result = 'Ponto' | 'Continuidade' | 'Erro';
export type TeamId = 'Equipe A' | 'Equipe B';
export type CourtSide = 'Bom' | 'Ruim';
export type GameState = 'inicio' | 'saque' | 'recepcao' | 'levantamento' | 'ataque' | 'bloqueio' | 'defesa' | 'finalizacao';

export type ServeType = 'Flutuante' | 'Viagem' | 'Jornada' | 'Outro';
export type AttackType = 'Forte' | 'Largada' | 'Meia Bola' | 'Blockout' | 'Outro';
export type BlockType = 'Bloqueio Direto' | 'Continuidade' | 'Recuo' | 'Rede' | 'Neutro' | 'Amorteceu';

export interface GameAction {
    RallyID: number;
    Acao: ActionType;
    Equipe: TeamId;
    Jogador: string;
    Tipo?: string;
    Qualidade?: Quality;
    ZonaOrigem?: number | string;
    ZonaDestino?: number | string;
    Resultado: Result;
    Tempo: string;
    PontosEquipeA: number;
    PontosEquipeB: number;
    Lado: CourtSide;
    Registro?: string | number;
    Incongruente?: boolean;
}

export interface Team {
    jogador1: string;
    jogador2: string;
    registro1: string | number;
    registro2: string | number;
}

export interface MatchConfig {
    local: string;
    equipeA: Team;
    equipeB: Team;
    ladoA_inicial: CourtSide;
    equipeSacando: TeamId;
    jogadorSaqueInicialA: string;
    jogadorSaqueInicialB: string;
}

export interface VideoData {
    titulo: string;
    url: string;
    torneio?: string;
    fase?: string;
    local?: string;
    etapa?: string;
    equipeA?: Team;
    equipeB?: Team;
}

export interface Rally {
    id: number;
    startTime: string;
    startTimeSec: number;
    endTime: string;
    endTimeSec: number;
    set?: number;
}

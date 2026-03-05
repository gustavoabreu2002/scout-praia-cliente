import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, AlertTriangle, Users, Play, Film, Clock, Filter, MapPin, Zap, Star, Activity, Maximize2, Minimize2, Move, BarChart3, Check, ChevronDown, ArrowRight, Shield, Swords, Info } from 'lucide-react';
import type { GameAction, TeamId, ActionType, Rally, VideoData, CourtSide } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
    actions: GameAction[];
    teamA: string[];
    teamB: string[];
    videoRallies: Rally[];
    videoSource: VideoData | null;
    currentSideA?: CourtSide;
    currentSideB?: CourtSide;
    onPlayTime?: (time: number) => void;
}

export default function AnalyticsDashboard({ actions, teamA, teamB, videoRallies, videoSource, onPlayTime, currentSideA, currentSideB }: Props) {
    // Advanced Filters
    const [filterTeam, setFilterTeam] = useState<string>('all');
    const [filterPlayer, setFilterPlayer] = useState<string>('all');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterQuality, setFilterQuality] = useState<string>('all');
    const [filterResult, setFilterResult] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterSide, setFilterSide] = useState<string>('all');
    const [filterZoneOrigin, setFilterZoneOrigin] = useState<string[]>(['all']);
    const [filterZoneDest, setFilterZoneDest] = useState<string[]>(['all']);
    const [scoreMin, setScoreMin] = useState<string>('');
    const [scoreMax, setScoreMax] = useState<string>('');


    // 🔄 Reactive Logic: Filter Player based on Team
    const playersForFilter = useMemo(() => {
        if (filterTeam === 'all') return [...teamA, ...teamB];
        return filterTeam === 'Equipe A' ? teamA : teamB;
    }, [filterTeam, teamA, teamB]);

    useEffect(() => {
        if (filterPlayer !== 'all' && !playersForFilter.includes(filterPlayer)) {
            setFilterPlayer('all');
        }
    }, [playersForFilter, filterPlayer]);

    // 🔄 Reactive Logic: Qualities based on Action
    const qualitiesForFilter = useMemo(() => {
        const qs = new Set<string>();
        actions.forEach(a => {
            if ((filterAction === 'all' || a.Acao === filterAction) && a.Qualidade) {
                qs.add(a.Qualidade);
            }
        });
        return Array.from(qs).sort();
    }, [actions, filterAction]);

    // 🔄 Reactive Logic: Types based on Action
    const typesForFilter = useMemo(() => {
        const ts = new Set<string>();
        actions.forEach(a => {
            if ((filterAction === 'all' || a.Acao === filterAction) && a.Tipo) {
                ts.add(a.Tipo);
            }
        });
        return Array.from(ts).sort();
    }, [actions, filterAction]);

    const filteredActions = useMemo(() => {
        return actions.filter(a => {
            const matchTeam = filterTeam === 'all' || a.Equipe === filterTeam;
            const matchPlayer = filterPlayer === 'all' || a.Jogador === filterPlayer;
            const matchAction = filterAction === 'all' || a.Acao === filterAction;
            const matchQuality = filterQuality === 'all' || a.Qualidade === filterQuality;
            const matchResult = filterResult === 'all' || a.Resultado === filterResult;
            const matchType = filterType === 'all' || a.Tipo === filterType;

            const matchSide = filterSide === 'all' || a.Lado === filterSide;

            const scoreToInpect = filterTeam === 'Equipe B' ? a.PontosEquipeB : a.PontosEquipeA;
            const minS = scoreMin === '' ? -1 : parseInt(scoreMin);
            const maxS = scoreMax === '' ? 999 : parseInt(scoreMax);
            const matchScore = scoreToInpect >= minS && scoreToInpect <= maxS;

            const matchZoneOrigin = filterZoneOrigin.includes('all') || filterZoneOrigin.includes(String(a.ZonaOrigem));
            const matchZoneDest = filterZoneDest.includes('all') || filterZoneDest.includes(String(a.ZonaDestino));

            return matchTeam && matchPlayer && matchAction && matchQuality && matchResult && matchType && matchSide && matchZoneOrigin && matchZoneDest && matchScore;
        });
    }, [actions, filterTeam, filterPlayer, filterAction, filterQuality, filterResult, filterType, filterSide, filterZoneOrigin, filterZoneDest, scoreMin, scoreMax]);

    const associatedRallies = useMemo(() => {
        const uniqueRallyIds = Array.from(new Set(filteredActions.map(a => a.RallyID)));
        return videoRallies.filter(r => uniqueRallyIds.includes(r.id));
    }, [filteredActions, videoRallies]);

    const handlePlayClip = (time: number) => {
        if (onPlayTime) onPlayTime(time);
    };

    const metrics = useMemo(() => {
        const total = filteredActions.length;
        const points = filteredActions.filter(a => a.Resultado === 'Ponto').length;
        const errors = filteredActions.filter(a => a.Resultado === 'Erro').length;
        const efficiency = total > 0 ? ((points - errors) / total) * 100 : 0;

        const combinations: Record<string, { points: number; total: number }> = {};
        filteredActions.filter(a => ['Ataque', 'Saque', 'Bola de Segunda'].includes(a.Acao)).forEach(a => {
            const key = `${a.Acao} ${a.Tipo || ''} (Z${a.ZonaDestino || '?'})`;
            if (!combinations[key]) combinations[key] = { points: 0, total: 0 };
            combinations[key].total++;
            if (a.Resultado === 'Ponto') combinations[key].points++;
        });

        let bestStroke = "N/A";
        let maxPts = -1;
        Object.entries(combinations).forEach(([stroke, data]) => {
            if (data.points > maxPts) {
                maxPts = data.points;
                bestStroke = stroke;
            }
        });

        return { total, points, errors, efficiency, bestStroke };
    }, [filteredActions]);

    const zoneDistribution = useMemo(() => {
        const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Fora Quadra', 'Rede', 'Blockout'];
        const counts: Record<string, number> = {};
        labels.forEach(l => counts[l] = 0);

        filteredActions.forEach(a => {
            if (a.ZonaDestino) {
                const z = String(a.ZonaDestino);
                if (counts[z] !== undefined) {
                    counts[z]++;
                }
            }
        });

        return labels.map(name => ({ name, value: counts[name] }));
    }, [filteredActions]);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-700 relative">
            {/* Filters Card */}
            <Card className="border-border/40 bg-card/50 backdrop-blur-xl shadow-lg border-t-accent/30">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6 border-b border-border/40 pb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-accent" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Filtros Avançados</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <FilterSelect label="Equipe Foco" value={filterTeam} onChange={setFilterTeam}>
                            <SelectItem value="all">Todas as Equipes</SelectItem>
                            <SelectItem value="Equipe A">Equipe A</SelectItem>
                            <SelectItem value="Equipe B">Equipe B</SelectItem>
                        </FilterSelect>

                        <FilterSelect label="Jogador" value={filterPlayer} onChange={setFilterPlayer}>
                            <SelectItem value="all">Todos os Atletas</SelectItem>
                            {playersForFilter.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </FilterSelect>

                        <FilterSelect label="Ação" value={filterAction} onChange={setFilterAction}>
                            <SelectItem value="all">Todos Fundamentos</SelectItem>
                            {['Saque', 'Recepção', 'Levantamento', 'Ataque', 'Bloqueio', 'Defesa', 'Bola de Segunda'].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </FilterSelect>

                        <FilterSelect label="Qualidade" value={filterQuality} onChange={setFilterQuality}>
                            <SelectItem value="all">Qualquer Execução</SelectItem>
                            {qualitiesForFilter.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                        </FilterSelect>

                        <FilterSelect label="Resultado" value={filterResult} onChange={setFilterResult}>
                            <SelectItem value="all">Qualquer Resultado</SelectItem>
                            {['Ponto', 'Erro', 'Continuidade'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </FilterSelect>

                        <FilterSelect label="Tipo" value={filterType} onChange={setFilterType}>
                            <SelectItem value="all">Qualquer Tipo</SelectItem>
                            {typesForFilter.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </FilterSelect>

                        <FilterSelect label={filterTeam === 'Equipe B' ? "Lado Equipe B" : "Lado Equipe A"} value={filterSide} onChange={setFilterSide}>
                            <SelectItem value="all">Ambos Lados</SelectItem>
                            <SelectItem value="Bom">Lado Bom</SelectItem>
                            <SelectItem value="Ruim">Lado Ruim</SelectItem>
                        </FilterSelect>

                        <div className="space-y-1.5 flex flex-col">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Placar {filterTeam === 'Equipe B' ? 'B' : 'A'} (Intervalo)</label>
                            <div className="flex gap-2">
                                <Input placeholder="Início" value={scoreMin} onChange={e => setScoreMin(e.target.value)} className="h-9 bg-zinc-900/50 border-white/5 text-[10px] p-2" />
                                <Input placeholder="Fim" value={scoreMax} onChange={e => setScoreMax(e.target.value)} className="h-9 bg-zinc-900/50 border-white/5 text-[10px] p-2" />
                            </div>
                        </div>
                    </div>


                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
                        <MultiFilterSelect
                            label="Origem da Bola (Zona)"
                            options={['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Entrada', 'Meio', 'Saída']}
                            values={filterZoneOrigin}
                            onChange={setFilterZoneOrigin}
                        />
                        <MultiFilterSelect
                            label="Destino da Bola (Zona)"
                            options={['all', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Fora Quadra', 'Rede', 'Blockout']}
                            values={filterZoneDest}
                            onChange={setFilterZoneDest}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KPIItem icon={<Target className="text-primary" />} label="Eficácia" value={`${metrics.efficiency.toFixed(1)}%`} color="primary" />
                <KPIItem icon={<Zap className="text-emerald-500" />} label="Pontos" value={metrics.points} color="emerald" />
                <KPIItem icon={<AlertTriangle className="text-destructive" />} label="Erros" value={metrics.errors} color="destructive" />
                <KPIItem icon={<Activity className="text-sky-500" />} label="Volume" value={metrics.total} color="sky" />
                <KPIItem icon={<Star className="text-accent" />} label="Golpe Letal" value={metrics.bestStroke} color="accent" size="text-[10px]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visualizer Section */}
                <Card className="lg:col-span-12 border-border/40 bg-card/30 backdrop-blur-md overflow-hidden">
                    <CardHeader className="p-4 border-b border-white/5 bg-accent/5">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-accent" /> Inteligência de Quadra (Incidência e Trajetórias)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col lg:flex-row gap-12 items-center justify-center">
                            <div className="w-full max-w-[400px]">
                                <CourtVisualizer
                                    actions={filteredActions}
                                    teamA={actions.length > 0 ? (actions[0].Equipe === 'Equipe A' ? 'Equipe A' : 'Equipe B') : 'A'}
                                    sideA={currentSideA}
                                    sideB={currentSideB}
                                />
                            </div>

                            {/* Legend */}
                            <div className="flex flex-col gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-white/5 min-w-[200px]">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">Legenda de Ações</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    <LegendItem color="#3b82f6" label="Saque" icon={<Move className="w-3 h-3" />} />
                                    <LegendItem color="#14b8a6" label="Recepção" icon={<Info className="w-3 h-3" />} />
                                    <LegendItem color="#eab308" label="Levantamento" icon={<Target className="w-3 h-3" />} />
                                    <LegendItem color="#ef4444" label="Ataque" icon={<Swords className="w-3 h-3" />} />
                                    <LegendItem color="#a855f7" label="Bloqueio" icon={<Shield className="w-3 h-3" />} />
                                    <LegendItem color="#22c55e" label="Defesa" icon={<Activity className="w-3 h-3" />} />
                                    <LegendItem color="#f97316" label="Bola de Segunda" icon={<Zap className="w-3 h-3" />} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Chart Section */}
                <Card className="lg:col-span-8 border-border/40 bg-card/30 backdrop-blur-md">
                    <CardHeader className="p-4 px-5 flex flex-row items-center justify-between border-b border-white/5">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <BarChart3 className="w-3 h-3 text-accent" /> Histograma de Zona Destino
                        </CardTitle>
                        <span className="text-[9px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">INCIDÊNCIA VOLUMÉTRICA</span>
                    </CardHeader>
                    <CardContent className="h-[280px] pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={zoneDistribution} margin={{ left: -30, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                                <XAxis
                                    dataKey="name"
                                    fontSize={8}
                                    fontWeight="black"
                                    axisLine={false}
                                    tickLine={false}
                                    angle={-45}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {zoneDistribution.map((e, i) => (
                                        <Cell
                                            key={i}
                                            fill={e.value > 0 ? 'hsl(var(--accent))' : '#333'}
                                            fillOpacity={e.value > 0 ? 0.8 : 0.2}
                                        />
                                    ))}
                                </Bar>
                            </RechartsBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Clips Sidebar */}
                <Card className="lg:col-span-4 border-border/40 bg-card/50 shadow-2xl flex flex-col max-h-[460px]">
                    <CardHeader className="p-4 border-b border-white/5 bg-accent/5">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center justify-between">
                            <span>ARQUIVO DE VÍDEO</span>
                            <span className="text-zinc-500 font-mono text-[11px]">{associatedRallies.length}</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto flex-1 custom-scrollbar">
                        {associatedRallies.map(r => (
                            <div key={r.id} onClick={() => handlePlayClip(r.startTimeSec)} className="p-4 hover:bg-white/5 transition-all cursor-pointer group flex items-center justify-between border-b border-white/5 group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black group-hover:text-accent tracking-tighter">RALLY #{r.id}</p>
                                    <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {r.startTime}</span>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 shadow-inner">
                                    <Play className="w-2.5 h-2.5 fill-current text-white" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- HELPER COMPONENTS ---

function MultiFilterSelect({ label, options, values, onChange }: { label: string; options: string[]; values: string[]; onChange: (v: string[]) => void }) {
    const toggleOption = (option: string) => {
        if (option === 'all') {
            onChange(['all']);
            return;
        }

        let newValues = [...values].filter(v => v !== 'all');
        if (newValues.includes(option)) {
            newValues = newValues.filter(v => v !== option);
            if (newValues.length === 0) newValues = ['all'];
        } else {
            newValues.push(option);
        }
        onChange(newValues);
    };

    return (
        <div className="space-y-1.5 font-bold">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider ml-0.5 opacity-60">{label}</label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-9 bg-zinc-900/60 border-white/5 rounded-xl text-[10px] font-black justify-between hover:border-accent/30 transition-all px-3">
                        <div className="flex gap-1 overflow-hidden">
                            {values.includes('all') ? (
                                <span className="opacity-50">Todos</span>
                            ) : (
                                values.map(v => (
                                    <Badge key={v} variant="secondary" className="h-5 text-[10px] px-1 bg-accent/20 text-accent border-accent/20">
                                        {v}
                                    </Badge>
                                ))
                            )}
                        </div>
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-2 bg-zinc-950 border-white/10 rounded-xl backdrop-blur-2xl">
                    <div className="grid gap-1">
                        {options.map(option => (
                            <div
                                key={option}
                                className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5",
                                    values.includes(option) && "bg-white/5"
                                )}
                                onClick={() => toggleOption(option)}
                            >
                                <Checkbox checked={values.includes(option)} onCheckedChange={() => toggleOption(option)} />
                                <span className="text-[10px] font-bold uppercase">{option === 'all' ? 'Selecionar Todos' : option}</span>
                            </div>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function LegendItem({ color, label, icon }: { color: string, label: string, icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center border border-white/5 bg-zinc-800/50" style={{ color }}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase text-muted-foreground">{label}</span>
            <div className="flex-1 border-b border-dashed border-white/10" />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
    );
}

function CourtVisualizer({ actions, teamA, sideA, sideB }: { actions: GameAction[], teamA: string, sideA?: CourtSide, sideB?: CourtSide }) {
    const { courtIncidence, netIncidence } = useMemo(() => {
        const cCounts: Record<string, number> = {};
        const nCounts: Record<string, number> = {};

        actions.forEach(a => {
            // Standard court destination (where the ball lands)
            if (a.ZonaDestino && !['Levantamento'].includes(a.Acao)) {
                // For non-setting actions, destination is the court grid
                if (typeof a.ZonaDestino === 'number' || !isNaN(Number(a.ZonaDestino))) {
                    // Reception (Recepção) destination should be on the SAME side as the team
                    // Attacks (Ataque) and Serves (Saque) destination should be on the OPPOSITE side
                    const isInternalAction = ['Recepção', 'Defesa'].includes(a.Acao);
                    const targetTeam = isInternalAction ? a.Equipe : (a.Equipe === 'Equipe A' ? 'Equipe B' : 'Equipe A');

                    const key = `${targetTeam === 'Equipe A' ? 'A' : 'B'}_${a.ZonaDestino}`;
                    cCounts[key] = (cCounts[key] || 0) + 1;
                }
            }

            // Net Zones for setting destination or attack origin
            if (a.Acao === 'Levantamento' && a.ZonaDestino) {
                const key = `${a.Equipe}_NET_${a.ZonaDestino}`;
                nCounts[key] = (nCounts[key] || 0) + 1;
            }
            if (a.Acao === 'Ataque' && a.ZonaOrigem) {
                // If attack origin is 1-5, it's a net zone
                const zNum = Number(a.ZonaOrigem);
                if (!isNaN(zNum) && zNum >= 1 && zNum <= 5) {
                    const key = `${a.Equipe}_NET_${a.ZonaOrigem}`;
                    nCounts[key] = (nCounts[key] || 0) + 1;
                }
            }
        });
        return { courtIncidence: cCounts, netIncidence: nCounts };
    }, [actions]);

    const maxInc = Math.max(...Object.values(courtIncidence), ...Object.values(netIncidence), 1);
    const getHeatColor = (count: number) => {
        if (!count) return 'transparent';
        const intensity = count / maxInc;
        return `hsl(var(--accent) / ${0.1 + intensity * 0.8})`;
    };

    const visualActions = useMemo(() => {
        return actions.filter(a => a.ZonaOrigem && a.ZonaDestino);
    }, [actions]);

    return (
        <div className="relative w-full aspect-[9/18] bg-black/40 rounded-3xl border-[6px] border-zinc-800/50 shadow-2xl overflow-hidden group">
            <svg viewBox="0 0 100 200" className="absolute inset-0 w-full h-full pointer-events-none z-10 drop-shadow-2xl">
                <line x1="0" y1="100" x2="100" y2="100" stroke="hsl(var(--destructive))" strokeWidth="2" strokeDasharray="3 2" opacity="0.8" />
                <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="white" strokeWidth="0.5" opacity="0.1" />
                <line x1="0" y1="133.3" x2="100" y2="133.3" stroke="white" strokeWidth="0.5" opacity="0.1" />

                {visualActions.map((a, i) => {
                    const start = getZoneCoords(a.Equipe, a.ZonaOrigem, a.Acao, true);

                    // Logical redirection: Reception and Setting stay on the same side. 
                    // Attack and Serve go to the other side.
                    const isInternalAction = ['Recepção', 'Levantamento', 'Defesa'].includes(a.Acao);
                    const destinationTeam = isInternalAction ? a.Equipe : (a.Equipe === 'Equipe A' ? 'Equipe B' : 'Equipe A');

                    const end = getZoneCoords(destinationTeam, a.ZonaDestino, a.Acao, false);
                    if (!start || !end) return null;

                    const color = getActionColor(a.Acao);
                    const id = `arrow-${i}`;

                    return (
                        <g key={id} opacity={0.5} className="hover:opacity-100 transition-opacity">
                            <defs>
                                <marker id={`head-${id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orientation="auto">
                                    <path d="M0,0 L0,8 L8,4 Z" fill={color} />
                                </marker>
                            </defs>
                            <path
                                d={`M${start.x},${start.y} Q${(start.x + end.x) / 2},${(start.y + end.y) / 2 - 5} ${end.x},${end.y}`}
                                fill="none"
                                stroke={color}
                                strokeWidth="0.8"
                                markerEnd={`url(#head-${id})`}
                                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                            />
                        </g>
                    );
                })}
            </svg>

            <div className="absolute inset-0 grid grid-rows-2 p-1 bg-zinc-950/20">
                <div className="relative border-b border-white/5 rounded-t-2xl overflow-hidden">
                    <div className="absolute top-4 left-4 flex flex-col gap-1 z-20">
                        <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                            sideA === 'Bom' ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30"
                        )}>
                            <Shield className="w-3 h-3 mr-1.5" /> {teamA}
                        </Badge>
                        <span className={cn(
                            "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-md self-start border",
                            sideA === 'Bom' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                            LADO {sideA === 'Bom' ? 'BOM' : 'RUIM'}
                        </span>
                    </div>
                    <SideGrid team="A" courtIncidence={courtIncidence} netIncidence={netIncidence} getHeatColor={getHeatColor} mirrored />
                </div>

                <div className="relative rounded-b-2xl overflow-hidden">
                    <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 z-20">
                        <span className={cn(
                            "text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-md self-end border",
                            sideB === 'Bom' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                        )}>
                            LADO {sideB === 'Bom' ? 'BOM' : 'RUIM'}
                        </span>
                        <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                            sideB === 'Bom' ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30"
                        )}>
                            <Shield className="w-3 h-3 mr-1.5" /> {teamA === 'Equipe A' ? 'Equipe B' : 'Equipe A'}
                        </Badge>
                    </div>
                    <SideGrid team="B" courtIncidence={courtIncidence} netIncidence={netIncidence} getHeatColor={getHeatColor} />
                </div>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 flex bg-zinc-950 border border-white/10 px-4 py-1.5 rounded-full items-center gap-5 shadow-2xl backdrop-blur-2xl text-white">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Lado Bom</span>
                </div>
                <div className="w-[1px] h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Lado Ruim</span>
                </div>
            </div>
        </div>
    );
}

function SideGrid({ team, courtIncidence, netIncidence, getHeatColor, mirrored = false }: { team: string; courtIncidence: Record<string, number>; netIncidence: Record<string, number>; getHeatColor: (n: number) => string; mirrored?: boolean }) {
    const zones = [
        [4, 3, 2],
        [7, 8, 9],
        [5, 6, 1]
    ];

    let displayRows = team === 'A' ? [...zones].reverse() : zones;
    if (mirrored) displayRows = displayRows.map(row => [...row].reverse());

    const netSpots = [1, 2, 3, 4, 5];
    const displayNet = mirrored ? [...netSpots].reverse() : netSpots;

    return (
        <div className="flex-1 flex flex-col gap-[1px] p-4 h-full">
            {/* Net Zones Bar (1-5) for Team B (Top of field) */}
            {team === 'B' && (
                <div className="grid grid-cols-5 gap-1 mb-2 h-10 border-b border-white/10 pb-2">
                    {displayNet.map(z => {
                        const count = netIncidence[`Equipe B_NET_${z}`] || 0;
                        return (
                            <div key={z} className="relative flex items-center justify-center rounded border border-white/5 transition-all"
                                style={{ backgroundColor: getHeatColor(count) }}>
                                <span className="text-[6px] font-black opacity-30 absolute top-0.5 left-0.5">{z}</span>
                                {count > 0 && <span className="text-[9px] font-black text-white">{count}</span>}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 1-9 Grid */}
            <div className="flex-1 grid grid-rows-3 gap-[1px]">
                {displayRows.map((row, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-3 gap-[1px]">
                        {row.map(z => {
                            const count = courtIncidence[`${team}_${z}`] || 0;
                            return (
                                <div key={z} className="relative flex items-center justify-center transition-all duration-500 group border border-white/5 rounded-lg"
                                    style={{ backgroundColor: getHeatColor(count) }}>
                                    <span className="text-[8px] font-black opacity-10 group-hover:opacity-40 transition-opacity absolute top-1.5 left-1.5">{z}</span>
                                    {count > 0 && (
                                        <span className="text-[12px] font-black text-white drop-shadow-lg z-10 transition-transform group-hover:scale-110">
                                            {count}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Net Zones Bar (1-5) for Team A (Bottom of field) */}
            {team === 'A' && (
                <div className="grid grid-cols-5 gap-1 mt-2 h-10 border-t border-white/10 pt-2">
                    {displayNet.map(z => {
                        const count = netIncidence[`Equipe A_NET_${z}`] || 0;
                        return (
                            <div key={z} className="relative flex items-center justify-center rounded border border-white/5 transition-all"
                                style={{ backgroundColor: getHeatColor(count) }}>
                                <span className="text-[6px] font-black opacity-30 absolute top-0.5 left-0.5">{z}</span>
                                {count > 0 && <span className="text-[9px] font-black text-white">{count}</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function getZoneCoords(team: TeamId, zone: number | string, action: ActionType, isOrigin: boolean): { x: number, y: number } | null {
    const isTeamA = team === 'Equipe A';

    // Team B Pos (Bottom field)
    const teamBPos: Record<number, { x: number, y: number }> = {
        4: { x: 16.6, y: 116.6 }, 3: { x: 50, y: 116.6 }, 2: { x: 83.3, y: 116.6 },
        7: { x: 16.6, y: 150 }, 8: { x: 50, y: 150 }, 9: { x: 83.3, y: 150 },
        5: { x: 16.6, y: 183.3 }, 6: { x: 50, y: 183.3 }, 1: { x: 83.3, y: 183.3 }
    };

    // Team A Pos (Top field) - Mirrored
    const teamAPos: Record<number, { x: number, y: number }> = {
        4: { x: 83.3, y: 83.3 }, 3: { x: 50, y: 83.3 }, 2: { x: 16.6, y: 83.3 },
        7: { x: 83.3, y: 50 }, 8: { x: 50, y: 50 }, 9: { x: 16.6, y: 50 },
        5: { x: 83.3, y: 16.6 }, 6: { x: 50, y: 16.6 }, 1: { x: 16.6, y: 16.6 }
    };

    if (typeof zone === 'number' || !isNaN(Number(zone))) {
        const zNum = Number(zone);

        // Logical Linking: Levantamento destination and Ataque origin are Net Zones 1-5
        const isNetZoneAction = (action === 'Levantamento' && !isOrigin) || (action === 'Ataque' && isOrigin);

        if (zNum >= 1 && zNum <= 5 && isNetZoneAction) {
            // Levantamento destination or Attack origin - both use the net bar 1-5
            if (isTeamA) return { x: 80 - (zNum - 1) * 15, y: 92 };
            return { x: 20 + (zNum - 1) * 15, y: 108 };
        }
        return isTeamA ? teamAPos[zNum] : teamBPos[zNum];
    }

    // Special Origins/Destinations
    if (zone === 'Entrada') return isTeamA ? { x: 85, y: -5 } : { x: 15, y: 205 };
    if (zone === 'Meio') return { x: 50, y: isTeamA ? -5 : 205 };
    if (zone === 'Saída') return isTeamA ? { x: 15, y: -5 } : { x: 85, y: 205 };
    if (zone === 'Fora Quadra') return isTeamA ? { x: 50, y: 215 } : { x: 50, y: -15 };
    if (zone === 'Rede') return { x: 50, y: 100 };
    if (zone === 'Blockout') return { x: isTeamA ? 105 : -5, y: isTeamA ? 120 : 80 };

    return null;
}

function getActionColor(action: ActionType): string {
    const colors: Record<string, string> = {
        'Saque': '#3b82f6',
        'Recepção': '#14b8a6',
        'Levantamento': '#eab308',
        'Ataque': '#ef4444',
        'Bloqueio': '#a855f7',
        'Defesa': '#22c55e',
        'Bola de Segunda': '#f97316'
    };
    return colors[action] || '#ffffff';
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5 font-bold">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider ml-0.5 opacity-60">{label}</label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-9 bg-zinc-900/60 border-white/5 rounded-xl text-[10px] font-black focus:ring-accent/40 shadow-sm hover:border-accent/30 transition-all">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-white/10 rounded-xl overflow-hidden backdrop-blur-2xl">
                    {children}
                </SelectContent>
            </Select>
        </div>
    );
}

function KPIItem({ icon, label, value, color, size = "text-xl font-black" }: { icon: React.ReactNode; label: string; value: string | number; color: string; size?: string }) {
    const colorClasses: Record<string, string> = {
        primary: "bg-primary/5 border-primary/10 hover:border-primary/30",
        emerald: "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30",
        destructive: "bg-destructive/5 border-destructive/10 hover:border-destructive/30",
        sky: "bg-sky-500/5 border-sky-500/10 hover:border-sky-500/30",
        accent: "bg-accent/5 border-accent/10 hover:border-accent/30",
    }
    return (
        <Card className={cn("border-border/40 p-4 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden backdrop-blur-md shadow-lg", colorClasses[color])}>
            <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">{label}</p>
                <div className="opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">{icon}</div>
            </div>
            <div className={cn(size, "tracking-tighter truncate leading-none")}>{value}</div>
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5" />
        </Card>
    );
}

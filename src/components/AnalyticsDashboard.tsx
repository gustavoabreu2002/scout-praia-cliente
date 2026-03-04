import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, AlertTriangle, Users, Play, Film, Clock, Filter, MapPin, Zap, Star, Activity, Maximize2, Minimize2, Move, BarChart3 } from 'lucide-react';
import type { GameAction, TeamId, ActionType, Rally, VideoData } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props {
    actions: GameAction[];
    teamA: string[];
    teamB: string[];
    videoRallies: Rally[];
    videoSource: VideoData | null;
    onPlayTime?: (time: number) => void;
}

export default function AnalyticsDashboard({ actions, teamA, teamB, videoRallies, videoSource, onPlayTime }: Props) {
    // Advanced Filters
    const [filterTeam, setFilterTeam] = useState<string>('all');
    const [filterPlayer, setFilterPlayer] = useState<string>('all');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterQuality, setFilterQuality] = useState<string>('all');
    const [filterSide, setFilterSide] = useState<string>('all');
    const [filterZoneOrigin, setFilterZoneOrigin] = useState<string>('all');
    const [filterZoneDest, setFilterZoneDest] = useState<string>('all');
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

    const filteredActions = useMemo(() => {
        return actions.filter(a => {
            const matchTeam = filterTeam === 'all' || a.Equipe === filterTeam;
            const matchPlayer = filterPlayer === 'all' || a.Jogador === filterPlayer;
            const matchAction = filterAction === 'all' || a.Acao === filterAction;
            const matchQuality = filterQuality === 'all' || a.Qualidade === filterQuality;

            // Dynamic Side Filter: If a team is selected, we filter by that team's side state
            // If no team is selected, Lado is checked normally.
            const matchSide = filterSide === 'all' || a.Lado === filterSide;

            const scoreToInpect = filterTeam === 'Equipe B' ? a.PontosEquipeB : a.PontosEquipeA;
            const minS = scoreMin === '' ? -1 : parseInt(scoreMin);
            const maxS = scoreMax === '' ? 999 : parseInt(scoreMax);
            const matchScore = scoreToInpect >= minS && scoreToInpect <= maxS;

            const matchZoneOrigin = filterZoneOrigin === 'all' || String(a.ZonaOrigem) === filterZoneOrigin;
            const matchZoneDest = filterZoneDest === 'all' || String(a.ZonaDestino) === filterZoneDest;

            return matchTeam && matchPlayer && matchAction && matchQuality && matchSide && matchZoneOrigin && matchZoneDest && matchScore;
        });
    }, [actions, filterTeam, filterPlayer, filterAction, filterQuality, filterSide, filterZoneOrigin, filterZoneDest, scoreMin, scoreMax]);

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

    const zoneIncidence = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredActions.forEach(a => {
            if (a.ZonaDestino) {
                const key = `${a.Equipe === 'Equipe A' ? 'B' : 'A'}_${a.ZonaDestino}`;
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return counts;
    }, [filteredActions]);

    const maxIncidence = Math.max(...Object.values(zoneIncidence), 1);

    const getHeatColor = (count: number) => {
        if (!count) return 'transparent';
        const intensity = count / maxIncidence;
        return `hsl(var(--accent) / ${0.1 + intensity * 0.8})`;
    };

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
                        <FilterSelect label="Origem da Bola (Zona)" value={filterZoneOrigin} onChange={setFilterZoneOrigin}>
                            <SelectItem value="all">Todas as Origens</SelectItem>
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Entrada', 'Meio', 'Saída'].map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                        </FilterSelect>
                        <FilterSelect label="Destino da Bola (Zona)" value={filterZoneDest} onChange={setFilterZoneDest}>
                            <SelectItem value="all">Todos os Destinos</SelectItem>
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Fora Quadra', 'Rede', 'Blockout'].map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                        </FilterSelect>
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
                {/* Heatmap Section */}
                <Card className="lg:col-span-5 border-border/40 bg-card/30 backdrop-blur-md overflow-hidden">
                    <CardHeader className="p-4 border-b border-white/5 bg-accent/5">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-accent" /> Inteligência de Quadra (Incidência)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col gap-4 max-w-[320px] mx-auto">
                            <div className="space-y-2">
                                {/* ADVERSARY FIELD (TOP) - ESPELHADO */}
                                <CourtGrid team="A" incidence={zoneIncidence} getHeatColor={getHeatColor} rotated mirrored />

                                <div className="flex flex-col items-center py-4 relative">
                                    <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-destructive/50 to-transparent blur-[1px]" />
                                    <div className="px-4 py-1 bg-destructive text-[9px] font-black text-white rounded-full uppercase absolute -top-1.5 border border-white/20 shadow-xl tracking-tighter">Linha de Bloqueio</div>
                                </div>

                                {/* OUR FIELD (BOTTOM) - NORMAL */}
                                <CourtGrid team="B" incidence={zoneIncidence} getHeatColor={getHeatColor} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Chart Section */}
                <Card className="lg:col-span-4 border-border/40 bg-card/30 backdrop-blur-md">
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
                <Card className="lg:col-span-3 border-border/40 bg-card/50 shadow-2xl flex flex-col max-h-[460px]">
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

function CourtGrid({ team, incidence, getHeatColor, rotated = false, mirrored = false }: { team: string; incidence: Record<string, number>; getHeatColor: (n: number) => string; rotated?: boolean; mirrored?: boolean }) {
    // 🏐 Volleyball Zone Geometry
    // NET ROW: 4  3  2
    // MID ROW: 7  8  9
    // BACK ROW: 5  6  1

    // For mirroring (espelhado), the columns are reversed:
    // Row 1: 2  3  4
    // Row 2: 9  8  7
    // Row 3: 1  6  5

    const zones = [
        [4, 3, 2],
        [7, 8, 9],
        [5, 6, 1]
    ];

    let displayRows = rotated ? [...zones].reverse() : zones;

    if (mirrored) {
        displayRows = displayRows.map(row => [...row].reverse());
    }

    const borderClass = team === 'A' ? 'border-team-a/30 bg-team-a/5' : 'border-team-b/30 bg-team-b/5';

    return (
        <div className={cn("grid grid-rows-3 gap-1.5 p-1.5 border-[3px] rounded-2xl relative shadow-2xl", borderClass)}>
            {displayRows.map((row, rIdx) => (
                <div key={rIdx} className="grid grid-cols-3 gap-1.5">
                    {row.map(z => (
                        <div key={z} className="aspect-square relative rounded-xl border border-white/5 flex items-center justify-center transition-all duration-500 shadow-inner group"
                            style={{ backgroundColor: getHeatColor(incidence[`${team}_${z}`] || 0) }}>
                            <span className="text-[9px] font-black opacity-10 group-hover:opacity-40 transition-opacity">{z}</span>
                            {incidence[`${team}_${z}`] > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[12px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                        {incidence[`${team}_${z}`]}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
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

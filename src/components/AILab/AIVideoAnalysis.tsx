import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Upload,
    Play,
    Pause,
    Clock,
    Brain,
    Trash2,
    Edit2,
    CheckCircle,
    History,
    Sparkles,
    Users,
    ChevronRight,
    Search,
    Download,
    Eye,
    Video
} from 'lucide-react';
import { ActionType, GameAction, Quality, Result, TeamId, CourtSide } from '../../types/game';

interface InferredAction extends GameAction {
    confidence: number;
    correctedValue?: Partial<GameAction>;
}

export default function AIVideoAnalysis({ onBack }: { onBack: () => void }) {
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [actions, setActions] = useState<InferredAction[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [selectedAction, setSelectedAction] = useState<number | null>(null);
    const [showComparison, setShowComparison] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoUrl(URL.createObjectURL(file));
        setActions([]);
        setSelectedAction(null);
    };

    const startAIAnalysis = () => {
        setIsAnalyzing(true);
        // Simulation of Gemini 3.1 Flash Analysis
        setTimeout(() => {
            const mockActions: InferredAction[] = [
                {
                    RallyID: 1, Acao: 'Saque', Equipe: 'Equipe A', Jogador: 'Player 1',
                    Tempo: '00:05', PontosEquipeA: 0, PontosEquipeB: 0, Lado: 'Bom',
                    Resultado: 'Continuidade', confidence: 0.98
                },
                {
                    RallyID: 1, Acao: 'Recepção', Equipe: 'Equipe B', Jogador: 'Player 3',
                    Tempo: '00:07', PontosEquipeA: 0, PontosEquipeB: 0, Lado: 'Ruim', Qualidade: 'Bom',
                    Resultado: 'Continuidade', confidence: 0.92
                },
                {
                    RallyID: 1, Acao: 'Levantamento', Equipe: 'Equipe B', Jogador: 'Player 4',
                    Tempo: '00:09', PontosEquipeA: 0, PontosEquipeB: 0, Lado: 'Ruim',
                    Resultado: 'Continuidade', confidence: 0.95
                },
                {
                    RallyID: 1, Acao: 'Ataque', Equipe: 'Equipe B', Jogador: 'Player 3',
                    Tempo: '00:11', PontosEquipeA: 0, PontosEquipeB: 0, Lado: 'Ruim',
                    Resultado: 'Ponto', confidence: 0.88
                },
                {
                    RallyID: 2, Acao: 'Saque', Equipe: 'Equipe B', Jogador: 'Player 3',
                    Tempo: '00:25', PontosEquipeA: 0, PontosEquipeB: 1, Lado: 'Ruim',
                    Resultado: 'Erro', confidence: 0.99
                },
            ];
            setActions(mockActions);
            setIsAnalyzing(false);
        }, 3000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const seekTo = (timestamp: string) => {
        if (!videoRef.current) return;
        const [mins, secs] = timestamp.split(':').map(Number);
        const totalSecs = mins * 60 + secs;
        videoRef.current.currentTime = totalSecs;
        videoRef.current.play();
    };

    const onTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleEditAction = (index: number, updates: Partial<InferredAction>) => {
        const newActions = [...actions];
        newActions[index] = {
            ...newActions[index],
            ...updates,
            correctedValue: { ...newActions[index].correctedValue, ...updates }
        };
        setActions(newActions);
    };

    return (
        <div className="flex flex-col h-screen bg-background overflow-hidden">
            {/* Nav Header */}
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl px-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={onBack} size="sm" className="gap-2">
                        <History className="w-4 h-4" />
                        Sair do Lab
                    </Button>
                    <div className="h-6 w-[1px] bg-border" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <h1 className="text-sm font-black uppercase italic tracking-tighter">
                            A.I. Research Lab <span className="text-primary tracking-normal not-italic px-1.5 py-0.5 rounded bg-primary/10 text-[9px]">GEMINI 3.1 FLASH</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="gap-1 px-3 py-1 bg-primary/5 text-primary border-primary/20">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-bold">Experimental Mode</span>
                    </Badge>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Side: Video Player */}
                <div className="flex-1 flex flex-col bg-black/40 p-6 gap-6 min-w-0">
                    <div className="flex items-center justify-between bg-card/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            {!videoUrl ? (
                                <label className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black uppercase italic text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20">
                                    <Video className="w-4 h-4" />
                                    Carregar Vídeo da Partida
                                    <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
                                </label>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={startAIAnalysis}
                                        disabled={isAnalyzing}
                                        className="h-10 gap-2 border-primary/30 text-primary hover:bg-primary/10 font-bold uppercase text-[10px]"
                                    >
                                        <Brain className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                        {isAnalyzing ? 'Analisando vídeo...' : 'Detectar Ações com I.A.'}
                                    </Button>
                                    <div className="h-6 w-[1px] bg-border mx-2" />
                                    <div className="flex items-center gap-2 p-1 bg-black/20 rounded-lg border border-white/5">
                                        <Button
                                            variant={!showComparison ? "secondary" : "ghost"}
                                            size="sm"
                                            className="h-7 px-3 text-[9px] font-black uppercase italic"
                                            onClick={() => setShowComparison(false)}
                                        >
                                            <Eye className="w-3 h-3 mr-1" /> Lista Final
                                        </Button>
                                        <Button
                                            variant={showComparison ? "secondary" : "ghost"}
                                            size="sm"
                                            className="h-7 px-3 text-[9px] font-black uppercase italic"
                                            onClick={() => setShowComparison(true)}
                                        >
                                            <Users className="w-3 h-3 mr-1" /> Modo Comparativo
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative flex-1 bg-black rounded-3xl overflow-hidden border border-white/5 shadow-2xl group">
                        {videoUrl ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    className="w-full h-full object-contain"
                                    onTimeUpdate={onTimeUpdate}
                                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                />
                                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-6">
                                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-12 w-12 rounded-full backdrop-blur-md">
                                            {videoRef.current?.paused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                                        </Button>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-[10px] font-mono text-white/60">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-primary w-full"
                                                    style={{ transform: `translateX(-${100 - (currentTime / duration) * 100}%)` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 animate-pulse">
                                    <Video className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold italic uppercase tracking-tighter">Aguardando Vídeo</h3>
                                    <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold opacity-50">Transfira o vídeo da partida para iniciar o scout automático</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Action Editor / AI Results */}
                <div className="w-[420px] border-l border-border bg-card/30 backdrop-blur-2xl flex flex-col shrink-0">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-xs font-black uppercase italic italic tracking-wider text-primary">Inferred Activities</h2>
                            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-tighter">AI Confidence Index: <span className="text-green-500 font-bold">94.2%</span></p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                        {actions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale space-y-4 px-8">
                                <Brain className="w-12 h-12 mb-2" />
                                <p className="text-[10px] font-black uppercase leading-relaxed">
                                    Inicie a análise para que a I.A. detecte as ações, jogadores e ralis automaticamente.
                                </p>
                            </div>
                        ) : (
                            actions.map((action, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => seekTo(action.Tempo)}
                                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${selectedAction === idx
                                        ? 'bg-primary/10 border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                                        : 'bg-white/5 border-white/5 hover:border-white/20 hover:scale-[1.01]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xs ${action.Equipe === 'Equipe A' ? 'bg-primary/20 text-primary border border-primary/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {action.Acao.substring(0, 3).toUpperCase()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black uppercase italic tracking-tighter truncate max-w-[120px]">
                                                    {action.Jogador}
                                                </span>
                                                <Badge variant="outline" className={`text-[8px] h-4 px-1 ${action.Resultado === 'Ponto' ? 'border-green-500/50 text-green-500' :
                                                    action.Resultado === 'Erro' ? 'border-red-500/50 text-red-500' : 'border-white/20 text-white/40'
                                                    }`}>
                                                    {action.Resultado}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                                <Clock className="w-3 h-3 text-primary/50" />
                                                {action.Tempo}
                                                <span className="opacity-20 mx-1">/</span>
                                                <Brain className="w-3 h-3 text-green-500/50" />
                                                {(action.confidence * 100).toFixed(0)}%
                                                {action.correctedValue && (
                                                    <Badge className="bg-primary/20 text-primary border-0 text-[7px] h-3 px-1 ml-2">CORRIGIDO</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg hover:bg-white/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingIndex(idx);
                                                }}
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-400"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActions(actions.filter((_, i) => i !== idx));
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {editingIndex === idx && (
                                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2" onClick={e => e.stopPropagation()}>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">Jogador</label>
                                                    <Input
                                                        className="h-8 text-[10px] bg-white/5 border-white/10 font-bold"
                                                        value={action.Jogador}
                                                        onChange={(e) => handleEditAction(idx, { Jogador: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase px-1">Ação</label>
                                                    <select
                                                        className="w-full h-8 text-[10px] bg-white/5 border-white/10 font-bold rounded-md px-2 focus:ring-1 focus:ring-primary outline-none"
                                                        value={action.Acao}
                                                        onChange={(e) => handleEditAction(idx, { Acao: e.target.value as ActionType })}
                                                    >
                                                        <option value="Saque">Saque</option>
                                                        <option value="Recepção">Recepção</option>
                                                        <option value="Levantamento">Levantamento</option>
                                                        <option value="Ataque">Ataque</option>
                                                        <option value="Bloqueio">Bloqueio</option>
                                                        <option value="Defesa">Defesa</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" className="h-7 px-3 text-[10px] font-black uppercase italic" onClick={() => setEditingIndex(null)}>
                                                    Salvar Alterações
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-card/50 border-t border-white/5 space-y-4 shrink-0">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase italic tracking-tighter">
                            <span className="text-muted-foreground">Total de Eventos: {actions.length}</span>
                            <span className="text-primary hover:underline cursor-pointer">Ver Relatório de Precisão</span>
                        </div>
                        <Button className="w-full h-11 gap-2 font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20">
                            <Download className="w-4 h-4" />
                            Validar e Exportar Scout
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

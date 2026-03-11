import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Upload, FileSpreadsheet, Film, AlertCircle, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { GameAction, Rally, VideoData, Team } from '@/types/game';

interface Props {
    onDataLoaded: (data: {
        actions: GameAction[];
        rallies: Rally[];
        video: VideoData | null;
    }) => void;
    onGoToAiLab: () => void;
}

export default function FileImporter({ onDataLoaded, onGoToAiLab }: Props) {
    const [actions, setActions] = useState<GameAction[]>([]);
    const [rallies, setRallies] = useState<Rally[]>([]);
    const [video, setVideo] = useState<VideoData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const parseTime = (timestamp: string): number => {
        if (!timestamp) return 0;
        const parts = timestamp.split(':').map(parseFloat);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return parseFloat(timestamp) || 0;
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });

                // Process Scout / Ações
                const scoutSheetName = wb.SheetNames.find(n => {
                    const low = n.toLowerCase();
                    return low.includes('scout') || low.includes('acoes') || low.includes('ações') || low.includes('acao') || low.includes('ação');
                });

                if (scoutSheetName) {
                    const data = XLSX.utils.sheet_to_json(wb.Sheets[scoutSheetName]) as any[];
                    const mappedActions: GameAction[] = data.map((row: any) => {
                        // Handle name variations and encoding issues
                        const actionType = row['Ação'] || row['AÃ\u0087Ã\u0083O'] || row['ACAO'] || row['acao'] || '';
                        const equipe = (row['equipe'] || row['Equipe'] || '').toString();

                        return {
                            RallyID: parseInt(row['Rally ID'] || row['Rally'] || row['rally'] || '0'),
                            Acao: actionType,
                            Equipe: equipe.toUpperCase().includes('B') ? 'Equipe B' : 'Equipe A',
                            Jogador: row['Jogador'] || row['jogador'] || '',
                            Tipo: row['Tipo'] || row['tipo'] || '',
                            Qualidade: row['Qualidade'] || row['qualidade'] || '',
                            ZonaOrigem: row['Zona Orig'] || row['Zona Origem'] || row['zona_origem'] || '',
                            ZonaDestino: row['Zona Dest'] || row['Zona Destino'] || row['zona_destino'] || '',
                            Resultado: row['Resultado'] || row['resultado'] || '',
                            Tempo: row['Timestamp'] || row['Tempo'] || row['tempo'] || '',
                            PontosEquipeA: parseInt(row['Pontos A'] || row['pontos_a'] || '0'),
                            PontosEquipeB: parseInt(row['Pontos B'] || row['pontos_b'] || '0'),
                            Lado: row['Lado'] || row['lado'] || 'Bom',
                            Registro: row['Registro'] || row['registro'] || ''
                        } as GameAction;
                    });
                    setActions(mappedActions);
                }

                // Process Rallies / Video
                const ralliesSheetName = wb.SheetNames.find(n => {
                    const low = n.toLowerCase();
                    return low.includes('rallies') || low.includes('ralis') || low.includes('rally') || low.includes('partida_videos');
                });
                if (ralliesSheetName) {
                    const data = XLSX.utils.sheet_to_json(wb.Sheets[ralliesSheetName]) as any[];
                    const firstRow = data[0];
                    if (firstRow) {
                        let videoRallies: Rally[] = [];

                        // Check if it's the legacy format (JSON in video_rallies column) 
                        // or the new tabular format (each row is a rally)
                        if (firstRow['video_rallies']) {
                            try {
                                const rawRallies = firstRow['video_rallies'];
                                videoRallies = typeof rawRallies === 'string' ? JSON.parse(rawRallies) : rawRallies;

                                // Ensure Sec variants are present
                                videoRallies = videoRallies.map(r => ({
                                    ...r,
                                    startTimeSec: r.startTimeSec || parseTime(r.startTime),
                                    endTimeSec: r.endTimeSec || parseTime(r.endTime)
                                }));
                            } catch (e) {
                                console.warn('Falha ao processar JSON de ralis:', e);
                            }
                        } else if (firstRow['Rally ID'] || firstRow['Início (s)'] || firstRow['startTimeSec']) {
                            // tabular format
                            videoRallies = data.map((row: any) => ({
                                id: parseInt(row['Rally ID'] || row['Rally'] || row['id'] || '0'),
                                startTime: row['Início (UTC)'] || row['startTime'] || '',
                                endTime: row['Fim (UTC)'] || row['endTime'] || '',
                                startTimeSec: typeof row['Início (s)'] === 'string'
                                    ? parseFloat(row['Início (s)'].replace(',', '.'))
                                    : (row['Início (s)'] || row['startTimeSec'] || 0),
                                endTimeSec: typeof row['Fim (s)'] === 'string'
                                    ? parseFloat(row['Fim (s)'].replace(',', '.'))
                                    : (row['Fim (s)'] || row['endTimeSec'] || 0),
                                set: parseInt(row['Set'] || row['set'] || '1')
                            }));
                        }

                        setRallies(videoRallies);

                        // Parse team data if exists as JSON
                        let eqA: Team | undefined;
                        let eqB: Team | undefined;
                        try {
                            if (firstRow['equipea']) eqA = typeof firstRow['equipea'] === 'string' ? JSON.parse(firstRow['equipea']) : firstRow['equipea'];
                            if (firstRow['equipeb']) eqB = typeof firstRow['equipeb'] === 'string' ? JSON.parse(firstRow['equipeb']) : firstRow['equipeb'];
                        } catch (e) { }

                        setVideo({
                            titulo: firstRow['titulo'] || 'Vídeo Importado',
                            url: firstRow['video_url'] || '',
                            torneio: firstRow['torneio'],
                            fase: firstRow['fase'],
                            local: firstRow['local'],
                            etapa: firstRow['etapa'],
                            equipeA: eqA,
                            equipeB: eqB
                        });
                    }
                }

                setError(null);
            } catch (err) {
                setError('Erro ao processar arquivo. Verifique se o formato está correto.');
                console.error(err);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const videoUrl = URL.createObjectURL(file);
        setVideo({
            titulo: file.name,
            url: videoUrl,
        });
        setError(null);
    };

    const handleConfirm = () => {
        if (actions.length === 0 && !video) {
            setError('Por favor, importe ao menos um arquivo de scout ou um vídeo.');
            return;
        }
        onDataLoaded({ actions, rallies, video });
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black tracking-tighter uppercase italic">ScoutPro Client</h1>
                <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest opacity-60">Importação de Dados de Análise</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <label className="flex flex-col items-center justify-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-bold block">Importar Scout (XLSX/CSV)</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-mono">Dados da partida</span>
                        </div>
                        <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                    </label>
                </Card>

                <Card className="p-6 border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <label className="flex flex-col items-center justify-center gap-4 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                            <Film className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <span className="text-xs font-bold block">Upload Vídeo (Local)</span>
                            <span className="text-[9px] text-muted-foreground uppercase font-mono">MP4, WebM, OGG</span>
                        </div>
                        <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                    </label>
                </Card>
            </div>

            {(actions.length > 0 || video) && (
                <Card className="p-6 border-border bg-card/50 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">Resumo da Importação</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                            <FileSpreadsheet className="w-5 h-5 text-green-500" />
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Ações</p>
                                <p className="text-sm font-black">{actions.length}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/50">
                            <Film className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Vídeo</p>
                                <p className="text-sm font-black truncate max-w-[120px]">{video?.url ? 'Disponível' : 'Não encontrado'}</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 text-sm font-black uppercase italic tracking-tighter gap-2 shadow-lg shadow-primary/20"
                        onClick={handleConfirm}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Iniciar Dashboard de Análise
                    </Button>
                </Card>
            )}

            {error && (
                <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive animate-shake">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                </div>
            )}

            <div className="pt-4 border-t border-border/50">
                <Button
                    variant="ghost"
                    className="w-full h-14 gap-4 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-2xl group transition-all"
                    onClick={onGoToAiLab}
                >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                        <p className="text-xs font-black uppercase italic tracking-tighter">Laboratório de I.A.</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold opacity-60">Testar detecção automática (Gemini 3.1 Flash)</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    );
}

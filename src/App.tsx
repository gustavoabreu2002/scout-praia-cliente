import { useState } from 'react';
import FileImporter from './components/FileImporter';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import VideoPlayer from './components/VideoPlayer';
import AIVideoAnalysis from './components/AILab/AIVideoAnalysis';
import { GameAction, Rally, VideoData } from './types/game';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { ChevronLeft, Share2, Download, BarChart2 } from 'lucide-react';

interface LoadedData {
    actions: GameAction[];
    rallies: Rally[];
    video: VideoData | null;
}

function App() {
    const [data, setData] = useState<LoadedData | null>(null);
    const [requestedTime, setRequestedTime] = useState<number | null>(null);
    const [view, setView] = useState<'importer' | 'dashboard' | 'ailab'>('importer');

    if (view === 'importer') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
                <FileImporter
                    onDataLoaded={(loadedData) => {
                        setData(loadedData);
                        setView('dashboard');
                    }}
                    onGoToAiLab={() => setView('ailab')}
                />
            </div>
        );
    }

    if (view === 'ailab') {
        return <AIVideoAnalysis onBack={() => setView('importer')} />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Premium Header */}
            <header className="h-20 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50 px-8 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setData(null);
                            setView('importer');
                        }}
                        className="gap-2 font-bold uppercase tracking-tighter text-[10px] opacity-60 hover:opacity-100"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Nova Análise
                    </Button>
                    <div className="h-8 w-[1px] bg-border" />
                    <div className="space-y-0.5">
                        <h1 className="text-xl font-black tracking-tighter italic uppercase text-foreground">ScoutPro <span className="text-primary italic">Inside</span></h1>
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">{data?.video?.titulo || 'DASHBOARD ANALÍTICO'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-[10px] font-black uppercase">
                        <Download className="w-3.5 h-3.5" />
                        Exportar PDF
                    </Button>
                    <Button size="sm" className="h-9 gap-2 text-[10px] font-black uppercase">
                        <Share2 className="w-3.5 h-3.5" />
                        Compartilhar
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-8">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Main Analytics Area */}
                    <div className="xl:col-span-8 space-y-8">
                        {data && (() => {
                            const actualTeamA = Array.from(new Set(data.actions.filter(a => a.Equipe === 'Equipe A').map(a => a.Jogador))).filter(Boolean);
                            const actualTeamB = Array.from(new Set(data.actions.filter(a => a.Equipe === 'Equipe B').map(a => a.Jogador))).filter(Boolean);

                            return (
                                <AnalyticsDashboard
                                    actions={data.actions}
                                    teamA={actualTeamA.length > 0 ? actualTeamA : [data.video?.equipeA?.jogador1 || 'Jogador 1', data.video?.equipeA?.jogador2 || 'Jogador 2']}
                                    teamB={actualTeamB.length > 0 ? actualTeamB : [data.video?.equipeB?.jogador1 || 'Jogador 1', data.video?.equipeB?.jogador2 || 'Jogador 2']}
                                    videoRallies={data.rallies}
                                    videoSource={data.video}
                                    onPlayTime={(time) => setRequestedTime(time)}
                                />
                            );
                        })()}
                    </div>

                    {/* Fixed Video Sidebar */}
                    <div className="xl:col-span-4 sticky top-28 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vídeo da Análise</h2>
                        </div>

                        {data?.video?.url ? (
                            <VideoPlayer
                                video={data.video}
                                onClose={() => { }}
                                requestedTime={requestedTime}
                            />
                        ) : (
                            <Card className="aspect-video flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/50 bg-card/20">
                                <BarChart2 className="w-12 h-12 text-muted-foreground opacity-10 mb-4" />
                                <p className="text-[10px] font-black uppercase text-muted-foreground opacity-30 italic">Nenhum vídeo vinculado a este conjunto de dados</p>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;

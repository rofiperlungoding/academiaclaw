import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { KnowledgeStudioView } from './components/KnowledgeStudioView';
import { FlashcardReviewView } from './components/FlashcardReviewView';
import { TaskScheduleView } from './components/TaskScheduleView';
import { AgentTerminalView } from './components/AgentTerminalView';

import type {
  DocumentItem,
  KnowledgeGraphData,
  Flashcard,
  RetentionStats,
  AcademicTask,
  HeartbeatSummary,
  GatewayStatus,
  ModelItem
} from './types';
import { api } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null);

  const [tasks, setTasks] = useState<AcademicTask[]>([]);
  const [heartbeat, setHeartbeat] = useState<HeartbeatSummary | null>(null);

  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [models, setModels] = useState<ModelItem[]>([]);

  const fetchData = async () => {
    try {
      const [
        docsRes,
        cardsRes,
        statsRes,
        tasksRes,
        heartbeatRes,
        gatewayRes,
        modelsRes,
      ] = await Promise.allSettled([
        api.getDocuments(),
        api.getFlashcards(false),
        api.getRetentionStats(),
        api.getTasks(),
        api.getHeartbeatSummary(),
        api.getGatewayStatus(),
        api.getModels(),
      ]);

      if (docsRes.status === 'fulfilled') setDocuments(docsRes.value);
      if (cardsRes.status === 'fulfilled') setFlashcards(cardsRes.value);
      if (statsRes.status === 'fulfilled') setRetentionStats(statsRes.value);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value);
      if (heartbeatRes.status === 'fulfilled') setHeartbeat(heartbeatRes.value);
      if (gatewayRes.status === 'fulfilled') setGatewayStatus(gatewayRes.value);
      if (modelsRes.status === 'fulfilled') setModels(modelsRes.value);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const fetchGraph = async (docId?: string | null) => {
    try {
      const data = await api.getGraph(docId || undefined);
      setGraphData(data);
    } catch (err) {
      console.error('Error fetching graph data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchGraph(selectedDocId);
  }, [selectedDocId]);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await api.updateTask(taskId, { status: nextStatus });
      fetchData();
    } catch (err: any) {
      alert('Failed to update task');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gatewayStatus={gatewayStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewView
            stats={retentionStats}
            tasks={tasks}
            heartbeat={heartbeat}
            gatewayStatus={gatewayStatus}
            onNavigate={setActiveTab}
            onToggleTask={handleToggleTask}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeStudioView
            documents={documents}
            graphData={graphData}
            selectedDocId={selectedDocId}
            setSelectedDocId={setSelectedDocId}
            onRefresh={() => {
              fetchData();
              fetchGraph(selectedDocId);
            }}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardReviewView
            cards={flashcards}
            stats={retentionStats}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskScheduleView tasks={tasks} onRefresh={fetchData} />
        )}

        {activeTab === 'agent' && (
          <AgentTerminalView gatewayStatus={gatewayStatus} models={models} />
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-4 bg-[#070A10]">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono">
          AcademiaClaw · AI Competition IDwebhost · OpenClaw Gateway · LightRAG + FSRS-6
        </div>
      </footer>
    </div>
  );
}

export default App;

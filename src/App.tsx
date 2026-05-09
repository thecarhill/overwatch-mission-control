import { AppProvider } from './context/AppContext'
import { useApp } from './context/useApp'
import { Shell } from './components/layout/Shell'
import { BriefingPanel } from './components/briefing/BriefingPanel'
import { ProjectsPanel } from './components/projects/ProjectsPanel'
import { LeadsPanel } from './components/leads/LeadsPanel'
import { PipelinePanel } from './components/pipeline/PipelinePanel'
import { InboxPanel } from './components/inbox/InboxPanel'
import { ConfigPanel } from './components/config/ConfigPanel'
import { AllTasksPanel } from './components/taskboard/AllTasksPanel'

function Panels() {
  const { tab } = useApp()
  return (
    <>
      {tab === 'briefing' && <BriefingPanel />}
      {tab === 'projects' && <ProjectsPanel />}
      {tab === 'taskboard' && <AllTasksPanel />}
      {tab === 'leads' && <LeadsPanel />}
      {tab === 'pipeline' && <PipelinePanel />}
      {tab === 'inbox' && <InboxPanel />}
      {tab === 'config' && <ConfigPanel />}
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell>
        <Panels />
      </Shell>
    </AppProvider>
  )
}

import { type ReactNode } from "react"
import TopBar from "./TopBar"
import AppSidebar from "./AppSidebar"
import AgentAnalysisToast from "./AgentAnalysisToast"
import AgentEmptyToast from "./AgentEmptyToast"
import SuggestionsModal from "./SuggestionsModal"
import ReorgModal from "./ReorgModal"
import { AgentProvider } from "../contexts/AgentContext"

type Props = {
  children: ReactNode
}

function AppShell({ children }: Props) {
  return (
    <AgentProvider>
      <div className="h-screen w-full overflow-hidden flex flex-col noise">
        <TopBar />
        <div className="flex-1 flex overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-hidden flex flex-col grid-bg">
            {children}
          </main>
        </div>
        <AgentAnalysisToast />
        <AgentEmptyToast />
        <SuggestionsModal />
        <ReorgModal />
      </div>
    </AgentProvider>
  )
}

export default AppShell

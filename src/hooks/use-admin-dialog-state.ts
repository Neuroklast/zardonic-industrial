import { useState } from 'react'
import type { AdminDialog } from '@/lib/types'

export interface AdminDialogState {
  activeDialog: AdminDialog
  setActiveDialog: (v: AdminDialog) => void
  showLoginDialog: boolean
  setShowLoginDialog: (v: boolean) => void
  showSetupDialog: boolean
  setShowSetupDialog: (v: boolean) => void
  showBandInfoEdit: boolean
  setShowBandInfoEdit: (v: boolean) => void
  impressumOpen: boolean
  setImpressumOpen: (v: boolean) => void
  datenschutzOpen: boolean
  setDatenschutzOpen: (v: boolean) => void
  showAttackerProfile: boolean
  setShowAttackerProfile: (v: boolean) => void
  selectedAttackerIp: string
  setSelectedAttackerIp: (v: string) => void
  openAdminHubOnMount: boolean
  setOpenAdminHubOnMount: (v: boolean) => void
}

export function useAdminDialogState(): AdminDialogState {
  const [activeDialog, setActiveDialog] = useState<AdminDialog>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showBandInfoEdit, setShowBandInfoEdit] = useState(false)
  const [impressumOpen, setImpressumOpen] = useState(false)
  const [datenschutzOpen, setDatenschutzOpen] = useState(false)
  const [showAttackerProfile, setShowAttackerProfile] = useState(false)
  const [selectedAttackerIp, setSelectedAttackerIp] = useState('')
  const [openAdminHubOnMount, setOpenAdminHubOnMount] = useState(false)

  return {
    activeDialog, setActiveDialog,
    showLoginDialog, setShowLoginDialog,
    showSetupDialog, setShowSetupDialog,
    showBandInfoEdit, setShowBandInfoEdit,
    impressumOpen, setImpressumOpen,
    datenschutzOpen, setDatenschutzOpen,
    showAttackerProfile, setShowAttackerProfile,
    selectedAttackerIp, setSelectedAttackerIp,
    openAdminHubOnMount, setOpenAdminHubOnMount,
  }
}

export type OSType = 'linux' | 'windows';

export type UserRole = 'student' | 'instructor';

export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  permissions?: string; // ex: "-rwsr-xr-x" (Linux) ou "NTFS: Full Control SYSTEM, Read/Write User" (Windows)
  owner?: string; // ex: "root", "aluno", "SYSTEM", "Administrator"
  group?: string; // ex: "root", "developers", "Administrators"
  size?: number;
  updatedAt?: string;
  children?: Record<string, FileNode>;
  isProtected?: boolean;
}

export interface OSProcess {
  pid: number;
  ppid: number; // Identificador do Processo Pai (Parent Process ID)
  name: string;
  user: string;
  cpu: number;
  memoryMb: number;
  path: string;
  expectedPath: string; // Caminho padrão esperado pelo SO
  status: 'running' | 'sleeping' | 'stopped';
  isSuspicious?: boolean;
  isProtectedProcess?: boolean; // Processo crítico protegido (ex: PPL no Windows ou PID 1/2 no Linux)
  integrityLevel?: 'System' | 'High' | 'Medium' | 'Low' | 'Untrusted';
  description?: string;
  cybersecRole?: string; // Função de segurança e relevância para o analista
  mitreRef?: string;
  networkPort?: number;
}

export interface OSService {
  name: string;
  displayName: string;
  status: 'running' | 'stopped';
  startup: 'automatic' | 'manual' | 'disabled';
  binaryPath: string;
  account: string;
  isVulnerable?: boolean;
  vulnerabilityNote?: string;
}

export interface OSLogEntry {
  id: string;
  timestamp: string;
  source: string; // ex: "auth.log", "Security.evtx", "Sysmon", "journald"
  eventId?: number; // Para Windows (ex: 4624, 4625, 4672, 7045)
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  user: string;
  message: string;
  isSuspicious?: boolean;
}

export interface SyscallTrace {
  id: string;
  timestamp: string;
  os: OSType;
  syscall: string; // ex: "openat", "execve", "read", "clone", "NtOpenFile", "NtCreateProcessEx"
  subsystem: 'Memory' | 'FileSystem' | 'Process' | 'Network' | 'Security';
  parameters: string;
  returnCode: number | string;
  ringLevel: 'Ring 3 (User Mode)' | 'Ring 0 (Kernel Mode)';
  explanation: string;
}

export interface EDRAlert {
  id: string;
  timestamp: string;
  os: OSType;
  ruleName: string;
  severity: 'BAIXA' | 'MÉDIA' | 'ALTA' | 'CRÍTICA';
  mitreId: string;
  mitreTechnique: string;
  triggeredCommand: string;
  analystSummary: string;
  remediationAdvice: string;
}

export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
  syscalls?: SyscallTrace[];
  edrAlerts?: EDRAlert[];
  stateChanges?: {
    filesModified?: string[];
    processKilled?: number;
    flagDiscovered?: string;
  };
}

export interface LabTask {
  id: string;
  title: string;
  instructions: string;
  targetOS: OSType | 'both';
  objective: string;
  hint: string;
  validationCommand?: string;
  expectedOutputSubstring?: string;
  flagReward?: string;
  isCompleted?: boolean;
}

export interface LabDefinition {
  id: string;
  moduleSlug: string;
  title: string;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  category: 'Permissões & Acesso' | 'Processos & Memória' | 'Persistência & Serviços' | 'Auditoria & Logs' | 'Hardening';
  durationMinutes: number;
  description: string;
  realWorldScenario: string;
  mitreTechniques: { id: string; name: string }[];
  learningGoals: string[];
  tasks: LabTask[];
  initialLinuxFs?: Record<string, FileNode>;
  initialWindowsFs?: Record<string, FileNode>;
}

export interface CurriculumModule {
  id: string;
  title: string;
  subtitle: string;
  isOpenSourceVsClosed: {
    openSourceConcepts: string[];
    closedSourceConcepts: string[];
    comparativeAnalysis: string;
  };
  cybersecRelevance: string;
  subtopics: {
    title: string;
    description: string;
    linuxSyntax: string;
    windowsSyntax: string;
    defensePerspective: string;
    offensePerspective: string;
  }[];
  labIds: string[];
}

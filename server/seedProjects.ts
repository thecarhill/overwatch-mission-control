import type Database from 'better-sqlite3'
import { upsertFile } from './fileStore.js'
import {
  type ParsedState,
  serializeStateMd,
} from './stateMd.js'

function md(state: ParsedState): string {
  return serializeStateMd(state)
}

/** Inventario alineado con el repo overwatch original (thecarhill/overwatch). Solo corre si no hay ningún state.md bajo projects/. */
export function seedProjectsIfEmpty(db: Database.Database): void {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM files WHERE path GLOB 'projects/*/state.md'`,
    )
    .get() as { c: number }
  if (row.c > 0) return

  const seeds: { slug: string; state: ParsedState }[] = [
    {
      slug: 'mesa-landing-2',
      state: {
        projectName: 'mesa-landing-2',
        status: 'WIP',
        priority: '02_HIGH',
        currentTask:
          'Landings Mesa por plantilla: Variant HTML/React + órdenes .md para agentes Cursor (assembly.md); scrapeo de leads y envío planificado.',
        nextAction:
          'Cerrar un ciclo piloto: una carpeta plantilla con órdenes claras y output revisable del agente según assembly.md.',
        blocker: '',
        parkingLot: [
          'Automatizar scrapeo de datos de leads + placeholders',
          'Pipeline de envío a leads',
          'Investigar fuente / listado de leads',
        ],
        sessionLog: [
          {
            date: '2026-05-03',
            note:
              'Importado desde repo overwatch: ACTIVE; foco plantillas → agentes.',
          },
        ],
      },
    },
    {
      slug: 'operator',
      state: {
        projectName: 'OPERATOR',
        status: 'PARKED',
        priority: '02_HIGH',
        currentTask:
          'Strength Cut: spec y mapping de ejercicios a Hevy; stack FastAPI+SQLite+Traefik; aún sin código de integración Hevy.',
        nextAction:
          'Primer script que llame a la API de Hevy y devuelva workout logs reales.',
        blocker: '',
        parkingLot: [
          'Deload detection',
          'UI COCKPIT / PROGRAM / LOG',
          'Telegram bot',
        ],
        sessionLog: [
          {
            date: '2026-05-02',
            note:
              'Estado inicial documentado en overwatch; ACTIVE global era mesa-landing-2.',
          },
        ],
      },
    },
    {
      slug: 'overwatch',
      state: {
        projectName: 'OVERWATCH',
        status: 'PARKED',
        priority: '03_STANDARD',
        currentTask:
          'Sistema de briefing: inbox, state.md por proyecto, referencia para agentes (esta app).',
        nextAction: 'Usar Mission Control para mantener inventario y sesiones.',
        blocker: '',
        parkingLot: [],
        sessionLog: [
          {
            date: '2026-05-03',
            note: 'Registro de proyectos sincronizado con SQLite / panel.',
          },
        ],
      },
    },
    {
      slug: 'mesa-demo-landing',
      state: {
        projectName: 'mesa-demo-landing',
        status: 'PARKED',
        priority: '03_STANDARD',
        currentTask:
          'Precursor landings Mesa (Brisa/Umamia, hash routing); trabajo activo en mesa-landing-2.',
        nextAction: 'Mantener solo referencia; desarrollo en fork mesa-landing-2.',
        blocker: '',
        parkingLot: [],
        sessionLog: [],
      },
    },
    {
      slug: 'ascend',
      state: {
        projectName: 'ASCEND',
        status: 'PARKED',
        priority: '03_STANDARD',
        currentTask:
          'Life OS: FastAPI + Expo, Hevy, Supabase — workout v0 (repo ascendos).',
        nextAction: 'Definir siguiente hito cuando se reactiva frente a OPERATOR.',
        blocker: '',
        parkingLot: [],
        sessionLog: [],
      },
    },
    {
      slug: 'ascend-os',
      state: {
        projectName: 'ascend-os',
        status: 'PARKED',
        priority: '04_BACKLOG',
        currentTask: 'Legacy / experimento ASCEND; README poco claro.',
        nextAction: 'Decidir archivo vs kill según estrategia ascend.',
        blocker: '',
        parkingLot: [],
        sessionLog: [],
      },
    },
    {
      slug: 'ant-mission-manager',
      state: {
        projectName: 'ant-mission-manager',
        status: 'DONE',
        priority: '03_STANDARD',
        currentTask:
          'Flask: misiones y benchmarks ANT (BlueBotics AGV), colas, import CSV/Excel — entregado (DONE en inventario overwatch).',
        nextAction: 'Solo mantenimiento si vuelve a prioridad.',
        blocker: '',
        parkingLot: [],
        sessionLog: [
          {
            date: '2026-03-08',
            note: 'Marcado DONE en inventario legacy; tracking histórico aquí.',
          },
        ],
      },
    },
    {
      slug: 'mesa',
      state: {
        projectName: 'Mesa',
        status: 'PARKED',
        priority: '02_HIGH',
        currentTask:
          'Producto: reservas, mapa de sala, perfiles, bot WhatsApp (Next.js, Clerk, Supabase…).',
        nextAction: 'Reactivar cuando landings/mesa-landing-2 estabilicen outreach.',
        blocker: '',
        parkingLot: [],
        sessionLog: [],
      },
    },
    {
      slug: 'hevy-board',
      state: {
        projectName: 'hevy-board',
        status: 'KILLED',
        priority: '04_BACKLOG',
        currentTask:
          'Dashboard Hevy (FastAPI + SQLite) — KILLED en inventario; lógica absorbida por ASCEND.',
        nextAction: 'Sin trabajo; referencia histórica.',
        blocker: '',
        parkingLot: [],
        sessionLog: [
          {
            date: '2026-02-28',
            note: 'Post-mortem en repo overwatch archive; no revivir salvo decisión explícita.',
          },
        ],
      },
    },
  ]

  for (const { slug, state } of seeds) {
    upsertFile(db, `projects/${slug}/state.md`, md(state))
  }

  const registry = `# PROJECTS

Registro generado automáticamente en primer arranque (vacío). Inventario alineado con github.com/thecarhill/overwatch.

- mesa-landing-2 — mesa-landing-2
- operator — OPERATOR
- overwatch — OVERWATCH
- mesa-demo-landing — mesa-demo-landing
- ascend — ASCEND
- ascend-os — ascend-os
- ant-mission-manager — ant-mission-manager
- mesa — Mesa
- hevy-board — hevy-board
`
  upsertFile(db, 'projects.md', registry.trimEnd() + '\n')
}

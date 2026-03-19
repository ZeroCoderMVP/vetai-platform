import { Scenario, defaultBaselineParameters } from '@/types/scenario';

const STORAGE_KEY = 'vetai_scenarios';

export function createBaselineScenario(): Scenario {
  return {
    id: 'baseline',
    name: 'Базовый сценарий',
    description: 'Текущее состояние фермы',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timeHorizon: 3,
    parameters: { ...defaultBaselineParameters },
    isBaseline: true,
  };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export class ScenarioStorage {
  private scenarios: Map<string, Scenario> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') {
      // Server-side rendering, return baseline only
      const baseline = createBaselineScenario();
      this.scenarios.set(baseline.id, baseline);
      return;
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: Scenario[] = JSON.parse(data);
        parsed.forEach(p => this.scenarios.set(p.id, p));
      }
    } catch (e) {
      console.error('Failed to load scenarios', e);
    }
    
    // Ensure baseline always exists
    if (!this.scenarios.has('baseline')) {
      const baseline = createBaselineScenario();
      this.scenarios.set(baseline.id, baseline);
      this.save();
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      try {
        const arr = Array.from(this.scenarios.values());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      } catch (e) {
        console.error('Failed to save scenarios', e);
      }
    }
  }

  getAll(): Scenario[] {
    return Array.from(this.scenarios.values()).sort((a, b) => {
      // Baseline always first
      if (a.isBaseline) return -1;
      if (b.isBaseline) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  getById(id: string): Scenario | null {
    return this.scenarios.get(id) || null;
  }

  saveScenario(scenario: Scenario): Scenario {
    const updated = {
      ...scenario,
      updatedAt: new Date().toISOString()
    };
    if (!updated.id) {
      updated.id = generateId();
      updated.createdAt = updated.updatedAt;
    }
    
    // We do not overwrite baseline parameters if it's explicitly baseline. 
    // Usually baseline is read-only, but if save is called, we can allow it over localStorage,
    // though visually it should be protected.
    this.scenarios.set(updated.id, updated);
    this.save();
    
    return updated;
  }

  deleteScenario(id: string): void {
    if (id === 'baseline') return; // Cannot delete baseline
    if (this.scenarios.has(id)) {
      this.scenarios.delete(id);
      this.save();
    }
  }
}

// Singleton instance for the browser
let instance: ScenarioStorage | null = null;

export function getScenarioStorage(): ScenarioStorage {
  if (!instance) {
    instance = new ScenarioStorage();
  }
  return instance;
}

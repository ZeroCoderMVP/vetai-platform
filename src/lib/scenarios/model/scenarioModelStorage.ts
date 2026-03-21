import { ScenarioModelProfile } from "@/types/scenarioModel";
import { defaultScenarioModelProfile } from "./scenarioModelDefaults";

const STORAGE_KEY = 'vetai_scenario_model_profiles';

export function getScenarioModelStorage() {
  const isBrowser = typeof window !== 'undefined';

  const getAll = (): ScenarioModelProfile[] => {
    if (!isBrowser) return [defaultScenarioModelProfile];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Initialize with default
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultScenarioModelProfile]));
      return [defaultScenarioModelProfile];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [defaultScenarioModelProfile];
    }
  };

  const getById = (id: string): ScenarioModelProfile | undefined => {
    const all = getAll();
    return all.find(p => p.id === id);
  };

  const getActive = (): ScenarioModelProfile => {
    const all = getAll();
    const active = all.find(p => p.isActive);
    return active || defaultScenarioModelProfile;
  };

  const saveProfile = (profile: ScenarioModelProfile): void => {
    if (!isBrowser) return;
    const all = getAll();
    const existingIndex = all.findIndex(p => p.id === profile.id);
    
    // If setting active, deactivate others
    if (profile.isActive) {
      all.forEach(p => { p.isActive = false; });
    }

    if (existingIndex >= 0) {
      all[existingIndex] = { ...profile, updatedAt: new Date().toISOString() };
    } else {
      all.push({
        ...profile,
        id: profile.id || `profile-${Date.now()}`,
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  };

  const deleteProfile = (id: string): void => {
    if (!isBrowser) return;
    let all = getAll();
    if (id === defaultScenarioModelProfile.id) return; // Cannot delete default
    
    all = all.filter(p => p.id !== id);
    if (!all.some(p => p.isActive) && all.length > 0) {
      all[0].isActive = true;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  };

  return { getAll, getById, getActive, saveProfile, deleteProfile };
}

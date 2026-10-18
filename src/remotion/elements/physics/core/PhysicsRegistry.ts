import { IPhysicsPresetDefinition } from './types'
import { NewtonCradlePreset } from '../presets/NewtonCradlePreset'
import { InclinedPlanePreset } from '../presets/InclinedPlanePreset'
import { ProjectileMotionPreset } from '../presets/ProjectileMotionPreset'
import { SpringHarmonicPreset } from '../presets/SpringHarmonicPreset'
import { BouncingBoxPreset } from '../presets/BouncingBoxPreset'
import { GalileoFallPreset, AngleBattlePreset, FrictionBattlePreset } from '../presets/ComparisonPresets'
import { BrachistochronePreset } from '../presets/BrachistochronePreset'
import { PlanetsGravityPreset } from '../presets/PlanetsGravityPreset'

export class PhysicsRegistry {
  private static presets: Map<string, IPhysicsPresetDefinition> = new Map([
    [NewtonCradlePreset.id, NewtonCradlePreset],
    [InclinedPlanePreset.id, InclinedPlanePreset],
    [ProjectileMotionPreset.id, ProjectileMotionPreset],
    [SpringHarmonicPreset.id, SpringHarmonicPreset],
    [BouncingBoxPreset.id, BouncingBoxPreset],
    [GalileoFallPreset.id, GalileoFallPreset],
    [AngleBattlePreset.id, AngleBattlePreset],
    [FrictionBattlePreset.id, FrictionBattlePreset],
    [BrachistochronePreset.id, BrachistochronePreset],
    [PlanetsGravityPreset.id, PlanetsGravityPreset],
  ])

  public static getAllPresets(): IPhysicsPresetDefinition[] {
    return Array.from(this.presets.values())
  }

  public static getPreset(id: string): IPhysicsPresetDefinition | undefined {
    return this.presets.get(id) || this.presets.get('newton-cradle')
  }

  public static registerPreset(preset: IPhysicsPresetDefinition) {
    this.presets.set(preset.id, preset)
  }
}

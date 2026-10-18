import { IParadoxDefinition } from './types';
import { AristotleWheelPlugin } from './plugins/AristotleWheelPlugin';
import { TrafficFlowPlugin } from './plugins/TrafficFlowPlugin';
import { BrachistochronePlugin } from './plugins/BrachistochronePlugin';
import { SortingDuelPlugin } from './plugins/SortingDuelPlugin';
import { NeuralNetworkPlugin } from './plugins/NeuralNetworkPlugin';
import { DynamicSandboxPlugin } from './plugins/DynamicSandboxPlugin';

export class ParadoxRegistry {
  private static plugins: Map<string, IParadoxDefinition> = new Map([
    [AristotleWheelPlugin.id, AristotleWheelPlugin],
    [TrafficFlowPlugin.id, TrafficFlowPlugin],
    [BrachistochronePlugin.id, BrachistochronePlugin],
    [SortingDuelPlugin.id, SortingDuelPlugin],
    [NeuralNetworkPlugin.id, NeuralNetworkPlugin],
    [DynamicSandboxPlugin.id, DynamicSandboxPlugin],
  ]);

  public static getAll(): IParadoxDefinition[] {
    return Array.from(this.plugins.values());
  }

  public static get(id: string): IParadoxDefinition {
    return this.plugins.get(id) || AristotleWheelPlugin;
  }

  public static register(plugin: IParadoxDefinition): void {
    this.plugins.set(plugin.id, plugin);
  }
}

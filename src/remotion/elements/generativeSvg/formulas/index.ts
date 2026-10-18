import { FormulaModule } from '../types';
import { QuantumOrbitModule } from './stem/quantumOrbit';
import { LorenzAttractorModule } from './stem/lorenzAttractor';
import { DnaHelixModule } from './stem/dnaHelix';
import { RoseCurveModule } from './stem/roseCurve';
import { ExponentialSurgeModule } from './finance/exponentialSurge';
import { FibonacciSpiralModule } from './finance/fibonacciSpiral';
import { HarmonicWaveModule } from './finance/harmonicWave';
import { SingularityVortexModule } from './finance/singularityVortex';
import { NetworkMeshModule } from './strategy/networkMesh';
import { BifurcationTreeModule } from './strategy/bifurcationTree';
import { NeuralPulseModule } from './strategy/neuralPulse';
import { CyberShieldModule } from './strategy/cyberShield';
import { SpacetimeGridModule } from './cosmos/spacetimeGrid';
import { LissajousCurveModule } from './cosmos/lissajousCurve';
import { MobiusLoopModule } from './cosmos/mobiusLoop';
import { DoublePendulumModule } from './cosmos/doublePendulum';
import { EcgHeartbeatModule } from './vitality/ecgHeartbeat';
import { TesseractHypercubeModule } from './vitality/tesseractHypercube';
import { StreamlineFlowModule } from './vitality/streamlineFlow';
import { TorusFieldModule } from './vitality/torusField';

export const ALL_FORMULAS: FormulaModule[] = [
  QuantumOrbitModule,
  LorenzAttractorModule,
  DnaHelixModule,
  RoseCurveModule,
  ExponentialSurgeModule,
  FibonacciSpiralModule,
  HarmonicWaveModule,
  SingularityVortexModule,
  NetworkMeshModule,
  BifurcationTreeModule,
  NeuralPulseModule,
  CyberShieldModule,
  SpacetimeGridModule,
  LissajousCurveModule,
  MobiusLoopModule,
  DoublePendulumModule,
  EcgHeartbeatModule,
  TesseractHypercubeModule,
  StreamlineFlowModule,
  TorusFieldModule,
];

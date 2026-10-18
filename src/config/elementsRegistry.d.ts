import {
  ElementCategory,
  RegisteredElementType,
  ElementVariant,
  ElementUiConfig,
  ElementDefinition,
  UiChartItem,
  UiChartGroup,
  ElementsRegistryMap,
  CoreCatalogMap,
} from './elementsTypes';

export * from './elementsTypes';

export declare const ELEMENT_CATEGORIES: {
  TYPOGRAPHY_BASIC: 'TYPOGRAPHY_BASIC';
  DATA_CHARTS: 'DATA_CHARTS';
  INFOGRAPHICS_FRAMEWORKS: 'INFOGRAPHICS_FRAMEWORKS';
  CINEMA_SOCIAL_PROOF: 'CINEMA_SOCIAL_PROOF';
  DYNAMIC_FLOWS_PRO: 'DYNAMIC_FLOWS_PRO';
};

export declare const UI_CHART_GROUPS: string[];

export declare const ELEMENTS_REGISTRY: ElementsRegistryMap;

export declare function getCoreCatalog(ACCENT: string): CoreCatalogMap;

export declare function getChartsForUi(): UiChartGroup[];

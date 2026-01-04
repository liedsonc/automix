declare module 'react-native-svg-charts' {
  import { Component } from 'react';
    import { ViewStyle } from 'react-native';

  export interface PieChartData {
    value: number;
    svg?: any;
    key?: string;
  }

  export interface PieChartProps {
    data: PieChartData[];
    style?: ViewStyle;
    innerRadius?: number | string;
    outerRadius?: number | string;
    padAngle?: number;
    labelRadius?: number;
    valueAccessor?: (item: any) => number;
  }

  export class PieChart extends Component<PieChartProps> {}
}

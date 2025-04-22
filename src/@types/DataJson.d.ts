interface DataJson {
  title: string;
  types: DataType[];
}

/** Topmost level: the item type */
interface DataType {
  name: string;
  selected: boolean;
  types: TypeType[];
  /** Svg file path */
  svg: string;
  /** Loaded svg data */
  svgNew?: string;
  /** Does it exist here? */
  // colors?: Color[];
}

/* The 2nd level: the item features */
interface TypeType {
  title: string;
  colors?: Color[];
  options: TypeOption[];
  size?: boolean;
  checkbox?: boolean;
  /** Loaded svg data */
  svgNew?: string;
}

interface TypeColor {
  name: ColorName;
  code: string;
  selected: boolean;
}

enum ColorName {
  Белый = 'Белый',
  Голубой = 'Голубой',
  Желтый = 'Желтый',
  Красный = 'Красный',
  Оранжевый = 'Оранжевый',
  Розовый = 'Розовый',
  Салатовый = 'Салатовый',
  Серый = 'Серый',
  СерыйМеланж = 'Серый меланж',
  Синий = 'Синий',
  ТемноСерыйГрафит = 'Темно-серый (графит)',
  Фиолетовый = 'Фиолетовый',
  Хакки = 'Хакки',
  Черный = 'Черный',
}

interface TypeOption {
  name: string;
  selected: boolean;
  selections?: TypeSelection[];
  selectionsChoose?: string;
  count?: number;
  /** Svg file path */
  svg?: string;
  /** Loaded svg data */
  svgNew?: string;
}

interface TypeSelection {
  name: string;
}

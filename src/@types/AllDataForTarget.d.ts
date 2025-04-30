interface AllDataForTarget {
  row: HTMLTableRowElement;
  dataset: DOMStringMap;
  typeIdx: number;
  pricesSelected: number[][];
  selectedList?: number[];
  data: DataJson;
  dataType: DataType;
  prices?: PriceItem[];
}

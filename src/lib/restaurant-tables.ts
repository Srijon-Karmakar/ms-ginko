export type RestaurantTable = {
  id: string;
  label: string;
  capacity: number;
  zone: "window" | "center" | "patio";
  shape: "rect-wide" | "rect-mid" | "rect-tall" | "round";
  x: string;
  y: string;
  width: string;
  height: string;
  active?: boolean;
};

export const restaurantTables: RestaurantTable[] = [
  {
    id: "t1",
    label: "Table 1",
    capacity: 4,
    zone: "window",
    shape: "rect-wide",
    x: "18%",
    y: "81%",
    width: "20%",
    height: "12%",
    active: true,
  },
  {
    id: "t2",
    label: "Table 2",
    capacity: 4,
    zone: "window",
    shape: "rect-wide",
    x: "17%",
    y: "49%",
    width: "20%",
    height: "11%",
    active: true,
  },
  {
    id: "t3",
    label: "Table 3",
    capacity: 4,
    zone: "window",
    shape: "rect-wide",
    x: "18%",
    y: "21%",
    width: "18%",
    height: "12%",
    active: true,
  },
  {
    id: "t4",
    label: "Table 4",
    capacity: 2,
    zone: "center",
    shape: "rect-mid",
    x: "40%",
    y: "21%",
    width: "13%",
    height: "11%",
    active: true,
  },
  {
    id: "t5",
    label: "Table 5",
    capacity: 2,
    zone: "center",
    shape: "rect-mid",
    x: "57%",
    y: "21%",
    width: "11%",
    height: "11%",
    active: true,
  },
  {
    id: "t6",
    label: "Table 6",
    capacity: 6,
    zone: "center",
    shape: "round",
    x: "47%",
    y: "56%",
    width: "14%",
    height: "14%",
    active: true,
  },
  {
    id: "t7",
    label: "Table 7",
    capacity: 6,
    zone: "patio",
    shape: "rect-tall",
    x: "82%",
    y: "40%",
    width: "18%",
    height: "48%",
    active: true,
  },
  {
    id: "t8",
    label: "Table 8",
    capacity: 6,
    zone: "patio",
    shape: "rect-wide",
    x: "73%",
    y: "80%",
    width: "22%",
    height: "12%",
    active: true,
  },
  {
    id: "t9",
    label: "Table 9",
    capacity: 4,
    zone: "center",
    shape: "rect-mid",
    x: "37%",
    y: "82%",
    width: "14%",
    height: "10%",
    active: true,
  },
  {
    id: "t10",
    label: "Table 10",
    capacity: 2,
    zone: "center",
    shape: "rect-mid",
    x: "60%",
    y: "82%",
    width: "10%",
    height: "9%",
    active: true,
  },
];

export const getRestaurantTableById = (tableId: string) => {
  return restaurantTables.find((table) => table.id === tableId) ?? null;
};

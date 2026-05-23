const CAR_ROUTE_COLORS = ['#3d8bfd', '#16a34a', '#ea580c', '#9333ea'] as const;

export function getCarRouteColor(carId: string): string {
  let hash = 0;
  for (let i = 0; i < carId.length; i++) {
    hash = (hash + carId.charCodeAt(i) * (i + 1)) % CAR_ROUTE_COLORS.length;
  }
  return CAR_ROUTE_COLORS[hash];
}

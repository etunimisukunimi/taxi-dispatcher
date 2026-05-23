import { fetchOsrmRoute } from '../services/routing';
import type { LatLng, RouteResult } from '../types/game';

const MAX_CONCURRENT = 2;
let active = 0;
const queue: Array<() => void> = [];

function pump() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    active++;
    const job = queue.shift()!;
    job();
  }
}

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      fn()
        .then(resolve, reject)
        .finally(() => {
          active--;
          pump();
        });
    };
    queue.push(run);
    pump();
  });
}

export function fetchRouteQueued(
  from: LatLng,
  to: LatLng,
): Promise<RouteResult | null> {
  return schedule(() => fetchOsrmRoute(from, to));
}

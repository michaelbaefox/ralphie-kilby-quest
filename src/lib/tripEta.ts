/** Matches forecast ETA math in WeatherProvider `buildWaypointPlan`. */
export const ROUTE_AVG_SPEED_MPH = 60

/** Estimated wall-clock arrival at a point `milesAhead` down-route from current progress. */
export const etaMsForMilesAhead = (milesAhead: number, departTimeIso: string | null): number => {
  const departMs = departTimeIso ? new Date(departTimeIso).getTime() : Date.now()
  return departMs + (milesAhead / ROUTE_AVG_SPEED_MPH) * 3_600_000
}

import narrative from '../data/narrative_steps.json'
import { useTrip } from '../context/TripContext'
import type { NarrativeStep } from '../types'

export const QuestLog = () => {
  const trip = useTrip()
  const steps = narrative as NarrativeStep[]
  const visible = steps.filter((s) => trip.progress + 0.0001 >= s.minProgress)

  return (
    <div className="pixelPanel">
      <h2>Quest log</h2>
      <p className="muted">New entries unlock the farther west you roll.</p>
      <div className="list">
        {visible.map((s) => (
          <article key={s.id} className="listItem">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{s.title}</strong>
              {s.stateHint && <span className="tag">{s.stateHint}</span>}
            </div>
            <p style={{ margin: '8px 0 0' }}>{s.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

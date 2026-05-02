import { useState } from 'react'
import { useStore } from '../store/useStudyStore.js'
import { Button } from '../components/Button.jsx'
import styles from './OnboardingOverlay.module.css'

export function OnboardingOverlay() {
  const store = useStore()
  const s = store.getSnapshot().settings
  const [step, setStep] = useState(0)
  if (s.onboardingComplete) return null

  const finish = (goal) => {
    store.setSettings({ dailyGoal: goal, onboardingComplete: true })
  }

  return (
    <div className={styles.overlay} role="dialog" aria-label="Welcome">
      {step === 0 && (
        <div className={styles.panel}>
          <h2 className={styles.h}>How it works</h2>
          <p className={styles.p}>Each day you'll review questions you've seen before. Knew it? It comes back later. Didn't? It comes back sooner.</p>
          <Button fullWidth onClick={() => setStep(1)}>Continue</Button>
        </div>
      )}
      {step === 1 && (
        <div className={styles.panel}>
          <h2 className={styles.h}>Pick a daily goal</h2>
          <div className={styles.goals}>
            {[10, 20, 30].map(g => (
              <button key={g} className={styles.goal} onClick={() => finish(g)}>{g} cards</button>
            ))}
          </div>
          <button className={styles.skip} onClick={() => finish(20)}>Skip</button>
        </div>
      )}
    </div>
  )
}

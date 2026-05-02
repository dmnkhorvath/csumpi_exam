import { useState } from 'react'
import { useStudyStore } from '../store/useStudyStore.js'
import { studyStore } from '../store/studyStore.js'
import { Card } from '../components/Card.jsx'
import { Button } from '../components/Button.jsx'
import styles from './SettingsPage.module.css'

const GOALS = [10, 20, 30]

export default function SettingsPage() {
  const snap = useStudyStore()
  const store = studyStore()
  const s = snap.settings
  const [confirming, setConfirming] = useState(false)

  const onExport = () => {
    const blob = new Blob([store.exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'csumpi-progress.json'; a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try { store.importData(String(reader.result)) }
      catch (e) { alert('Import failed: ' + e.message) }
    }
    reader.readAsText(file)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>

      <Card>
        <label className={styles.field}>
          <span>Your name</span>
          <input value={s.userName} onChange={e => store.setSettings({ userName: e.target.value })} className={styles.input} />
        </label>
      </Card>

      <Card>
        <h2 className={styles.h2}>Daily goal</h2>
        <div className={styles.goals}>
          {GOALS.map(g => (
            <button
              key={g}
              className={styles.goal}
              data-active={s.dailyGoal === g}
              onClick={() => store.setSettings({ dailyGoal: g })}
            >{g}</button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className={styles.h2}>Data</h2>
        <div className={styles.btnRow}>
          <Button variant="ghost" onClick={onExport}>Export JSON</Button>
          <label className={styles.importLabel}>
            <span>Import JSON</span>
            <input type="file" accept="application/json" onChange={e => e.target.files?.[0] && onImport(e.target.files[0])} />
          </label>
        </div>
      </Card>

      <Card>
        <h2 className={styles.h2}>Reset</h2>
        {!confirming ? (
          <Button variant="ghost" onClick={() => setConfirming(true)}>Reset progress…</Button>
        ) : (
          <div className={styles.btnRow}>
            <Button variant="danger" onClick={() => { store.reset(); setConfirming(false) }}>Yes, reset everything</Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        )}
      </Card>
    </div>
  )
}

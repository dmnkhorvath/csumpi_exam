import { useEffect, useState, lazy, Suspense } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { allCategories } from '../domain/categories.js'
import { loadCategoryGroups } from '../data/examData.js'
import { groupsToCardDescriptors } from '../data/deckBuilder.js'
import { pickCanonical } from '../domain/similarityGroup.js'
import { Button } from '../components/Button.jsx'
import { RevealPanel } from '../components/RevealPanel.jsx'
import styles from './QuestionSheet.module.css'

const Markdown = lazy(() => import('../components/Markdown.jsx'))

export default function QuestionSheet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const decoded = decodeURIComponent(id)
  const [descriptor, setDescriptor] = useState(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all(allCategories().map(c =>
      loadCategoryGroups(c).then(groups => groupsToCardDescriptors({ groups }, c.slug))
    )).then(parts => {
      if (cancelled) return
      const found = parts.flat().find(d => d.id === decoded)
      setDescriptor(found || null)
    })
    return () => { cancelled = true }
  }, [decoded])

  const onClose = () => navigate(-1)
  const canonical = descriptor ? pickCanonical(descriptor.members) : null
  const variants = descriptor && canonical
    ? descriptor.members.filter(m => m !== canonical).map(m => m.data?.question_text).filter(Boolean)
    : []

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.sheet}>
          <Dialog.Title className={styles.title}>Question</Dialog.Title>
          {canonical ? (
            <>
              <div className={`${styles.text} markdown`}>
                <Suspense fallback={<p>{canonical.data?.question_text}</p>}>
                  <Markdown>{canonical.data?.question_text}</Markdown>
                </Suspense>
              </div>
              {canonical.data?.options?.length > 0 && (
                <ul className={`${styles.options} markdown`}>
                  {canonical.data.options.map((o, i) => (
                    <li key={i}>
                      <Suspense fallback={o}>
                        <Markdown>{o}</Markdown>
                      </Suspense>
                    </li>
                  ))}
                </ul>
              )}
              {revealed
                ? <RevealPanel answer={canonical.data?.correct_answer} variants={variants} />
                : <Button fullWidth onClick={() => setRevealed(true)}>Show answer</Button>}
            </>
          ) : (
            <p className={styles.text}>Loading…</p>
          )}
          <div className={styles.close}><Button variant="ghost" onClick={onClose}>Close</Button></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

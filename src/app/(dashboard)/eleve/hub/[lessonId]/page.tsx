import { notFound } from 'next/navigation'
import { LessonView } from '@/components/hub/LessonView'
import { findLesson } from '@/hooks/useLessons'

interface Props {
  params: Promise<{ lessonId: string }>
}

export default async function EleveLessonPage({ params }: Props) {
  const { lessonId } = await params
  const lesson = findLesson(lessonId)
  if (!lesson) notFound()
  return <LessonView lesson={lesson} hubBasePath="/eleve/hub" />
}

export async function generateMetadata({ params }: Props) {
  const { lessonId } = await params
  const lesson = findLesson(lessonId)
  return {
    title: lesson ? `${lesson.title} — Hub` : 'Leçon introuvable',
    description: lesson?.description ?? '',
  }
}

import { createRouter, createWebHashHistory } from 'vue-router'
import { ROUTES } from '@/constants'

const SplashScreen = () => import('@/views/SplashScreen.vue')
const MainLayout = () => import('@/layouts/MainLayout.vue')
const HomeView = () => import('@/views/HomeView.vue')
const LessonScreen = () => import('@/components/ui/LessonScreen.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const ExamSession = () => import('@/views/ExamSession.vue')
const RadicalsView = () => import('@/views/RadicalsView.vue')
const SettingsView = () => import('@/views/SettingsView.vue')
const PacksView = () => import('@/views/PacksView.vue')
const GlossaryView = () => import('@/views/GlossaryView.vue')
const PracticeView = () => import('@/views/PracticeView.vue')
const PackEdit = () => import('@/views/PackEdit.vue')
const PackStudy = () => import('@/views/PackStudy.vue')
const SelectWordsView = () => import('@/views/SelectWordsView.vue')
const ReviewSession = () => import('@/views/ReviewSession.vue')
const AssistantView = () => import('@/views/AssistantView.vue') // новая страница

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: ROUTES.SPLASH, name: 'splash', component: SplashScreen },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', redirect: '/main' },
        { path: 'main', name: 'home', component: HomeView, meta: { showHotbar: true } },
        { path: 'main/review', redirect: '/practice' },
        { path: 'main/texts', redirect: '/practice' },
        { path: 'main/exams', redirect: '/practice' },
        { path: 'practice', name: 'practice', component: PracticeView, meta: { showHotbar: false } },
        { path: 'profile', name: 'profile', component: ProfileView, meta: { showHotbar: false } },
        { path: 'radicals', name: 'radicals', component: RadicalsView, meta: { showHotbar: false } },
        { path: 'main/packs', name: 'packs', component: PacksView, meta: { showHotbar: false } },
        { path: 'glossary', name: 'glossary', component: GlossaryView, meta: { showHotbar: false } },
        { path: 'settings', name: 'settings', component: SettingsView, meta: { showHotbar: false } },
      ]
    },
    { path: ROUTES.LESSON(':id'), name: 'lesson', component: LessonScreen, props: true, meta: { showHotbar: false } },
    { path: ROUTES.EXAM(':id'), name: 'exam', component: ExamSession, props: true, meta: { showHotbar: false } },
    { path: '/pack/new', name: 'pack-create', component: PackEdit, meta: { showHotbar: false } },
    { path: '/pack/:packId/edit', name: 'pack-edit', component: PackEdit, props: true, meta: { showHotbar: false } },
    { path: '/pack/:packId/study', name: 'pack-study', component: PackStudy, props: true, meta: { showHotbar: false } },
    { path: '/pack/select-words', name: 'pack-select-words', component: SelectWordsView, meta: { showHotbar: false } },
    { path: '/review-session', name: 'review-session', component: ReviewSession, meta: { showHotbar: false } },
    // НОВЫЙ МАРШРУТ ДЛЯ АССИСТЕНТА
    { path: ROUTES.ASSISTANT, name: 'assistant', component: AssistantView, meta: { showHotbar: false } },
  ]
})

export default router
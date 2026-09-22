import { request } from './client';
import type {
  CompetitionListItem,
  CompetitionView,
  DemoUser,
  Lang,
  StartRegistrationResponse,
  Testimonial,
} from './types';

export interface ApiContext {
  userId: string | null;
  lang: Lang;
}

/** All endpoints used by the Competition Details screen, bound to the current user + language. */
export function createCompetitionApi({ userId, lang }: ApiContext) {
  const base = { userId, lang };
  const q = `lang=${lang}`;

  return {
    getCompetition: (id: string) => request<CompetitionView>(`/api/v1/competitions/${id}?${q}`, base),

    startRegistration: (id: string) =>
      request<StartRegistrationResponse>(`/api/v1/competitions/${id}/registrations`, { ...base, method: 'POST' }),

    verifyPayment: (id: string, body: { orderId: string; paymentId: string; signature: string }) =>
      request<{ registration: { id: string; status: string }; outcome: string }>(
        `/api/v1/competitions/${id}/registrations/verify`,
        { ...base, method: 'POST', body }
      ),

    cancelPendingRegistration: (id: string) =>
      request<{ cancelled: boolean }>(`/api/v1/competitions/${id}/registrations/pending`, { ...base, method: 'DELETE' }),

    submitEntry: (id: string, body: { videoUrl: string; caption?: string }) =>
      request<{ submission: { videoUrl: string; submittedAt: string; version: number } }>(
        `/api/v1/competitions/${id}/submission`,
        { ...base, method: 'POST', body }
      ),

    getTestimonials: (cursor?: string) =>
      request<{ testimonials: Testimonial[]; nextCursor: string | null }>(
        `/api/v1/testimonials?${q}&limit=10${cursor ? `&cursor=${cursor}` : ''}`,
        base
      ),

    // --- demo helpers (backend ENABLE_DEV_ROUTES=true) ---
    listCompetitions: () => request<{ competitions: CompetitionListItem[] }>(`/api/v1/competitions?${q}`, base),
    listDemoUsers: () => request<{ users: DemoUser[] }>(`/api/v1/dev/users`),
  };
}

export type CompetitionApi = ReturnType<typeof createCompetitionApi>;

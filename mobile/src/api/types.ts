export type Lang = 'en' | 'hi';

export type CountdownKey =
  | 'REGISTRATION_CLOSES_IN'
  | 'REGISTRATION_OPENS_IN'
  | 'SUBMISSION_STARTS_IN'
  | 'SUBMISSION_ENDS_IN'
  | 'RESULT_IN';

export type CtaAction = 'REGISTER' | 'RESUME_PAYMENT' | 'UPLOAD_SUBMISSION' | 'NONE';

export interface Cta {
  action: CtaAction;
  key: string;
  subKey: string | null;
  enabled: boolean;
  params: Record<string, string>;
}

export interface Countdown {
  key: CountdownKey;
  targetAt: string;
  hurry: boolean;
}

export type ImportantDateKey = 'REGISTER_BEFORE' | 'SUBMISSION_STARTS' | 'SUBMISSION_ENDS' | 'RESULT_DATE';

export interface Judge {
  name: string;
  title: string;
  experienceYears: number;
  photoUrl: string | null;
  introVideoUrl: string | null;
}

export interface PreviousWinner {
  name: string;
  position: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
}

export interface Reward {
  position: number;
  amount: number;
}

export interface CompetitionView {
  serverTime: string;
  id: string;
  title: string;
  category: { key: string; label: string };
  format: 'SINGLE_WIN' | 'MULTI_WIN';
  hasCertificate: boolean;
  status: 'PUBLISHED' | 'CANCELLED';
  phase: 'UPCOMING' | 'ACTIVE' | 'JUDGING' | 'RESULT' | 'CANCELLED';
  prizePool: number;
  entryFee: number;
  currency: 'INR';
  spots: { total: number; booked: number; left: number };
  viewer: {
    registration: { status: 'PENDING_PAYMENT' | 'CONFIRMED'; holdExpiresAt: string | null } | null;
    submission: { videoUrl: string; submittedAt: string; version: number } | null;
  };
  windows: {
    registration: { opensAt: string | null; closesAt: string; upcoming: boolean; open: boolean; closed: boolean };
    submission: { opensAt: string | null; closesAt: string; upcoming: boolean; open: boolean; closed: boolean };
    result: { at: string; declared: boolean };
  };
  countdown: Countdown | null;
  importantDates: { key: ImportantDateKey; at: string | null }[];
  judge: Judge | null;
  previousWinners: PreviousWinner[];
  tabs: {
    about: string[];
    judgingParameters: { name: string; weight: number }[];
    rules: string[];
  };
  rewards: Reward[];
  links: { prizeVideoUrl: string | null; refundPolicyUrl: string | null };
  referral: { link: string; rewardPerSignup: number };
  ad: { imageUrl: string; targetUrl: string | null } | null;
  cta: Cta;
}

export interface PaymentInfo {
  provider: 'mock' | 'razorpay';
  orderId: string;
  amountPaise: number;
  currency: 'INR';
  keyId: string;
  description?: string;
}

export interface StartRegistrationResponse {
  registration: { id: string; status: 'PENDING_PAYMENT' | 'CONFIRMED'; holdExpiresAt: string | null };
  payment: PaymentInfo | null;
}

export interface Testimonial {
  id: string;
  userName: string;
  avatarUrl: string | null;
  rating: number;
  text: string;
  competitionTitle: string | null;
}

export interface DemoUser {
  id: string;
  name: string;
  referralCode: string;
}

export interface CompetitionListItem {
  id: string;
  title: string;
  category: string;
  spotsLeft: number;
}

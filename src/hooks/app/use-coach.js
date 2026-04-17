/**
 * Barrel file — re-exports all coach hooks from their focused modules.
 * Existing imports like `import { useCoachClients } from '@/hooks/app/use-coach'`
 * continue to work without any changes.
 */
export {
  COACH_DASHBOARD_QUERY_KEY,
  COACH_CLIENTS_QUERY_KEY,
  COACH_CLIENT_DETAIL_QUERY_KEY,
  COACH_CLIENT_SUMMARY_QUERY_KEY,
  COACH_CLIENT_REMINDERS_QUERY_KEY,
  COACH_CLIENT_NOTES_QUERY_KEY,
  COACH_MEAL_PLANS_QUERY_KEY,
  COACH_WORKOUT_PLANS_QUERY_KEY,
  COACH_PROGRAMS_QUERY_KEY,
  COACH_PAYMENTS_QUERY_KEY,
  COACH_GROUPS_QUERY_KEY,
  COACH_SNIPPETS_QUERY_KEY,
  COACH_AVAILABILITY_QUERY_KEY,
  COACH_TELEGRAM_QUERY_KEY,
} from "./use-coach-query-keys";

export { useCoachDashboard } from "./use-coach-dashboard";
export {
  useCoachClients,
  useCoachClientDetail,
  useCoachClientNotes,
  useCoachClientReminders,
  useCoachClientSummary,
} from "./use-coach-clients";
export {
  useCoachPaymentActions,
  useCoachPaymentLedger,
  useCoachPayments,
  useCoachPaymentStats,
} from "./use-coach-payments";
export { useCoachMealPlans } from "./use-coach-meal-plans";
export { useCoachWorkoutPlans } from "./use-coach-workout-plans";
export { useCoachPrograms } from "./use-coach-programs";
export { useCoachGroups } from "./use-coach-groups";
export { useCoachSnippets } from "./use-coach-snippets";
export { useCoachAvailability } from "./use-coach-availability";
export {
  useCoachPaymentProfile,
  useSaveCoachPaymentProfile,
} from "./use-coach-payment-profile";

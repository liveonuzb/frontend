import React from "react";
import { compact, find, get, isArray, map, some } from "lodash";
import { useGetQuery } from "@/hooks/api";
import useMealPlan from "@/hooks/app/use-meal-plan";
import { getApiResponseData } from "@/lib/api-response";
import { normalizeUserOnboarding } from "@/lib/user-onboarding";
import { getFriendItems } from "@/modules/user/lib/friends-response";
import { deriveWorkoutPlanMetrics } from "../workout/utils";
import {
  buildCommunityChallenge,
  DASHBOARD_CHALLENGES_QUERY_KEY,
  DASHBOARD_FRIENDS_QUERY_KEY,
  DASHBOARD_HEALTH_GOALS_QUERY_KEY,
  DASHBOARD_MEASUREMENTS_QUERY_KEY,
  DASHBOARD_ME_QUERY_KEY,
  DASHBOARD_WORKOUT_PLANS_QUERY_KEY,
  getDashboardDayQueryKey,
  getDayDataFromResponse,
  getGoalsStateFromResponses,
  getMeasurementSnapshot,
  getUserFromResponse,
} from "./query-helpers.js";

const getItemsFromResponse = (response) => {
  const payload = getApiResponseData(response, []);
  return isArray(payload) ? payload : get(payload, "items", []);
};

const isBootstrapping = (query) =>
  Boolean(get(query, "isLoading") && get(query, "data") === undefined);

const isMissingDataError = (query) =>
  Boolean(get(query, "isError") && get(query, "data") === undefined);

const refetchQueries = (queries = []) =>
  Promise.all(
    compact(
      map(queries, (query) =>
        typeof get(query, "refetch") === "function" ? query.refetch() : null,
      ),
    ),
  );

export default function useDashboardData(dateKey) {
  const userQuery = useGetQuery({
    url: "/users/me",
    queryProps: {
      queryKey: DASHBOARD_ME_QUERY_KEY,
    },
  });
  const dayQuery = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
    queryProps: {
      queryKey: getDashboardDayQueryKey(dateKey),
      enabled: Boolean(dateKey),
    },
  });
  const goalsQuery = useGetQuery({
    url: "/health-goals",
    queryProps: {
      queryKey: DASHBOARD_HEALTH_GOALS_QUERY_KEY,
    },
  });
  const measurementsQuery = useGetQuery({
    url: "/measurements",
    queryProps: {
      queryKey: DASHBOARD_MEASUREMENTS_QUERY_KEY,
    },
  });
  const workoutPlansQuery = useGetQuery({
    url: "/user/workout/plans",
    queryProps: {
      queryKey: DASHBOARD_WORKOUT_PLANS_QUERY_KEY,
    },
  });
  const friendsQuery = useGetQuery({
    url: "/users/me/friends",
    queryProps: {
      queryKey: DASHBOARD_FRIENDS_QUERY_KEY,
    },
  });
  const challengesQuery = useGetQuery({
    url: "/challenges",
    queryProps: {
      queryKey: DASHBOARD_CHALLENGES_QUERY_KEY,
    },
  });
  const mealPlanQuery = useMealPlan();
  const userData = userQuery.data;
  const dayDataResponse = dayQuery.data;
  const goalsData = goalsQuery.data;
  const measurementsData = measurementsQuery.data;
  const workoutPlansData = workoutPlansQuery.data;
  const friendsData = friendsQuery.data;
  const challengesData = challengesQuery.data;

  const user = React.useMemo(() => getUserFromResponse(userData), [userData]);
  const onboarding = React.useMemo(
    () => normalizeUserOnboarding(get(user, "onboarding")),
    [user],
  );
  const dayData = React.useMemo(
    () => getDayDataFromResponse(dayDataResponse, dateKey),
    [dateKey, dayDataResponse],
  );
  const goalsState = React.useMemo(
    () =>
      getGoalsStateFromResponses({
        goalsResponse: goalsData,
        user,
      }),
    [goalsData, user],
  );
  const measurements = React.useMemo(
    () => getApiResponseData(measurementsData, []),
    [measurementsData],
  );
  const measurementSnapshot = React.useMemo(
    () =>
      getMeasurementSnapshot({
        history: measurements,
        onboarding,
      }),
    [measurements, onboarding],
  );
  const workoutPayload = React.useMemo(
    () => getApiResponseData(workoutPlansData, {}),
    [workoutPlansData],
  );
  const workoutPlans = React.useMemo(
    () =>
      isArray(get(workoutPayload, "items")) ? get(workoutPayload, "items") : [],
    [workoutPayload],
  );
  const activeWorkoutPlan = React.useMemo(() => {
    const activePlanId = get(workoutPayload, "activePlanId", null);
    return deriveWorkoutPlanMetrics(
      find(workoutPlans, (plan) => get(plan, "id") === activePlanId) || null,
    );
  }, [workoutPayload, workoutPlans]);
  const friends = React.useMemo(
    () => getFriendItems(friendsData),
    [friendsData],
  );
  const challenges = React.useMemo(
    () => getItemsFromResponse(challengesData),
    [challengesData],
  );
  const currentChallenge = React.useMemo(
    () =>
      buildCommunityChallenge({
        challenges,
        friends,
        userId: get(user, "id"),
      }),
    [challenges, friends, user],
  );

  const coreQueries = [userQuery, dayQuery, goalsQuery];
  const supportingQueries = [
    measurementsQuery,
    workoutPlansQuery,
    friendsQuery,
    challengesQuery,
    mealPlanQuery,
  ];
  const allQueries = [...coreQueries, ...supportingQueries];

  return {
    user,
    onboarding,
    dayData,
    goalsState,
    measurementSnapshot,
    activeMealPlan: get(mealPlanQuery, "activePlan", null),
    activeWorkoutPlan,
    friends,
    challenges,
    currentChallenge,
    isCoreLoading: some(coreQueries, isBootstrapping),
    hasCoreError: some(coreQueries, isMissingDataError),
    hasSupportingError: some(supportingQueries, isMissingDataError),
    refetchDashboard: () => refetchQueries(allQueries),
  };
}

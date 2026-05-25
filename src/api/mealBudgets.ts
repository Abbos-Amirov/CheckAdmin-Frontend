import { apiFetch } from '@/api/client';
import type {
  MealBudget,
  MealBudgetsPeriod,
  SaveMealBudgetRequest,
} from '@/types/mealBudget.types';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function unwrapEnvelope<T>(payload: ApiEnvelope<T>): T {
  if (payload && typeof payload === 'object' && payload.data !== undefined) {
    return payload.data;
  }
  return payload as T;
}

export async function fetchMealBudgets(
  year: number,
  month: number,
  token: string,
): Promise<MealBudgetsPeriod> {
  const query = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const response = await apiFetch<ApiEnvelope<MealBudgetsPeriod>>(
    `/admin/meal-budgets?${query.toString()}`,
    { method: 'GET' },
    token,
  );
  return unwrapEnvelope(response);
}

export async function saveMealBudget(
  body: SaveMealBudgetRequest,
  token: string,
): Promise<MealBudget> {
  const response = await apiFetch<ApiEnvelope<MealBudget>>(
    '/admin/meal-budgets',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    token,
  );
  return unwrapEnvelope(response);
}

export type MealBudgetGroupType = 'INSIDE_FACTORY' | 'OUTSIDE_FACTORY';

export type MealBudget = {
  id?: string;
  _id?: string;
  year: number;
  month: number;
  groupType: MealBudgetGroupType;
  totalBudget: number;
  currency: string;
};

export type MealBudgetsPeriod = {
  year: number;
  month: number;
  insideFactory: MealBudget | null;
  outsideFactory: MealBudget | null;
};

export type SaveMealBudgetRequest = {
  year: number;
  month: number;
  groupType: MealBudgetGroupType;
  totalBudget: number;
};

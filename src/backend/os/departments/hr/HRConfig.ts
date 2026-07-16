// src/backend/os/departments/hr/HRConfig.ts
import { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import { Department } from "../../../agents/departments/types";

export const HR_DEPARTMENT_ID: Department = 'hr';

// People Operations Metrics
export const HR_KPIS: DepartmentKPI[] = [
  { name: 'Time to Hire', target: 35, current: 0, unit: 'days' },
  { name: 'Offer Acceptance Rate', target: 85, current: 0, unit: '%' },
  { name: 'New Hire Onboarding Completion', target: 100, current: 0, unit: '%' },
  { name: 'Employee Net Promoter Score (eNPS)', target: 40, current: 0, unit: 'score' }
];

export const HR_BUDGET: DepartmentBudget = {
  allocated: 6000, // Monthly budget for ATS (Greenhouse/Lever), background checks, HRIS APIs
  spent: 0,
  limit: 8000 // Hard cap
};

export const HR_AGENTS = [
  'hr-recruiting-agent',
  'hr-onboarding-agent',
  'hr-culture-agent',
  'hr-compliance-agent'
];

export function initializeHRDepartment() {
  console.log('[HR] Initializing HR Department with OS Governance...');
  
  return {
    id: HR_DEPARTMENT_ID,
    name: 'HR',
    agents: HR_AGENTS,
    budget: HR_BUDGET,
    kpis: HR_KPIS
  };
}
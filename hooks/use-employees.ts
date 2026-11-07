 'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Employee, Department, Position, Branch } from '@/lib/types';

// أعمدة عامة فقط. الراتب والبدلات والحساب البنكي والرقم القومي
// موجودة في employee_salary و employee_identity ولا تُقرأ من هنا.
const EMP_COLUMNS =
  'id, company_id, user_id, employee_code, full_name, email, phone, address, birth_date, marital_status, qualification, hire_date, status, notes, department_id, position_id, branch_id, manager_id, created_at';

const RELATIONS =
  'department:departments!employees_department_id_fkey(*), position:positions(*), branch:branches(*), manager:employees!manager_id(id, full_name, employee_code)';

export function useEmployees() {
  const { company, companyRole, loading: authLoading } = useAuth();
  // المالك و hr_manager فقط يرون ويكتبون البيانات المالية والهوية
  const canSeeSensitive = companyRole === 'owner' || companyRole === 'hr_manager';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (authLoading) { setLoading(true); return; }
    if (!company) {
      setEmployees([]); setDepartments([]); setPositions([]); setBranches([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [empRes, depRes, posRes, brRes] = await Promise.all([
      supabase.from('employees').select(`${EMP_COLUMNS}, ${RELATIONS}`).eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('departments').select('*').eq('company_id', company.id).order('name'),
      supabase.from('positions').select('*').eq('company_id', company.id).order('title'),
      supabase.from('branches').select('*').eq('company_id', company.id).order('name'),
    ]);
    if (empRes.error) setError(empRes.error.message);
    setEmployees((empRes.data ?? []) as unknown as Employee[]);
    setDepartments((depRes.data ?? []) as Department[]);
    setPositions((posRes.data ?? []) as Position[]);
    setBranches((brRes.data ?? []) as Branch[]);
    setLoading(false);
  }, [company, authLoading]);

  useEffect(() => { load(); }, [load]);

  const addEmployeeLocal = useCallback((emp: Employee) => {
    setEmployees((prev) => [emp, ...prev]);
  }, []);

  const deleteEmployeeLocal = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateEmployeeLocal = useCallback((id: string, patch: Partial<Employee>) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  return {
    employees, departments, positions, branches,
    loading, error, reload: load,
    usingMock: false,
    canSeeSensitive,
    addEmployeeLocal, deleteEmployeeLocal, updateEmployeeLocal,
  };
}
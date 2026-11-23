/**
 * Definisi Tipe Database Supabase untuk FinTrack
 * Sesuai dengan skema yang dibuat di supabase/schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          username: string | null;
          avatar: string | null;
          monthly_budget: number;
          savings_goal_name: string | null;
          savings_goal_amount: number | null;
          currency: string;
          currency_symbol: string;
          date_format: string;
          theme: 'light' | 'dark' | 'system';
          language: 'id' | 'en';
          financial_period_start_day: number;
          notifications: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          username?: string | null;
          avatar?: string | null;
          monthly_budget?: number;
          savings_goal_name?: string | null;
          savings_goal_amount?: number | null;
          currency?: string;
          currency_symbol?: string;
          date_format?: string;
          theme?: 'light' | 'dark' | 'system';
          language?: 'id' | 'en';
          financial_period_start_day?: number;
          notifications?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          username?: string | null;
          avatar?: string | null;
          monthly_budget?: number;
          savings_goal_name?: string | null;
          savings_goal_amount?: number | null;
          currency?: string;
          currency_symbol?: string;
          date_format?: string;
          theme?: 'light' | 'dark' | 'system';
          language?: 'id' | 'en';
          financial_period_start_day?: number;
          notifications?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          type: 'income' | 'expense';
          color: string;
          icon: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          type: 'income' | 'expense';
          color?: string;
          icon?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          type?: 'income' | 'expense';
          color?: string;
          icon?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          amount: number;
          type: 'income' | 'expense';
          date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          title: string;
          amount: number;
          type: 'income' | 'expense';
          date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          title?: string;
          amount?: number;
          type?: 'income' | 'expense';
          date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          name: string;
          amount: number;
          period: 'daily' | 'weekly' | 'monthly' | 'yearly';
          month: string | null;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          name?: string;
          amount: number;
          period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
          month?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          name?: string;
          amount?: number;
          period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
          month?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          color: string | null;
          icon: string | null;
          is_completed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          color?: string | null;
          icon?: string | null;
          is_completed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          color?: string | null;
          icon?: string | null;
          is_completed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          amount: number;
          type: 'income' | 'expense';
          frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          start_date: string;
          end_date: string | null;
          next_run_date: string | null;
          last_run_date: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          title: string;
          amount: number;
          type: 'income' | 'expense';
          frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          next_run_date?: string | null;
          last_run_date?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          title?: string;
          amount?: number;
          type?: 'income' | 'expense';
          frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          next_run_date?: string | null;
          last_run_date?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

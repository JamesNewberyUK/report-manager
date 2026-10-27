import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type ReportUpdate = Database['public']['Tables']['reports']['Update'];

type Component = Database['public']['Tables']['components']['Row'];
type ComponentInsert = Database['public']['Tables']['components']['Insert'];
type ComponentUpdate = Database['public']['Tables']['components']['Update'];

export const reportService = {
  // Report CRUD operations
  async getReports(userId: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }

    return data || [];
  },

  async getReportById(id: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching report:', error);
      throw error;
    }

    return data;
  },

  async createReport(report: Omit<ReportInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        ...report,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      throw error;
    }

    return data;
  },

  async updateReport(
    id: string,
    updates: Partial<Omit<ReportUpdate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating report:', error);
      throw error;
    }

    return data;
  },

  async deleteReport(id: string): Promise<void> {
    // First delete all components associated with the report
    await supabase.from('components').delete().eq('report_id', id);
    
    // Then delete the report
    const { error } = await supabase.from('reports').delete().eq('id', id);

    if (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  },

  // Component operations
  async getComponents(reportId: string): Promise<Component[]> {
    const { data, error } = await supabase
      .from('components')
      .select('*')
      .eq('report_id', reportId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching components:', error);
      throw error;
    }

    return data || [];
  },

  async createComponent(component: Omit<ComponentInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Component> {
    const { data, error } = await supabase
      .from('components')
      .insert({
        ...component,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating component:', error);
      throw error;
    }

    return data;
  },

  async updateComponent(
    id: string,
    updates: Partial<Omit<ComponentUpdate, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Component> {
    const { data, error } = await supabase
      .from('components')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating component:', error);
      throw error;
    }

    return data;
  },

  async deleteComponent(id: string): Promise<void> {
    const { error } = await supabase.from('components').delete().eq('id', id);

    if (error) {
      console.error('Error deleting component:', error);
      throw error;
    }
  },

  async reorderComponents(reportId: string, newOrder: { id: string; order: number }[]): Promise<void> {
    const updates = newOrder.map((item) =>
      supabase
        .from('components')
        .update({ order: item.order, updated_at: new Date().toISOString() })
        .eq('id', item.id)
    );

    const { error } = await supabase.rpc('batch_update_components_order', {
      updates: newOrder.map((item) => ({
        id: item.id,
        order: item.order,
      })),
    });

    if (error) {
      console.error('Error reordering components:', error);
      throw error;
    }
  },
};

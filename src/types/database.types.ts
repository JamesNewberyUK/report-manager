export type Database = {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string | null;
          user_id?: string;
        };
      };
      components: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          report_id: string;
          name: string;
          type: string;
          content: any; // JSONB field for flexible content
          order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          report_id: string;
          name: string;
          type: string;
          content: any;
          order: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          report_id?: string;
          name?: string;
          type?: string;
          content?: any;
          order?: number;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

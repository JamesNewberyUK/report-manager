export interface ReportComponent {
  id: string;
  name: string;
  wordLimit?: number;
  characterLimit?: number;
  gptPrompt?: string;
  isGptEnabled: boolean;
}

export interface Report {
  id: string;
  name: string;
  market: string;
  audience: string;
  tone: string;
  components: ReportComponent[];
  createdAt: string;
  updatedAt: string;
}

export const defaultReport: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  market: '',
  audience: '',
  tone: '',
  components: [],
};

export const defaultComponent: Omit<ReportComponent, 'id'> = {
  name: '',
  isGptEnabled: false,
};

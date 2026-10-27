import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Typography,
  Box,
  TextField,
  Paper,
  Alert,
  Tooltip,
  Switch,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { generateContent } from '../../services/geminiService';

interface ReportComponentType {
  id: string;
  name: string;
  isGptEnabled: boolean;
  gptPrompt?: string;
  wordLimit?: number;
}

interface ReportComponentProps {
  component: ReportComponentType;
  result: string;
}

const ReportComponent: React.FC<ReportComponentProps> = ({ component, result }) => (
  <Box key={component.id} mb={3}>
    <Typography variant="subtitle1" color="primary" gutterBottom>
      {component.name}
    </Typography>
    <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap' }}>
      {result}
    </Paper>
  </Box>
);

interface RunReportDialogProps {
  open: boolean;
  onClose: () => void;
  report: {
    id: string;
    name: string;
    market: string;
    audience: string;
    tone: string;
    components: ReportComponentType[];
  } | null;
}

interface RunReportDialogProps {
  open: boolean;
  onClose: () => void;
  report: any;
}

interface ReportFormData {
  outputTitle: string;
  useDateRange: boolean;
  startDate: Date | null;
  endDate: Date | null;
  useAdditionalPrompt: boolean;
  additionalPrompt: string;

}

const RunReportDialog = ({ open, onClose, report }: RunReportDialogProps) => {
  console.log('RunReportDialog render - open:', open, 'report:', report?.id);
  
  // Track component mounts/unmounts
  useEffect(() => {
    console.log('RunReportDialog mounted');
    return () => {
      console.log('RunReportDialog unmounted');
    };
  }, []);
  
  // Track window visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('Visibility changed - document.hidden:', document.hidden);
    };
    
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => console.log('Window focused'));
    window.addEventListener('blur', () => console.log('Window blurred'));
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => console.log('Window focused'));
      window.removeEventListener('blur', () => console.log('Window blurred'));
    };
  }, []);
  const [isRunning, setIsRunning] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [runResults, setRunResults] = useState<{[key: string]: string}>({});
  const [runTime, setRunTime] = useState<string>('');
  
  // Refs to track state without causing re-renders
  const currentReportIdRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const renderCount = useRef(0);
  
  renderCount.current += 1;
  console.log(`RunReportDialog render count: ${renderCount.current}`);
  
  // Initialize form data
  const [formData, setFormData] = useState<ReportFormData>({
    outputTitle: report ? `${report.name} - ${new Date().toLocaleDateString()}` : '',
    useDateRange: false,
    startDate: null,
    endDate: null,
    useAdditionalPrompt: false,
    additionalPrompt: ''
  });
  
  // Handle report changes and initial mount
  useEffect(() => {
    if (report && report.id !== currentReportIdRef.current) {
      console.log('Report changed, resetting form data');
      currentReportIdRef.current = report.id;
      
      setFormData({
        outputTitle: `${report.name} - ${new Date().toLocaleDateString()}`,
        useDateRange: false,
        startDate: null,
        endDate: null,
        useAdditionalPrompt: false,
        additionalPrompt: ''
      });
      
      // Only clear results if this isn't the initial mount
      if (!isInitialMount.current) {
        setRunResults({});
        setRunTime('');
        setError(null);
      }
    }
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
    
    return () => {
      // Cleanup function runs when component unmounts or before re-running the effect
      if (!open) {
        currentReportIdRef.current = null;
      }
    };
  }, [report, open]);
  
  const exportToHtml = useCallback(() => {
    const logoBase64 = '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';
    const logoUrl = `data:image/png;base64,${logoBase64}`;
    const startDate = formData.startDate?.toLocaleDateString() || '';
    const endDate = formData.endDate?.toLocaleDateString() || '';
    const dateRange = formData.useDateRange && (startDate || endDate)
      ? `Date Range: ${startDate}${startDate && endDate ? ' to ' : ''}${endDate}`
      : '';
    
    let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${formData.outputTitle || 'Report'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .logo { max-width: 200px; margin-bottom: 20px; }
        .report-title { color: #2c3e50; margin: 10px 0; font-size: 1.5em; }
        .metadata { color: #7f8c8d; font-size: 0.9em; margin-bottom: 20px; }
        .component { margin-bottom: 30px; }
        .component-title { color: #211838; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
        .component-content { white-space: pre-wrap; }
        .footer { margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 0.8em; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #211838; font-weight: bold; margin-bottom: 20px;">n8 Capital Report</h1>
        <h1 class="report-title">${formData.outputTitle || 'Report'}</h1>
        <div class="metadata">
          <div>Generated on: ${runTime}</div>
          ${dateRange ? `<div>${dateRange}</div>` : ''}
        </div>
      </div>
    `;

    // Add components to the HTML
    (report?.components || [] as ReportComponent[]).forEach((component: ReportComponent) => {
      if (runResults[component.id]) {
        htmlContent += `
          <div class="component">
            <h2 class="component-title">${component.name}</h2>
            <div class="component-content">${runResults[component.id]}</div>
          </div>
        `;
      }
    });

    // Close HTML
    htmlContent += `
      <div class="footer">
        <p>Report generated by Report Manager</p>
      </div>
    </body>
    </html>`;

    // Create and trigger download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.outputTitle || 'report'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [formData.outputTitle, formData.useDateRange, formData.startDate, formData.endDate, report?.components, runResults, runTime]);


  const handleInputChange = useCallback((field: keyof ReportFormData, value: any) => {
    console.log(`handleInputChange - field: ${field}, value:`, value);
    setFormData(prev => {
      const newState = {
        ...prev,
        [field]: value
      };
      console.log('New formData state:', newState);
      return newState;
    });
  }, []);


  const handleRunReport = useCallback(async () => {
    if (!report) return;
    
    if (!apiKey) {
      setError('Please enter your Google Gemini API key');
      return;
    }

    setIsRunning(true);
    setError(null);
    setRunResults({});

    // Get the latest form data to avoid stale closure
    const currentFormData = formData;
    console.log('Running report with form data:', currentFormData);

    try {
      const results: {[key: string]: string} = {};
      
      // Run each component's prompt through Gemini
      for (const component of report.components || []) {
        if (component.isGptEnabled && component.gptPrompt) {
          try {
            let prompt = '';
            console.log('Date debug - useDateRange:', currentFormData.useDateRange);
            console.log('Date debug - startDate:', currentFormData.startDate);
            console.log('Date debug - endDate:', currentFormData.endDate);
            
            if ((currentFormData.useDateRange || currentFormData.startDate || currentFormData.endDate) && 
                (currentFormData.startDate || currentFormData.endDate)) {
              const formatDate = (date: Date | null) => {
                if (!date) return 'start/end date';
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'long' });
                const year = date.getFullYear();
                // Add ordinal suffix
                const j = day % 10, k = day % 100;
                const suffix = (j === 1 && k !== 11) ? 'st' :
                             (j === 2 && k !== 12) ? 'nd' :
                             (j === 3 && k !== 13) ? 'rd' : 'th';
                return `${day}${suffix} ${month} ${year}`;
              };
              
              const startDate = currentFormData.startDate ? formatDate(currentFormData.startDate) : 'start date';
              const endDate = currentFormData.endDate ? formatDate(currentFormData.endDate) : 'end date';
              const dateRangeText = `You are preparing an investor report for the period from ${startDate} to ${endDate}.`;
              console.log('Date debug - dateRangeText:', dateRangeText);
              prompt += dateRangeText + '\n\n';
            }
            prompt += `Context: ${report.market || 'N/A'}\n` +
                     `Audience: ${report.audience || 'N/A'}\n` +
                     `Tone: ${report.tone || 'N/A'}\n` +
                     `Component: ${component.name}\n\n` +
                     `Instructions: ${component.gptPrompt}\n`;
            
            if (component.wordLimit) {
              prompt += `Word limit: ${component.wordLimit}\n`;
            }
            
            if (currentFormData.useAdditionalPrompt && currentFormData.additionalPrompt) {
              prompt += `\nAdditional Instructions: ${currentFormData.additionalPrompt}`;
            }
            
            const response = await generateContent(
              apiKey,
              prompt,
              undefined // model (use default)
            );
            results[component.id] = response.text;
          } catch (err) {
            console.error(`Error running component ${component.name}:`, err);
            results[component.id] = `Error: ${err instanceof Error ? err.message : 'Failed to generate content'}`;
          }
        }
      }
      
      setRunResults(results);
      setRunTime(new Date().toLocaleString());
    } catch (err) {
      console.error('Error running report:', err);
      setError(`Failed to run report: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  }, [apiKey, formData, report]); // Include entire formData in dependencies



  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      disableRestoreFocus
      disableEnforceFocus
    >
      <DialogTitle>Run Report</DialogTitle>
      <DialogContent>
        <Box py={2}>
          <TextField
            fullWidth
            label="Gemini API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            margin="normal"
            disabled={isRunning}
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Output Title"
            value={formData.outputTitle}
            onChange={(e) => handleInputChange('outputTitle', e.target.value)}
            margin="normal"
            disabled={isRunning}
          />
          {formData.useDateRange && (
            <Box display="flex" gap={2} my={2}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  handleInputChange('startDate', e.target.value ? new Date(e.target.value) : null);
                  if (!formData.useDateRange) {
                    handleInputChange('useDateRange', true);
                  }
                }}
                disabled={isRunning}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                label="End Date"
                type="date"
                value={formData.endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  handleInputChange('endDate', e.target.value ? new Date(e.target.value) : null);
                  if (!formData.useDateRange) {
                    handleInputChange('useDateRange', true);
                  }
                }}
                disabled={isRunning}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Box>
          )}

          <Box my={2}>
            <Button
              variant="outlined"
              onClick={() => handleInputChange('useDateRange', !formData.useDateRange)}
              disabled={isRunning}
            >
              {formData.useDateRange ? 'Remove Date Range' : 'Add Date Range'}
            </Button>
          </Box>

<Box my={2}>
            <Button
              variant="outlined"
              onClick={() => handleInputChange('useAdditionalPrompt', !formData.useAdditionalPrompt)}
              disabled={isRunning}
            >
              {formData.useAdditionalPrompt ? 'Remove Additional Instructions' : 'Add Additional Instructions'}
            </Button>
          </Box>

          {formData.useAdditionalPrompt && (
            <TextField
              fullWidth
              label="Additional Instructions"
              value={formData.additionalPrompt}
              onChange={(e) => handleInputChange('additionalPrompt', e.target.value)}
              multiline
              rows={4}
              margin="normal"
              disabled={isRunning}
            />
          )}
          
          {Object.keys(runResults).length > 0 && (
            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Report Results
              </Typography>
              {(report?.components || [] as ReportComponentType[])
                .filter((c: ReportComponentType) => c.isGptEnabled && c.gptPrompt && runResults[c.id])
                .map((component: ReportComponentType) => (
                  <ReportComponent 
                    key={component.id}
                    component={component} 
                    result={runResults[component.id]} 
                  />
                ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={isRunning}
          variant="outlined"
        >
          Close
        </Button>
        {Object.keys(runResults).length > 0 && (
          <Tooltip title="Export as HTML">
            <Button
              variant="contained"
              color="primary"
              onClick={exportToHtml}
              startIcon={<FileDownloadIcon />}
              disabled={isRunning}
              sx={{ ml: 1 }}
            >
              Export
            </Button>
          </Tooltip>
        )}
        <Button
          onClick={handleRunReport}
          variant="contained"
          color="primary"
          disabled={isRunning || (report?.components || []).filter((c: ReportComponentType) => c.isGptEnabled && c.gptPrompt).length === 0}
          startIcon={isRunning ? <CircularProgress size={20} /> : null}
          sx={{ ml: 1 }}
        >
          {isRunning ? 'Generating...' : 'Generate Report'}
        </Button>
      </DialogActions>
      {error && (
        <DialogContent>
          <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2 }}>
            {error}
          </Alert>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default RunReportDialog;

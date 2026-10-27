import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions as MuiDialogActions,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Report } from '@/types/report';
import { reportService } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';

const ReportsPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const reportsData = await reportService.getReports(user.id);
      
      const transformedData = await Promise.all(reportsData.map(async (report) => {
        let market = '';
        let audience = '';
        let tone = '';
        
        if (report.description) {
          try {
            const desc = JSON.parse(report.description);
            market = desc.market || '';
            audience = desc.audience || '';
            tone = desc.tone || '';
          } catch (e) {
            const parts = report.description.split('|').map(part => part.trim());
            market = parts[0] || '';
            audience = parts[1] || '';
            tone = parts[2] || '';
          }
        }
        
        const components = await reportService.getComponents(report.id);
        
        return {
          id: report.id,
          name: report.title || 'Untitled Report',
          market,
          audience,
          tone,
          components: components || [],
          createdAt: report.created_at,
          updatedAt: report.updated_at,
        };
      }));
      
      setReports(transformedData);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = () => {
    router.push('/reports/new');
  };

  const handleEditReport = (report: Report) => {
    router.push(`/reports/edit/${report.id}`);
  };

  const handleViewReport = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    
    try {
      await reportService.deleteReport(reportToDelete.id);
      setReports(reports.filter(r => r.id !== reportToDelete.id));
      setSuccessMessage('Report deleted successfully');
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Reports
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateReport}
        >
          New Report
        </Button>
      </Box>

      {reports.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No reports found
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Get started by creating a new report.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateReport}
          >
            Create Report
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {report.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {report.market && `${report.market} • `}
                    {report.audience && `${report.audience} • `}
                    {report.tone}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(report.updatedAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <Box display="flex" justifyContent="flex-end" p={2}>
                  <IconButton onClick={() => handleViewReport(report.id)}>
                    <ArrowBackIcon />
                  </IconButton>
                  <IconButton onClick={() => handleEditReport(report)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(report)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{reportToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReportsPage;

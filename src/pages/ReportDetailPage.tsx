import { Box, Typography, Button, CircularProgress, Container } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Report } from '../types/report';

const ReportDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      try {
        // TODO: Replace with actual API call to fetch the report by ID
        await new Promise(resolve => setTimeout(resolve, 1000));
        // For now, we'll just set a mock report
        setReport({
          id: id || '',
          name: 'Sample Report',
          market: 'US',
          audience: 'General',
          tone: 'Professional',
          components: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error loading report:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadReport();
    }
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Report not found
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Reports
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          &larr; Back to Reports
        </Button>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">{report.name}</Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate(`/reports/${id}/edit`)}
          >
            Edit Report
          </Button>
        </Box>
        
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Report Details
          </Typography>
          <Box bgcolor="background.paper" p={3} borderRadius={1} boxShadow={1}>
            <Typography variant="body1">
              <strong>ID:</strong> {report.id}
            </Typography>
            <Typography variant="body1">
              <strong>Created:</strong> {new Date(report.createdAt).toLocaleDateString()}
            </Typography>
            <Typography variant="body1">
              <strong>Last Updated:</strong> {new Date(report.updatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        {/* Additional report content will go here */}
      </Box>
    </Container>
  );
};

export default ReportDetailPage;
